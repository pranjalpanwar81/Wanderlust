const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports = {
  isLoggedIn: (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "You must be logged in to access this page.");
      return res.redirect("/login");
    }
    next();
  },
  isAuthor: async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }
    const ownerId = listing.owner || listing.author;
    if (!ownerId) {
      return next();
    }
    if (!ownerId.equals(req.user._id)) {
      req.flash("error", "You do not have permission to do that.");
      return res.redirect(`/listings/${id}`);
    }
    next();
  },
  isReviewOwner: async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }
    const ownerId = listing.owner || listing.author;
    if (!ownerId || !ownerId.equals(req.user._id)) {
      req.flash("error", "You do not have permission to do that.");
      return res.redirect(`/listings/${id}`);
    }
    next();
  },
  validateListing: (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
      const msg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(msg, 400);
    }
    next();
  },
  validateReview: (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
      const msg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(msg, 400);
    }
    next();
  },
};