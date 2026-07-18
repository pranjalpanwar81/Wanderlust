const express = require("express");
const app = express();
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
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewrouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}
 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
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

const normalizeListing = (listing) => {
  if (!listing) return listing;
  if (listing.image && typeof listing.image.url === "string" && !listing.image.url.trim()) {
    delete listing.image;
  }
  return listing;
};
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
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

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

app.use("/listings/:id/reviews", reviewrouter);
app.use("/listings", listingRouter);
app.use("/users", userRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  let {statusCode=500, message="Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.status(statusCode).send(message);
});

const PORT = 8080;

const server = app.listen(PORT, () => {
  console.log(`main app is listening to port ${PORT}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other server and try again.`);
    return;
  }

  console.error("main app encountered error:", err);
});
