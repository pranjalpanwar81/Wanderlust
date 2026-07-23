const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Review = require("../models/review.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  await User.deleteMany({});
  await Review.deleteMany({});

  const seedOwners = [
    { email: "aarav.sharma@gmail.com", username: "Aarav Sharma", password: "aarav123" },
    { email: "priya.patel@gmail.com", username: "Priya Patel", password: "priya123" },
    { email: "rahul.verma@gmail.com", username: "Rahul Verma", password: "rahul123" },
    { email: "ananya.iyer@gmail.com", username: "Ananya Iyer", password: "ananya123" },
    { email: "kabir.singh@gmail.com", username: "Kabir Singh", password: "kabir123" },
  ];

  const registeredOwners = [];
  for (const ownerData of seedOwners) {
    const user = new User({
      email: ownerData.email,
      username: ownerData.username,
    });
    const registeredUser = await User.register(user, ownerData.password);
    registeredOwners.push({
      id: registeredUser._id,
      email: registeredUser.email,
      username: registeredUser.username,
      password: ownerData.password,
    });
  }

  const seededListings = initData.data.map((listing) => {
    const chosenOwner = registeredOwners[Math.floor(Math.random() * registeredOwners.length)];
    return {
      ...listing,
      owner: chosenOwner.id,
      author: chosenOwner.id,
    };
  });

  const createdListings = await Listing.insertMany(seededListings);

  const reviewTemplates = [
    {
      positive: {
        comment: "Great stay, exactly as described. I would happily come back again.",
        rating: 5,
      },
      negative: {
        comment: "Nice place overall, but the experience did not fully match my expectations.",
        rating: 3,
      },
    },
    {
      positive: {
        comment: "Very clean and comfortable. The host was responsive and helpful.",
        rating: 4,
      },
      negative: {
        comment: "Good location, but the place felt a little noisy in the evenings.",
        rating: 2,
      },
    },
    {
      positive: {
        comment: "Amazing view and a smooth check-in. Strongly recommended.",
        rating: 5,
      },
      negative: {
        comment: "The listing was fine, but a few small details could be improved.",
        rating: 3,
      },
    },
  ];

  for (const [index, listing] of createdListings.entries()) {
    const templateSet = reviewTemplates[index % reviewTemplates.length];
    const positiveAuthor = registeredOwners[index % registeredOwners.length];
    const negativeAuthor = registeredOwners[(index + 2) % registeredOwners.length];

    const positiveReview = await Review.create({
      ...templateSet.positive,
      author: positiveAuthor.id,
    });

    const negativeReview = await Review.create({
      ...templateSet.negative,
      author: negativeAuthor.id,
    });

    listing.reviews.push(positiveReview._id, negativeReview._id);
    await listing.save();
  }

  console.log("Owner seed info:", registeredOwners);
  console.log("data was initialized");
};

initDB();
