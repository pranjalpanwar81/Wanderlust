const User = require("../models/user.js"); 

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
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
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
    req.flash("success", "Successfully logged in!");
    let redirectUrl = req.session.returnTo || "/listings";
    res.redirect(redirectUrl);
}; 

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            req.flash("error", "Error logging out. Please try again.");
            return res.redirect("/listings");
        }
        req.flash("success", "Successfully logged out!");
        res.redirect("/listings");
    });
};