const Listing = require("../models/listing");
const normalizeListing = require("../utils/normalizeListing.js");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate("owner")
    .populate({ path: "reviews", populate: { path: "author" } });
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let listingData = req.body.listing;
  
  // If a file was uploaded, use its path as the image URL
  if (req.file) {
    listingData.image = {
      url: `/uploads/${req.file.filename}`
    };
  }
  
  const newListing = new Listing(normalizeListing(listingData));
  newListing.owner = req.user._id;
  newListing.author = req.user._id;
  await newListing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = req.body.listing;
  
  // If a file was uploaded, use its path as the image URL
  if (req.file) {
    listing.image = {
      url: `/uploads/${req.file.filename}`
    };
  }
  
  const updatedListing = normalizeListing(listing);
  await Listing.findByIdAndUpdate(id, { ...updatedListing }, { new: true, runValidators: true });
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
};