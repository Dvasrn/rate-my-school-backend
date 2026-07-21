import mongoose from "mongoose";

// Serverless орчинд (Vercel) дахин ашиглагдах кэшлэгдсэн холболт —
// cold start болгонд шинэ холболт үүсгэхээс сэргийлнэ.
const cached = (globalThis._mongoose ??= { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI орчны хувьсагч тохируулаагүй байна (.env файлд нэмнэ үү)"
    );
  }

  cached.promise ??= mongoose.connect(uri);
  cached.conn = await cached.promise;
  return cached.conn;
}
