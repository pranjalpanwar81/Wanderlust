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
    req.login(registeredUser, (err) => {
        if (err) {
            console.error(err);
            req.flash("error", "Error logging in after signup. Please try logging in.");
            return res.redirect("/login");
        }
    });
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
 
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            req.flash("error", "Error logging out. Please try again.");
            return res.redirect("/listings");
        }
        req.flash("success", "Successfully logged out!");
        res.redirect("/listings");
    }   );
});

module.exports = router;