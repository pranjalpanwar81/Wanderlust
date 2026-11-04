if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

// Running as a long-lived server (Render/local) vs. a Netlify Function.
const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (!isServerless) {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION - shutting down');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION - shutting down');
    console.error(reason && reason.stack ? reason.stack : reason);
    process.exit(1);
  });
}

const express = require("express");
const app = express();
const http = require('http');
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema , reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports.upload = upload;

const listingRouter = require("./routes/listing.js");
const reviewrouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

// default to local MongoDB if ATLASDB_URL isn't provided to avoid
// calling mongoose.connect(undefined) which throws an assertion error
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

// Improved connection helper: retry with exponential backoff and redacted logging
async function connectWithRetry(url, { retries = 5, minDelay = 1000 } = {}) {
  const redacted = (() => {
    try {
      if (!url) return '<<no-url-provided>>';
      // show only host information
      const u = new URL(url.replace('mongodb+srv://', 'http://'));
      return `${u.hostname}${u.port ? ':' + u.port : ''}`;
    } catch (e) {
      return '<<invalid-url>>';
    }
  })();

  console.log(`Attempting MongoDB connection to ${redacted}`);

  const opts = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(url, opts);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`Mongo connection attempt ${attempt} failed:`);
      console.error(err && err.message ? err.message : err);
      if (attempt === retries) {
        console.error('All MongoDB connection attempts failed.');
        throw err;
      }
      const delay = minDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

main().catch((err) => {
  console.error('Failed to establish MongoDB connection:');
  console.error(err && err.stack ? err.stack : err);
});

async function main() {
  await connectWithRetry(dbUrl, { retries: 5, minDelay: 1000 });
}
 
app.set("view engine", "ejs");
// When bundled into a Netlify Function, __dirname points at netlify/functions,
// so fall back to the project root (the function's working directory).
const ROOT_DIR = require("fs").existsSync(path.join(__dirname, "views")) ? __dirname : process.cwd();
app.set("views", path.join(ROOT_DIR, "views"));
app.use(express.urlencoded({ extended: true }));  

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
  if (req.query && typeof req.query._method === 'string') {
    return req.query._method;
  }
}));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(ROOT_DIR, "public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET || 'changeme',
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions = {
  secret: process.env.SECRET ,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
  store: store,
};

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user || null;
  next();
});


app.get("/demouser", async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ username: "demouser" });
    if (existingUser) {
      return res.send("Demo user already exists");
    }

    const fakeUser = new User({
      email: "student@gmail.com",
      username: "demouser",
    });
    await User.register(fakeUser, "helloworld");
    res.send("Demo user created");
  } catch (err) {
    next(err);
  }
});

// Redirect root to listings for a proper homepage
app.get('/', (req, res) => {
  return res.redirect('/listings');
});


app.use("/listings/:id/reviews", reviewrouter);
app.use("/listings", listingRouter);
app.use("/listings", bookingRouter);
app.use("/users", userRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  console.error("Error handler caught:", err);
  let {statusCode=500, message="Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.status(statusCode).send(message);
});


module.exports = app;

// Only start the HTTP + Socket.IO server when run directly (`node app.js`).
// On Netlify, netlify/functions/server.js imports `app` instead.
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const server = http.createServer(app);
  const io = require('socket.io')(server);

  // Socket.IO setup for real-time inventory sync
  io.on('connection', (socket) => {
    console.log('Client connected for real-time updates');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Make io accessible to routes
  app.set('io', io);

  server.listen(PORT, () => {
    const dbUsed = (dbUrl && (dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost'))) ? 'local MongoDB' : 'remote MongoDB (ATLAS or cloud)';
    console.log(`main app is listening on port ${PORT} — using ${dbUsed}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other server and try again.`);
      return;
    }

    console.error("main app encountered error:", err);
  });
}
