// TOK-05. Score colors by band. Thresholds were read off the source: the
// highest red was 34.9, orange ran 36.4 to 49.9, lime 50 to 63.1, green 65.3
// to 79.8 and bright green started at 80.

const SCORE_BANDS = [
  { from: 80, className: "text-score-strong" },
  { from: 65, className: "text-score-good" },
  { from: 50, className: "text-score-fair" },
  { from: 35, className: "text-score-weak" },
] as const;

const LOWEST_BAND_CLASS = "text-score-risky";

export function scoreBandClass(score: number): string {
  return SCORE_BANDS.find((band) => score >= band.from)?.className ?? LOWEST_BAND_CLASS;
}
