// Монголын бүх сургуулийн датаг School коллекцид дүүргэнэ.
//
//   npm run seed:schools           — жагсаалтыг харуулаад ЮУ Ч ХИЙХГҮЙ (dry run)
//   npm run seed:schools -- --write — School коллекцийг цэвэрлээд дахин бичнэ
//
// Анхаар: --write нь School коллекцийг БҮХЭЛД НЬ устгана. seed-data.js-ийн
// анхны 10 сургуулийн _id (school-num, school-must, ...) шинэ жагсаалтад
// хэвээр байгаа тул одоо байгаа rating / question / answer-ууд эзэнгүй үлдэхгүй.
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./src/mongo.js";
import { School } from "./src/models/School.js";
import { mongolianSchools } from "./src/schools-mn.js";

const schools = mongolianSchools();

// Эрүүл мэндийн шалгалт: _id болон нэрийн давхардал байх ёсгүй.
const seenIds = new Set();
const seenNames = new Set();
const dupIds = [];
const dupNames = [];
for (const s of schools) {
  if (seenIds.has(s._id)) dupIds.push(s._id);
  else seenIds.add(s._id);
  if (seenNames.has(s.schoolName)) dupNames.push(s.schoolName);
  else seenNames.add(s.schoolName);
}

const byType = schools.reduce((acc, s) => {
  acc[s.schoolType] = (acc[s.schoolType] ?? 0) + 1;
  return acc;
}, {});

console.log(`Нийт: ${schools.length}`);
console.log(`  University: ${byType.University ?? 0}`);
console.log(`  HighSchool: ${byType.HighSchool ?? 0}`);
console.log(`  Collage:    ${byType.Collage ?? 0}`);
console.log(`  Хувийн:     ${schools.filter((s) => s.isSchoolPrivate).length}`);

if (dupIds.length) {
  console.error(`❌ Давхардсан _id (${dupIds.length}):`, dupIds.slice(0, 10));
  process.exit(1);
}
if (dupNames.length) {
  console.error(`❌ Давхардсан нэр (${dupNames.length}):`, dupNames.slice(0, 10));
  process.exit(1);
}

if (!process.argv.includes("--write")) {
  console.log("\nЖишээ бичлэгүүд:");
  for (const s of [schools[0], schools.at(60), schools.at(250), schools.at(-1)]) {
    console.log(" ", JSON.stringify(s));
  }
  console.log("\n(dry run — DB рүү юу ч бичээгүй. Бичихийн тулд `-- --write` нэм.)");
  process.exit(0);
}

await connectDB();
const before = await School.countDocuments();
await School.deleteMany({});
await School.insertMany(schools);
const after = await School.countDocuments();

console.log(`\n✅ School коллекц: ${before} → ${after} бичлэг.`);
await mongoose.disconnect();
