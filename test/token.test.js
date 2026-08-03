import test from "node:test";
import assert from "node:assert/strict";

// Токен нь хэн үйлдэл хийж байгааг тодорхойлдог цорын ганц эх сурвалж тул
// энэ модулийн зан төлөв эвдэрвэл эрхийн бүх шалгалт утгагүй болно.
process.env.AUTH_TOKEN_SECRET = "test-secret-do-not-use-in-production";
const { createToken, readToken } = await import("../src/token.js");

test("зөв токеноос хэрэглэгчийн ID гарч ирнэ", () => {
  const token = createToken("user-123");
  assert.equal(readToken(token), "user-123");
});

test("өөр нууцаар зурсан токеныг хүлээж авахгүй", () => {
  const token = createToken("user-123");
  // secret() нь дуудалт бүрд env-ээс уншдаг тул нууцыг сольбол хуучин
  // гарын үсэг таарахаа болино.
  process.env.AUTH_TOKEN_SECRET = "өөр-нууц";
  assert.equal(readToken(token), null);
  process.env.AUTH_TOKEN_SECRET = "test-secret-do-not-use-in-production";
  assert.equal(readToken(token), "user-123");
});

test("агуулгыг өөрчилвөл татгалзана", () => {
  const token = createToken("user-123");
  const [payload, signature] = token.split(".");
  // Өөр хэрэглэгч болгож сольсон payload-г хуучин гарын үсэгтэй хамт илгээнэ.
  const forged = Buffer.from(
    JSON.stringify({ sub: "admin", exp: Date.now() + 10000 })
  )
    .toString("base64url")
    .replace(/=+$/, "");
  assert.equal(readToken(`${forged}.${signature}`), null);
  assert.equal(readToken(`${payload}.${signature}`), "user-123");
});

test("хугацаа нь дууссан токеныг хүлээж авахгүй", () => {
  const expired = createToken("user-123", -1);
  assert.equal(readToken(expired), null);
});

test("гажуудсан утгууд алдаа шидэлгүй null буцаана", () => {
  for (const bad of ["", "abc", "a.b.c.d", null, undefined, 42, {}]) {
    assert.equal(readToken(bad), null);
  }
});

test("токен бүр давтагдашгүй", () => {
  assert.notEqual(createToken("user-123"), createToken("user-123"));
});
