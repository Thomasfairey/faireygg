"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getModeById } from "@/lib/game/modes";
import GameShell from "@/components/game/GameShell";
import ClassicMode from "@/components/modes/ClassicMode";
import SpeedRoundMode from "@/components/modes/SpeedRoundMode";
import SequenceMode from "@/components/modes/SequenceMode";
import ShrinkingTargetMode from "@/components/modes/ShrinkingTargetMode";
import AimTrainerMode from "@/components/modes/AimTrainerMode";

export default function PlayPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeId } = use(params);
  const mode = getModeById(modeId);

  if (!mode) {
    notFound();
  }

  return (
    <GameShell mode={mode}>
      {({ onComplete, phase }) => {
        switch (mode.id) {
          case "classic":
            return <ClassicMode onComplete={onComplete} phase={phase} />;
          case "speed-round":
            return <SpeedRoundMode onComplete={onComplete} phase={phase} />;
          case "sequence":
            return <SequenceMode onComplete={onComplete} phase={phase} />;
          case "shrinking-target":
            return <ShrinkingTargetMode onComplete={onComplete} phase={phase} />;
          case "aim-trainer":
            return <AimTrainerMode onComplete={onComplete} phase={phase} />;
          default:
            return null;
        }
      }}
    </GameShell>
  );
}
