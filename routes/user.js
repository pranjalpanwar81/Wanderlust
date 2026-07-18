const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.get("/signup", (req, res) => {
  res.render("users/signup.ejs"); 
});

router.post("/signup", wrapAsync(async (req, res) => {
    try{
        let { email, username, password } = req.body;
    let newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.flash("success", "Successfully signed up! Welcome to Wanderlust!");
    res.redirect("/listings");
    }
    catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    } 
}));

router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    (req, res) => {
        req.flash("success", "Successfully logged in!");
        res.redirect("/listings");
    }
);
 


module.exports = router;