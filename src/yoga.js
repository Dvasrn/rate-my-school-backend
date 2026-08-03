import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvers } from "./resolvers.js";
import { readToken } from "./token.js";
import { connectDB } from "./mongo.js";
import { User } from "./models/User.js";
import { idFilter } from "./ids.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, "..", "schema.graphql"), "utf8");

/**
 * Хүсэлт бүрээс нэвтэрсэн хэрэглэгчийг тодорхойлно.
 *
 * Эрхийг (isAdmin) токеноос биш баазаас уншина — админ эрх хассан үед
 * гарт байгаа хуучин токен админ хэвээр үлдэх ёсгүй.
 */
async function readViewer(request) {
  const header = request?.headers?.get?.("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  let userId;
  try {
    userId = readToken(token);
  } catch {
    // AUTH_TOKEN_SECRET тохируулаагүй үед нэвтрээгүйд тооцно.
    return null;
  }
  if (!userId) return null;

  await connectDB();
  const user = await User.findOne(idFilter(userId)).lean();
  if (!user) return null;

  return { _id: String(user._id), isAdmin: Boolean(user.isAdmin) };
}

export const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  context: async ({ request }) => ({ viewer: await readViewer(request) }),
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    // Authorization толгойг зөвшөөрөхгүй бол браузераас токен явуулж чадахгүй.
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
