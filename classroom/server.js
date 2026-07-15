const express = require("express");
const app = express();
const users = require("./routes/user.js");
const posts = require("./routes/post.js");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
// const cookieParser = require("cookie-parser");

app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const sessionoptions = {
  secret: "mysupersecretstring",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionoptions));
app.use(flash());

// expose flash messages and session data to views
app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  next();
});

app.get("/register", (req, res) => {
  let { name = "anonymous" } = req.query;
  console.log("[register] name=", name);
  req.session.name = name;
  req.flash("success", "User registered successfully!");
  res.redirect("/hello");
});

app.get("/hello", (req, res) => {
  console.log("[hello] session.name=", req.session && req.session.name, "flash=", res.locals.success);
  res.render("page.ejs", { name: req.session && req.session.name, msg: res.locals.success });
});

app.use("/", users);
app.use("/posts", posts);

// app.use(cookieParser("secretcode"));

// app.get("/getsignedcookie", (req, res) => {
//   res.cookie("made-in", "India", { signed: true });
//   res.send("We sent you a signed cookie");
// });

// app.get("/verify", (req, res) => {
//   console.log(req.signedCookies);
//   res.send("Check the console for signed cookies");
// });

// app.get("/getcookies", (req, res) => {
//   res.cookie("greet", "namaste");
//   res.cookie("origin", "India");
//   res.send("We sent you a cookie");
// });

// app.get("/greet", (req, res) => {
//   let {name = 'anonymous'} = req.query;
//   res.send(`Hi, ${name}`);
// });

// app.get("/", (req, res) => {
//   console.log(req.cookies);
//   res.send("Hi, I am root");
// });

// app.use(session({
//   secret: "mysupersecretstring",
//   resave: false,
//   saveUninitialized: true,
// }));

// app.get("/reqcount", (req, res) => {
//   if (!req.session.count) {
//     req.session.count = 1;
//   } else {
//     req.session.count += 1;
//   }
//   res.send(`You have visited this page ${req.session.count} times`);
// });


// app.get("/test", (req, res) => {
//   res.send("Test Successful");
// });





// Start classroom server
app.listen(3000, () => {
  console.log("Classroom server listening on port 3000");
});








