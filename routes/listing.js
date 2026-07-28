const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isAuthor, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, validateListing, wrapAsync(listingController.createListing));

//New Route
router.get("/new",isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isAuthor, validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isAuthor, wrapAsync(listingController.deleteListing));

//Edit Route
router.get("/:id/edit",isLoggedIn, isAuthor, wrapAsync(listingController.renderEditForm));

module.exports = router;