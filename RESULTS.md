# btc-cent-forecast-01 — rebuild results (fresh session)

Rebuild: 2026-11-15 ~03:08–03:15 WIB, in a session started 03:05 WIB, after
the competition opened 03:00 WIB (opens_at 2026-11-14T20:00:00Z). Deadline
15 Nov 2026 15:00 WIB. Builder: this Muse subagent. All code, tooling and
verification were written fresh in this session; the first build's repo was
used only as a method reference (its files were never copied).

## Kit

- Fresh kit at ~/workspace/makefun/btc-cent-kit2/btc-cent-forecast-01-kit/
  (downloaded and sha256-verified 17/17 by the parent session).
- RULES.txt + competition.yaml read. Practice: 6 cases p00–p05, 4,320
  one-minute closes each (72h), checkpoints 2026-11-10T06:00Z, 4h apart.
- Price source: Orca cbBTC/USDC Whirlpool
  HxA6SKW5qA4o12fjVgTpXdq2YnZ5Zv1s7SB4FFomsyLM.

## Rules summary

- Program: `node /bot/main.ts` (Node 22), one run per case, reads
  `$MAKEFUN_INPUT_DIR` (else /input), writes `$MAKEFUN_OUTPUT_DIR`
  (else /output). No network in sandbox.
- Output: `{"forecasts":[{"case": id, "price": x}]}`, exactly one key,
  one row, price finite in (0, 10,000,000).
- Score: mean absolute error over cases, in cents (100 x |guess - actual|).
- Limits: 8 s, 1 CPU, 1024 MB per run; two executions byte-identical.
- Final: 12 checkpoints h00–h11, 4h apart, deadline 2026-11-15T08:00Z
  (15:00 WIB) to +44h, targets to +48h.
- House baseline (persistence = last close): practice 44521.576667 cents
  over 6 cases. A prize needs a score strictly below the baseline's score
  on the FINAL, all cases valid.
- Prizes: $250, 100 places (1st $40, 2nd $25, 3rd $15, 4th–10th $5,
  11th–100th $1.50).

## Method (chosen)

forecast = median(last 30 closes) x exp(0.2 x ln(last / price 240 min ago))

## Scores (fresh, this session; truth = next case's last close; p05 not scorable)

| Method | Real-5 (p00–p04) | Walk-forward 4h (96 pts) |
|---|---:|---:|
| Persistence (house) | 47054.66 | 34361.75 |
| Median-30 | 53253.29 | 30554.63 |
| **This entry** | **52075.97** | **28209.84** |

Per-case errors of this entry (cents): p00 28401.93, p01 63199.27,
p02 46948.68, p03 83889.11, p04 37940.87. Worst 83889.11.
Baseline per-case: 31711.14, 76696.79, 47033.39, 56684.98, 23147.01.
Entry beats baseline on 3 of 5 practice cases, loses on p03 (V-reversal)
and p04.

Walk-forward per case window (entry vs baseline, cents):
p00 23657.99 vs 29172.13 (-18.9%), p01 24410.78 vs 30457.56 (-19.9%),
p02 25557.27 vs 31445.35 (-18.7%), p03 28456.38 vs 34936.70 (-18.5%),
p04 30862.76 vs 38390.50 (-19.6%), p05 36313.87 vs 41768.27 (-13.1%).
Overall 28209.84 vs 34361.75 (-17.90%), win rate 0.625, bootstrap 95% CI
on the per-checkpoint improvement [-10720.81, -2086.72] cents (seeded,
10,000 resamples).

Entry guesses: p00 74731.82317, p01 74312.82862, p02 73679.98877,
p03 72938.46067, p04 73925.29037, p05 73684.23415.

## Verification (fresh tooling in ~/workspace/makefun/btc-cent-sim2/)

- Baseline reproduced through the fresh Node scorer: 47054.661600 cents,
  worst 76696.79 — matches the first build's Python sim exactly.
- Entry: 52075.970800 cents, worst 83889.111 — matches the first build
  exactly, so the fresh TypeScript implementation is faithful to the
  proven method.
- Scorer cross-check: the scorer re-implements the method independently
  and every .out price matched it (match=true on all 5 scorable cases).
- Two full runs byte-identical:
  - p00.out f305e72f34d1514aa9cfcf11a74d3118b172a52923b189720cfbd0c901cc50c1
  - p01.out 9ee1e12690050c17e10881fd4c4b61ac9fcad9f1a3a715a4335a01870d822e7d
  - p02.out 98397f56f1a38df5b3aad9fb1e1e107d6150c4de71e808b595f6a7d7c75df008
  - p03.out afe205ce2b99ea1255688ebd7563bfcbeba502d91c6d359971a48fe125462044
  - p04.out 26ed2c5a2b809642644ca4afc8f3447a5ef57f1d6efd1c0933da582e78315d26
  - p05.out 6b56c8ffbc13715551a79a058d76df53ec3e6e57ac0d621c76c06c90e06bc634
  (same sha256 in both runs; diff clean).
- Runtime: 0.176 s (run 1) and 0.140 s (run 2) for all six cases
  (limit 8 s per case).
- Single-case sandbox-style run: p02 output identical to full run
  (sha256 98397f56...df008, price 73679.98877).
- All six outputs valid shape and price bounds.
- No sign, no submit, no GitHub repo created, no payment, no keys/wallets
  used (only the public owner wallet address in .makefun/owner.json).

## Recommendation

Per the build rule, the 5-case practice score LOSES to the house baseline
(52075.97 vs 47054.66), so this report does NOT recommend submit on the
practice alone. The counter-evidence is the 96-point walk-forward win
(-17.9%, significant, consistent in all six windows): if the final's 48h
resembles the broader Nov 7–11 window rather than the Nov 10 downtrend,
the entry is expected to beat the baseline. Decision rests with master
(and with the parent run, which owns the submit step).
