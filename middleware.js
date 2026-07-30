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
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash("error", "Review not found.");
      return res.redirect(`/listings/${id}`);
    }
    if (!review.author || !review.author.equals(req.user._id)) {
      req.flash("error", "You do not have permission to do that.");
      return res.redirect(`/listings/${id}`);
    }
    next();
  },
  validateListing: (req, res, next) => {
    console.log("validateListing - req.body before:", req.body);
    console.log("validateListing - req.file:", req.file);
    
    // If a file is being uploaded, add its path to the body for validation
    if (req.file) {
      if (!req.body.listing) {
        req.body.listing = {};
      }
      if (req.file.path) {
        // Cloudinary upload
        req.body.listing.image = {
          url: req.file.path
        };
      } else if (req.file.filename) {
        // Local storage upload
        req.body.listing.image = {
          url: `/uploads/${req.file.filename}`
        };
      }
    }
    
    // If no image provided (no file and no URL), remove the field
    if (req.body.listing && (!req.body.listing.image || !req.body.listing.image.url)) {
      delete req.body.listing.image;
    }
    
    console.log("validateListing - req.body after:", req.body);
    
    const { error } = listingSchema.validate(req.body);
    if (error) {
      const msg = error.details.map((el) => el.message).join(",");
      console.log("Validation error:", msg);
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