import { recommend } from "./tuner.js";

const profiles = {
  "cpu-only 16GB DDR4":   { vramGB: 0,  ramGB: 16, bandwidthGBps: 40 },
  "3090 24GB + 32GB RAM": { vramGB: 24, ramGB: 32, bandwidthGBps: 936 },
  "Strix Halo 96GB pool": { vramGB: 96, ramGB: 32, bandwidthGBps: 215 },
};

for (const [name, hw] of Object.entries(profiles)) {
  const { best } = recommend(hw);
  console.log(`${name}: ${best ? `${best.label} (${best.mode}, ~${best.estTokS} tok/s)` : "none"}`);
}