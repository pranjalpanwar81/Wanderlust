const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isReviewOwner } = require("../middleware.js");

const validateReview = (req, res, next) => {
  if (!req.body || !req.body.review) {
    return next(new ExpressError("Review data is missing", 400));
  }
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map(el => el.message).join(",");
    return next(new ExpressError(errMsg, 400));
  }
  next();
};

//Reviews
//Post Route for reviews
router.post("/", isLoggedIn, validateReview,  wrapAsync(async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  req.flash("success", "Review created successfully!");

  res.redirect(`/listings/${listing._id}`);
}));

//Edit Route for reviews
router.get("/:reviewId/edit", isLoggedIn, isReviewOwner, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;
  const listing = await Listing.findById(id).populate("owner");
  const review = await Review.findById(reviewId).populate("author");

  if (!listing || !review) {
    req.flash("error", "Review not found.");
    return res.redirect(`/listings/${id}`);
  }

  res.render("reviews/edit.ejs", { listing, review });
}));

//Update Route for reviews
router.put("/:reviewId", isLoggedIn, isReviewOwner, validateReview, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;
  await Review.findByIdAndUpdate(reviewId, { ...req.body.review }, { runValidators: true, new: true });
  res.redirect(`/listings/${id}`);
}));

//Delete Route for reviews
router.delete("/:reviewId", isLoggedIn, isReviewOwner, wrapAsync(async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/${id}`);
}));

module.exports = router;