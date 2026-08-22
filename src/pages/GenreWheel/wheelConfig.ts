// wheelConfig.ts
// ─── EDIT THIS FILE TO CHANGE THE WHEEL ─────────────────────────────────────
// Do not touch Wheel.tsx or index.tsx to make changes — everything
// configurable lives here.

export const wheelSegments = [
  // label: text shown on the segment and in the result display
  // weight: relative odds — higher weight = lands here more often
  // Equal weights = equal probability across all segments
  { label: "Techno", weight: 1 },
  { label: "Deep House", weight: 1 },
  { label: "Drum & Bass", weight: 1 },
  { label: "Afro House", weight: 1 },
  { label: "Ambient", weight: 1 },
  { label: "UK Garage", weight: 1 },
  { label: "Breaks", weight: 1 },
  { label: "Trance", weight: 1 },
  // Add or remove segments freely. Wheel auto-divides equally by count.
  // Short labels (≤ 10 chars) fit best. Use abbreviations for longer genre names.
];

export const spinConfig = {
  minSpins: 4,          // minimum full rotations before landing
  maxSpins: 7,          // maximum full rotations before landing
  spinDurationMs: 4000, // total animation duration in milliseconds
};

export const copy = {
  heading: "Spin the Wheel",
  subheading: "Pick a genre. Land on it. Clear the stage.",
  spinButtonLabel: "SPIN",
  resultPrefix: "You landed on:",
  spinAgainLabel: "Spin Again",
};
