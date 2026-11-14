# make.fun entry — BTC/USDC 4-hour point forecaster

Node 22 standard-library only (no network). Reads one case file per run from
`MAKEFUN_INPUT_DIR` (default `/input`), writes `<id>.out` JSON to
`MAKEFUN_OUTPUT_DIR` (default `/output`).

Rebuilt from scratch in a fresh session on 2026-11-15 (03:05 WIB, after the
competition opened at 03:00 WIB), because the first build happened before
opening and its repository could not be used. Same proven method, all code
and all verification redone in this session.

## Method

Median of the last 30 closes, pulled 20% along the last 4-hour log return:

- Base: `median(prices[-30:])` — robust to the pool's transient spikes.
- Trend: `base * exp(0.2 * ln(last / price_240min_ago))`.
- Output: price rounded to 5 decimals, clamped to (0, 10,000,000).

## Practice scores (mean absolute error, cents)

Scorer: fresh `btc-cent-sim2/score.mjs` (truth = next case's last close;
p05 cannot be scored locally, its answer is not in the kit). Walk-forward:
fresh `btc-cent-sim2/wf.mjs`, 96 checkpoints inside the cases' own 72h
histories (16 per case, every 4h, scored against the close 240 min later).

| Variant | 5-case practice (p00–p04) | Walk-forward 4h (96 pts) |
|---|---:|---:|
| Persistence (house baseline) | 47054.66 | 34361.75 |
| Median-30 alone | 53253.29 | 30554.63 |
| **Median-30 + 0.2 x 4h return (this entry)** | **52075.97** | **28209.84** |

**Honest caveat:** on the 5 scorable practice cases this entry LOSES to the
house baseline (52075.97 vs 47054.66, +10.7%), driven by one V-reversal at
p03 (price fell into the checkpoint, then bounced +$567 in 4 hours). On the
96-point walk-forward inside the same histories it BEATS the baseline by
17.9%, in every one of the six case windows (-13% to -20%), bootstrap 95% CI
[-10721, -2087] cents, win rate 0.625. The final is graded on unseen prices,
so the walk-forward is the better guide, but the practice loss is real and
is stated here so the submit decision is made with open eyes.

## Verification (this session, fresh tooling)

- Two full runs byte-identical (sha256 recorded in RESULTS.md); diff clean.
- 0.176 s / 0.140 s for all six cases (limit 8 s per case).
- Single-case run (one .in file, like the grader) gives the same output as
  the full run (p02: 73679.98877, sha256 match).
- Baseline reproduced exactly through the same scorer: 47054.661600 cents,
  worst 76696.79 (published 6-case baseline: 44521.576667; p05 not scorable
  locally).
- All six outputs valid shape `{"forecasts":[{"case": id, "price": x}]}` and
  price in (0, 10,000,000).
