import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("./catalog.json", import.meta.url), "utf8"));
const STATUS = ["verified", "label-checked", "partial", "unverified"];
const WHERE = ["browser", "local", "colab", "nvidia-gpu"];

test("ids are unique", () => {
  const ids = data.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every entry has the required fields and allowed values", () => {
  for (const t of data) {
    for (const k of ["id", "name", "category", "sources", "license", "licenseStatus", "expected", "notes"]) {
      assert.ok(k in t, `${t.id}: missing ${k}`);
    }
    assert.ok(STATUS.includes(t.licenseStatus), `${t.id}: bad licenseStatus`);
    assert.ok(t.expected.length > 0 && t.expected.every((w) => WHERE.includes(w)), `${t.id}: bad expected`);
  }
});

test("tested records say where, on what, and the result", () => {
  for (const t of data.filter((x) => x.tested)) {
    for (const k of ["where", "machine", "result"]) {
      assert.ok(t.tested[k], `${t.id}: tested.${k} missing`);
    }
  }
});

test("a license is never 'verified' without a real license name", () => {
  for (const t of data.filter((x) => x.licenseStatus === "verified")) {
    assert.ok(!/unverified|not stated/i.test(t.license), `${t.id}: verified but license unclear`);
  }
});
