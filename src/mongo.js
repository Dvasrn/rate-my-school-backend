import mongoose from "mongoose";

// Serverless орчинд (Vercel) дахин ашиглагдах кэшлэгдсэн холболт —
// cold start болгонд шинэ холболт үүсгэхээс сэргийлнэ.
const cached = (globalThis._mongoose ??= { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;

  // Vercel Project Settings-д "DATABASE_URL" нэрээр тохируулагдсан (хуучин
  // Next.js хувилбараас өвлөгдсөн нэр); локал .env "MONGODB_URI" ашигладаг
  // тул хоёуланг нь дэмжинэ.
  const uri = process.env.DATABASE_URL ?? process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "DATABASE_URL (эсвэл MONGODB_URI) орчны хувьсагч тохируулаагүй байна"
    );
  }

  cached.promise ??= mongoose.connect(uri);
  cached.conn = await cached.promise;
  return cached.conn;
}
