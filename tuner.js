// Kiln auto-tuner: pick a model + run mode for given hardware.
// All numbers are rough ESTIMATES. Real speed depends on runtime, context length, kernels.

export const CATALOG = [
  // sizeGB = approx Q4 weights; activeGB = bytes read per token (MoE reads only active experts)
  { id: "8b-dense",   label: "8B dense",              sizeGB: 5,  activeGB: 5,  kind: "dense" },
  { id: "14b-dense",  label: "14B dense",             sizeGB: 9,  activeGB: 9,  kind: "dense" },
  { id: "32b-dense",  label: "32B dense",             sizeGB: 19, activeGB: 19, kind: "dense" },
  { id: "70b-dense",  label: "70B dense",             sizeGB: 42, activeGB: 42, kind: "dense" },
  { id: "30b-moe",    label: "~30B MoE (~3B active)", sizeGB: 18, activeGB: 2,  kind: "moe" },
  { id: "120b-moe",   label: "~120B MoE (~5B active)",sizeGB: 65, activeGB: 3,  kind: "moe" },
];

// Rough memory bandwidth (GB/s) by hardware class, used for the speed ceiling.
export const BANDWIDTH_PRESETS = {
  "cpu-ddr4":   { label: "CPU only, DDR4",            gbps: 40 },
  "cpu-ddr5":   { label: "CPU only, DDR5",            gbps: 80 },
  "igpu-shared":{ label: "Integrated GPU / laptop",   gbps: 100 },
  "gpu-mid":    { label: "Mid GPU (~8-12GB)",         gbps: 300 },
  "gpu-3090":   { label: "High-end GPU (3090-class)", gbps: 936 },
  "strix-halo": { label: "Strix Halo-class APU",      gbps: 215 },
  "colab-t4":   { label: "Free Colab/Kaggle T4 (16 GB)", gbps: 320 },
};

const OVERHEAD_GB = 1.5;   // KV cache + runtime headroom (grows with context)
const RAM_USABLE = 0.75;   // leave room for the OS
const OFFLOAD_BW_CAP = 60; // GB/s, system RAM limits offloaded layers/experts

// Fraction of the bandwidth ceiling reached in practice. MoE is lower (routing overhead).
// 0.45 is calibrated against a reported ~38.6 tok/s for a 120B-class MoE at 273 GB/s.
const EFFICIENCY = { dense: 0.6, moe: 0.45 };

/**
 * @param {{vramGB:number, ramGB:number, bandwidthGBps:number}} hw
 * vramGB = 0 for CPU-only. For unified-memory machines put the usable pool in vramGB.
 */
export function recommend(hw) {
  const results = CATALOG.map((m) => {
    const vram = Math.max(0, hw.vramGB - OVERHEAD_GB);
    const ram = hw.ramGB * RAM_USABLE;
    let mode = "wont-fit";
    let note = "";
    let bw = hw.bandwidthGBps;

    if (hw.vramGB <= 0) {
      if (m.sizeGB <= ram) {
        mode = "cpu";
        note = "Runs on CPU from system RAM.";
      }
    } else if (m.sizeGB <= vram) {
      mode = "gpu";
      note = "Fully on GPU.";
    } else if (m.kind === "moe" && m.sizeGB <= vram + ram) {
      mode = "moe-offload";
      note = "Experts offloaded to RAM; attention on GPU.";
      bw = Math.min(bw, OFFLOAD_BW_CAP);
    } else if (m.kind === "dense" && m.sizeGB <= vram + ram) {
      mode = "split";
      note = "Layer split across GPU+RAM; speed drops sharply.";
      bw = Math.min(bw, OFFLOAD_BW_CAP);
    }

    const ceilingTokS = mode === "wont-fit" ? 0 : +(bw / m.activeGB).toFixed(1);
    const estTokS = +(ceilingTokS * EFFICIENCY[m.kind]).toFixed(1);

    return { ...m, mode, note, ceilingTokS, estTokS };
  });

  const usable = results.filter((r) => r.mode !== "wont-fit" && r.estTokS >= 3);
  // Prefer the biggest model that runs at a comfortable speed (>= 8 tok/s), else biggest usable.
  const comfy = usable.filter((r) => r.estTokS >= 8);
  const pool = comfy.length ? comfy : usable;
  const best = pool.sort((a, b) => b.sizeGB - a.sizeGB)[0] || null;

  return { best, all: results };
}