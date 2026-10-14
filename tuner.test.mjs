import { test } from "node:test";
import assert from "node:assert/strict";
import { recommend } from "./tuner.js";

test("CPU-only 16GB DDR4 picks 8B dense on cpu", () => {
  const { best } = recommend({ vramGB: 0, ramGB: 16, bandwidthGBps: 40 });
  assert.equal(best.id, "8b-dense");
  assert.equal(best.mode, "cpu");
  assert.equal(best.estTokS, 4.8);
});

test("3090-class with 32GB RAM picks 32B dense on gpu", () => {
  const { best } = recommend({ vramGB: 24, ramGB: 32, bandwidthGBps: 936 });
  assert.equal(best.id, "32b-dense");
  assert.equal(best.mode, "gpu");
  assert.equal(best.estTokS, 29.6);
});

test("Strix Halo-class pool picks the 120B MoE on gpu", () => {
  const { best } = recommend({ vramGB: 96, ramGB: 32, bandwidthGBps: 215 });
  assert.equal(best.id, "120b-moe");
  assert.equal(best.mode, "gpu");
  assert.equal(best.estTokS, 32.3);
});

test("no model is recommended when nothing fits", () => {
  const { best } = recommend({ vramGB: 0, ramGB: 2, bandwidthGBps: 40 });
  assert.equal(best, null);
});