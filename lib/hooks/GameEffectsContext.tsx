"use client";

import { createContext, useContext } from "react";
import type { GameEffects } from "./useGameEffects";

export const GameEffectsContext = createContext<GameEffects | null>(null);

export function useEffects(): GameEffects | null {
  return useContext(GameEffectsContext);
}
