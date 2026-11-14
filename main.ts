// make.fun entry: BTC/USDC 4-hour point forecaster (Node 22, stdlib only, no network).
//
// Forecast for one case: the median of the last 30 closes, pulled 20% along
// the last 4-hour log return. The median base is robust to the pool's
// transient spikes (one large trade can move this Orca price for a moment and
// then revert); the small trend pull follows the 4-hour drift without
// chasing it.
//
// Method choice (verified fresh in this session, 2026-11-15, on the practice
// kit's own histories; truth for the 5 scorable practice cases is the next
// case's last close, p05 has no local answer):
//   persistence (house baseline):  real-5 47054.66, walk-forward 34361.75
//   median-30 alone:               real-5 53253.29, walk-forward 30554.63
//   median-30 + 0.2 x 4h return:   real-5 52075.97, walk-forward 28209.84 (chosen)
// The chosen method beats persistence on the 96-point walk-forward inside
// the cases' own 72h histories (checkpoints every 4h, scored against the
// close 240 min later), in every one of the six case windows, but it loses
// on the 5 scorable practice cases (+10.7%), driven by one V-reversal (p03:
// the price fell into the checkpoint then bounced +$567 in 4h). The 5-case
// practice is one noisy draw; the 96-point walk-forward is the better guide.
// Both numbers are reported honestly in README.md.
//
// Verification in this session (fresh tooling in btc-cent-sim2/):
// two full runs byte-identical; practice scored with a fresh score.mjs;
// walk-forward with a fresh wf.mjs; single-case run matches the full run.
//
// Run locally the way the grader runs it (one case per run in the sandbox;
// locally all cases at once):
//   mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The smallest positive price on the grid: one unit of its 5 decimals. */
const MIN_PRICE = 0.00001;
/** The largest grid price below the scorer's exclusive 10,000,000-dollar cap. */
const MAX_PRICE = 9_999_999.99999;

/** Median window: the last 30 one-minute closes. */
const MEDIAN_K = 30;
/** Trend lag: the log return over the last 240 minutes (the forecast horizon). */
const TREND_LAG = 240;
/** Weight on that return: 20% of it is added to the log of the median base. */
const TREND_WEIGHT = 0.2;

interface CaseMarket {
  id: string;
  prices: number[];
}

interface Case {
  markets: CaseMarket[];
}

/** x kept on the grid's 5 decimals and inside the scorer's (0, 10,000,000). */
const price5 = (x: number): number =>
  Math.round(Math.min(MAX_PRICE, Math.max(MIN_PRICE, x)) * 1e5) / 1e5;

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2 === 1) return sorted[(n - 1) / 2] as number;
  return ((sorted[n / 2 - 1] as number) + (sorted[n / 2] as number)) / 2;
}

function forecast(market: CaseMarket): number {
  if (!Array.isArray(market.prices) || market.prices.length === 0) {
    throw new Error(`market ${market.id} has no prices`);
  }
  const prices = market.prices.filter((x) => typeof x === 'number' && Number.isFinite(x));
  if (prices.length === 0) throw new Error(`market ${market.id} has no finite prices`);
  const last = prices[prices.length - 1] as number;
  const base = median(prices.slice(-MEDIAN_K));
  let guess = base;
  if (base <= 0) {
    // A non-positive median can only come from corrupt data (zero or
    // negative closes in the window); fall back to the last close rather
    // than forecasting from a degenerate base.
    guess = last;
  } else if (prices.length > TREND_LAG) {
    const old = prices[prices.length - 1 - TREND_LAG] as number;
    if (old > 0 && last > 0) {
      guess = base * Math.exp(TREND_WEIGHT * Math.log(last / old));
    }
  }
  if (!Number.isFinite(guess)) guess = last;
  return price5(guess);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
// Every case file, in name order, so two runs write the same bytes.
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const parsed = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  if (!Array.isArray(parsed.markets) || parsed.markets.length !== 1) {
    throw new Error(`${file} does not hold exactly one market`);
  }
  const out = { forecasts: [{ case: id, price: forecast(parsed.markets[0] as CaseMarket) }] };
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify(out)}\n`);
}
