import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./src/mongo.js";
import { School } from "./src/models/School.js";
import { idFilter } from "./src/ids.js";

await connectDB();

const objectId = new mongoose.Types.ObjectId();
await mongoose.connection.db.collection("schools").insertOne({
  _id: objectId,
  schoolName: "OBJECTID-TEST-SCHOOL",
  location: "Test",
  schoolType: "HighSchool",
  isSchoolPrivate: false,
});

const idAsString = objectId.toString();
console.log("Inserted with ObjectId:", idAsString);

const found = await School.findOne(idFilter(idAsString)).lean();
console.log("findOne(idFilter(stringId)) result:", found ? found.schoolName : "NOT FOUND");

await mongoose.connection.db.collection("schools").deleteOne({ _id: objectId });
console.log("Cleaned up.");

await mongoose.disconnect();
