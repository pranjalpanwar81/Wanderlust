const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isAuthor, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

// Normalize listing payload: remove empty image.url so mongoose uses default
// and keep this helper local to the routes module.
const normalizeListing = (listing) => {
  if (!listing) return listing;
  if (listing.image && typeof listing.image.url === "string" && !listing.image.url.trim()) {
    delete listing.image;
  }
  return listing;
};

//Index Route
router.get("/", wrapAsync(listingController.index));

//New Route
router.get("/new",isLoggedIn, listingController.renderNewForm);

//Show Route
router.get("/:id", wrapAsync(listingController.showListing));

//Create Route
router.post("/", isLoggedIn, validateListing, wrapAsync(listingController.createListing));

//Edit Route
router.get("/:id/edit",isLoggedIn, isAuthor, wrapAsync(listingController.renderEditForm));

//Update Route
router.put("/:id", isLoggedIn, isAuthor, validateListing, wrapAsync(listingController.updateListing));

//Delete Route
router.delete("/:id", isLoggedIn, isAuthor, wrapAsync(listingController.deleteListing));


module.exports = router;