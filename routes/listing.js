const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isAuthor, validateListing} = require("../middleware.js");

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
router.get("/", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

//New Route
router.get("/new",isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
router.get("/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews").populate("owner");
  res.render("listings/show.ejs", { listing });
}));

//Create Route
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res, next) => {
  const newListing = new Listing(normalizeListing(req.body.listing));
  newListing.owner = req.user._id;
  newListing.author = req.user._id;
  await newListing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
}));

//Edit Route
router.get("/:id/edit",isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
router.put("/:id", isLoggedIn, isAuthor, validateListing, wrapAsync(async (req, res) => {
  let { id } = req.params;
  const updatedListing = normalizeListing(req.body.listing);
  await Listing.findByIdAndUpdate(id, { ...updatedListing }, { new: true, runValidators: true });
  res.redirect(`/listings/${id}`);
}));

//Delete Route
router.delete("/:id", isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));

module.exports = router;