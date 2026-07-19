const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const defaultImageUrl =
  "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60";

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,

  image: {
    filename: String,
    url: {
      type: String,
      default: defaultImageUrl,
      set: (value) => (value === "" ? undefined : value),
    },
  },

  price: Number,
  location: String,
  country: String,

  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
