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

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");

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

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

app.use("/listings/:id/reviews", reviews);
app.use("/listings", listings);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  let {statusCode=500, message="Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.status(statusCode).send(message);
});

// Start server with retry on EADDRINUSE to avoid crashes during rapid restarts
function listenWithRetry(appInstance, port, name = "server", maxRetries = 10, delay = 500) {
  let attempts = 0;
  function start() {
    attempts++;
    const srv = appInstance.listen(port, () => {
      console.log(`${name} is listening to port ${port}`);
    });
    srv.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.error(`${name} port ${port} in use (attempt ${attempts}/${maxRetries}). Retrying in ${delay}ms...`);
        srv.close();
        if (attempts < maxRetries) {
          setTimeout(start, delay);
        } else {
          console.error(`${name} failed to start after ${maxRetries} attempts.`);
        }
      } else {
        console.error(`${name} encountered error:`, err);
      }
    });
  }
  start();
}

listenWithRetry(app, 8080, "main app");
