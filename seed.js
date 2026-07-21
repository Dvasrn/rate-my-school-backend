import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./src/mongo.js";
import { User } from "./src/models/User.js";
import { School } from "./src/models/School.js";
import { Rating } from "./src/models/Rating.js";
import { seedData } from "./src/seed-data.js";

const { users, schools, ratings } = seedData();

await connectDB();
await Promise.all([
  User.deleteMany({}),
  School.deleteMany({}),
  Rating.deleteMany({}),
]);
await School.insertMany(schools);
await User.insertMany(users);
await Rating.insertMany(ratings);

console.log("✅ MongoDB-д туршилтын дата seed хийгдлээ.");
await mongoose.disconnect();
