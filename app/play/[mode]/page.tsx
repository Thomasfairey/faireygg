"use client";

import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { getModeById } from "@/lib/game/modes";
import GameShell from "@/components/game/GameShell";
import ClassicMode from "@/components/modes/ClassicMode";
import SpeedRoundMode from "@/components/modes/SpeedRoundMode";
import SequenceMode from "@/components/modes/SequenceMode";
import ShrinkingTargetMode from "@/components/modes/ShrinkingTargetMode";
import AimTrainerMode from "@/components/modes/AimTrainerMode";
import InhibitionMode from "@/components/modes/InhibitionMode";
import ZenMode from "@/components/modes/ZenMode";

function PlayContent({ modeId }: { modeId: string }) {
  const mode = getModeById(modeId);
  if (!mode) notFound();

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
          case "inhibition":
            return <InhibitionMode onComplete={onComplete} phase={phase} />;
          case "zen":
            return <ZenMode phase={phase} />;
          default:
            return null;
        }
      }}
    </GameShell>
  );
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeId } = use(params);

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-space-900" />}>
      <PlayContent modeId={modeId} />
    </Suspense>
  );
}
