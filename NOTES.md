# Kiln progress notes

## Done
- Phase 1: hardware tuner (index.html + tuner.js), live on GitHub Pages
- Phase 2 (started): chat.html runs a WebLLM model on the local GPU via WebGPU

## Measurements so far
- Machine: Ryzen 7 5700U, integrated Radeon graphics, 8 GB RAM, Firefox
- SmolLM2-135M (q0f16, ~360 MB): 5.5 tok/s first run, 9.3 tok/s second run
- Tiny models are overhead-bound, so this doesn't match the bandwidth formula.
- 1B model test blocked: Hugging Face returned HTTP 429 (rate limit). Retry later.

## Known issues / todo
- Tuner's "Integrated GPU / laptop" preset says 100 GB/s; this machine is likely ~25-51 GB/s. Recalibrate.
- Show a friendly "download limited, retry in a few minutes" message on 429.
- Retest the 1B model, and compare Firefox vs Chrome/Edge if possible.
- Optimize for weak hardware (8 GB RAM): small models, memory warnings, lighter defaults.
- Later: llama.cpp local helper, Colab/Kaggle notebooks, public benchmarks.
