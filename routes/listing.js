const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");

// Normalize listing payload: remove empty image.url so mongoose uses default
// and keep this helper local to the routes module.
const normalizeListing = (listing) => {
  if (!listing) return listing;
  if (listing.image && typeof listing.image.url === "string" && !listing.image.url.trim()) {
    delete listing.image;
  }
  return listing;
};

const validateListing = (req, res, next) => {
   let {error} = listingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map(el => el.message).join(",");
    return next(new ExpressError(errMsg, 400));
  } else{
    next(); 
  }};

//Index Route
router.get("/", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

//New Route
router.get("/new", (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
router.get("/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
}));

//Create Route
router.post("/", validateListing, wrapAsync(async (req, res, next) => {
  const newListing = new Listing(normalizeListing(req.body.listing));
  await newListing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
}));

//Edit Route
router.get("/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
router.put("/:id", validateListing, wrapAsync(async (req, res) => {
  let { id } = req.params;
  const updatedListing = normalizeListing(req.body.listing);
  await Listing.findByIdAndUpdate(id, { ...updatedListing }, { new: true, runValidators: true });
  res.redirect(`/listings/${id}`);
}));

//Delete Route
router.delete("/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));

module.exports = router;