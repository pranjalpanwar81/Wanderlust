const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

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

  await Listing.insertMany(seededListings);
  console.log("Owner seed info:", registeredOwners);
  console.log("data was initialized");
};

initDB();
