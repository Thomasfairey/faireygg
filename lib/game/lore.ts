export interface LoreFragment {
  rankId: string;
  text: string;
}

export const LORE_FRAGMENTS: LoreFragment[] = [
  { rankId: "cadet", text: "Neural link established. Calibrating synaptic response..." },
  { rankId: "co-pilot", text: "Cortical implant sync at 40%. The ship hums in recognition." },
  { rankId: "pilot", text: "Your reflexes now exceed baseline human limits. Command takes notice." },
  { rankId: "commander", text: "The void between stars grows shorter. Your mind bends light." },
  { rankId: "test-pilot", text: "Only three pilots survived the Tesseract Run. You are the fourth." },
  { rankId: "lightspeed", text: "Time dilates around you. The universe holds its breath." },
];

export const MODE_FLAVOUR: Record<string, string> = {
  classic: "Standard neural calibration protocol",
  "speed-round": "Burst-fire synapse drill",
  sequence: "Cortical pattern recognition test",
  "shrinking-target": "Precision targeting simulation",
  "aim-trainer": "Combat-grade tracking exercise",
  zen: "Meditation chamber — neural cooldown",
  inhibition: "Impulse override training",
};

export function getLoreForRank(rankId: string): LoreFragment | undefined {
  return LORE_FRAGMENTS.find((f) => f.rankId === rankId);
}
