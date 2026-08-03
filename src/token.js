import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// Гуравдагч сангүйгээр HMAC-SHA256 гарын үсэгтэй токен үүсгэнэ.
// Токен нь зөвхөн хэрэглэгчийн ID болон дуусах хугацааг агуулна — эрхийг
// (isAdmin) токеноос биш, баазаас шалгана. Ингэснээр админ эрх хассан
// тохиолдолд хуучин токен хүчинтэй хэвээр үлдэхгүй.

const ALGO = "sha256";
const DEFAULT_TTL_DAYS = 30;

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(text) {
  return Buffer.from(text.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function secret() {
  const value = process.env.AUTH_TOKEN_SECRET;
  if (!value) {
    // Нууц тохируулаагүй бол нэвтрэлт ажиллахгүй байх нь чимээгүй
    // нээлттэй үлдэхээс дээр.
    throw new Error("AUTH_TOKEN_SECRET орчны хувьсагч тохируулаагүй байна");
  }
  return value;
}

function sign(payloadB64) {
  return base64url(createHmac(ALGO, secret()).update(payloadB64).digest());
}

/** Хэрэглэгчид нэвтрэх токен олгоно. */
export function createToken(userId, ttlDays = DEFAULT_TTL_DAYS) {
  const payload = {
    sub: String(userId),
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    jti: randomBytes(8).toString("hex"),
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Токеныг шалгаад хэрэглэгчийн ID-г буцаана.
 * Буруу, гажуудсан эсвэл хугацаа нь дууссан бол null.
 */
export function readToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Урт нь зөрвөл timingSafeEqual шидэлт хийдэг тул эхлээд шалгана.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromBase64url(payloadB64).toString("utf8"));
    if (!payload?.sub || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
