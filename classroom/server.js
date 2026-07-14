const express = require("express");
const app = express();
const users = require("./routes/user.js");
const posts = require("./routes/post.js");
const cookieParser = require("cookie-parser");

app.use(cookieParser("secretcode"));

app.get("/getsignedcookie", (req, res) => {
  res.cookie("made-in", "India", { signed: true });
  res.send("We sent you a signed cookie");
});

app.get("/verify", (req, res) => {
  console.log(req.signedCookies);
  res.send("Check the console for signed cookies");
});

app.get("/getcookies", (req, res) => {
  res.cookie("greet", "namaste");
  res.cookie("origin", "India");
  res.send("We sent you a cookie");
});

app.get("/greet", (req, res) => {
  let {name = 'anonymous'} = req.query;
  res.send(`Hi, ${name}`);
});

app.get("/", (req, res) => {
  console.log(req.cookies);
  res.send("Hi, I am root");
});

app.use("/users", users);
app.use("/posts", posts);

app.listen(3000, () => {
  console.log("Server is running on port 3000"); 
});







