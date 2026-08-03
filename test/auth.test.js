import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/auth.js";

test("зөв нууц үг таарна", () => {
  const stored = hashPassword("hello1234");
  assert.equal(verifyPassword("hello1234", stored), true);
});

test("буруу нууц үг таарахгүй", () => {
  const stored = hashPassword("hello1234");
  assert.equal(verifyPassword("hello12345", stored), false);
  assert.equal(verifyPassword("", stored), false);
});

test("ижил нууц үг тус бүр өөр hash үүсгэнэ", () => {
  // Давс санамсаргүй байх ёстой — эс тэвэл нэг hash-аас олон хэрэглэгчийг
  // нэг дор тайлах боломжтой болно.
  assert.notEqual(hashPassword("hello1234"), hashPassword("hello1234"));
});

test("гажуудсан хадгалсан утга алдаа шидэлгүй false буцаана", () => {
  for (const bad of ["", "no-colon", "only:", ":only", null, undefined]) {
    assert.equal(verifyPassword("hello1234", bad), false);
  }
});
