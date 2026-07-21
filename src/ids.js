import mongoose from "mongoose";

// Хуучин бөөнөөр импортолсон баримтууд MongoDB-ийн native ObjectId
// төрөлтэй _id-тэй, харин апп дотроос үүсгэсэн шинэ баримтууд
// randomUUID() мөр ашигладаг. Аль алиныг нь олж чадахаар filter буцаана.
export const idFilter = (id) => {
  if (typeof id === "string" && mongoose.isValidObjectId(id) && id.length === 24) {
    return { _id: { $in: [id, new mongoose.Types.ObjectId(id)] } };
  }
  return { _id: id };
};
