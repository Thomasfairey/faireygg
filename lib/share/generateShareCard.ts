import { ModeDefinition } from "../game/modes";
import { getScoreLabel } from "../game/scoring";

interface ShareCardData {
  mode: ModeDefinition;
  score: number;
  message: string;
  rankName: string;
  rankColor: string;
  isNewBest: boolean;
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const W = 600;
  const H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#030014");
  bg.addColorStop(0.5, "#0a0a2e");
  bg.addColorStop(1, "#030014");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.5;
    const a = 0.3 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.fill();
  }

  // Glow circle behind score
  const glow = ctx.createRadialGradient(W / 2, 380, 0, W / 2, 380, 200);
  glow.addColorStop(0, data.mode.color + "20");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 180, W, 400);

  // Title
  ctx.textAlign = "center";
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = "#ffffff40";
  ctx.fillText("NEURAL PULSE", W / 2, 80);

  // Subtitle
  ctx.font = "10px monospace";
  ctx.fillStyle = "#ffffff20";
  // letterSpacing not supported in all browsers — use spaced text instead
  ctx.fillText("D E E P  S P A C E", W / 2, 105);

  // Mode icon + name
  ctx.font = "40px serif";
  ctx.fillText(data.mode.icon, W / 2, 200);
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = data.mode.color;
  ctx.shadowColor = data.mode.color;
  ctx.shadowBlur = 15;
  ctx.fillText(data.mode.name.toUpperCase(), W / 2, 240);
  ctx.shadowBlur = 0;

  // Score
  const scoreText = getScoreLabel(data.score, data.mode.id);
  ctx.font = "bold 80px monospace";
  ctx.fillStyle = data.mode.color;
  ctx.shadowColor = data.mode.color;
  ctx.shadowBlur = 30;
  ctx.fillText(scoreText, W / 2, 400);
  ctx.shadowBlur = 0;

  // Message
  ctx.font = "20px monospace";
  ctx.fillStyle = "#ffffff80";
  ctx.fillText(data.message, W / 2, 450);

  // New best badge
  if (data.isNewBest) {
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#ffaa00";
    ctx.shadowColor = "#ffaa00";
    ctx.shadowBlur = 10;
    ctx.fillText("★ NEW PERSONAL BEST ★", W / 2, 500);
    ctx.shadowBlur = 0;
  }

  // Rank
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = data.rankColor;
  ctx.shadowColor = data.rankColor;
  ctx.shadowBlur = 10;
  ctx.fillText(data.rankName, W / 2, 580);
  ctx.shadowBlur = 0;

  // Divider
  const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.5, "#ffffff20");
  divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 630);
  ctx.lineTo(W - 100, 630);
  ctx.stroke();

  // CTA
  ctx.font = "12px monospace";
  ctx.fillStyle = "#ffffff25";
  ctx.fillText("Test your reflexes", W / 2, 680);

  // URL
  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "#ffffff40";
  ctx.fillText("neuralpulse.gg", W / 2, 710);

  // Bottom branding
  ctx.font = "9px monospace";
  ctx.fillStyle = "#ffffff15";
  ctx.fillText("NEURAL PULSE · REFLEX TRAINING SYSTEM", W / 2, H - 40);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob returned null"));
      }, "image/png");
    } catch (e) {
      reject(e);
    }
  });
}

// Returns "shared", "downloaded", or "error"
export async function shareResult(data: ShareCardData): Promise<string> {
  try {
    const blob = await generateShareCard(data);
    const file = new File([blob], "neural-pulse.png", { type: "image/png" });

    if (typeof navigator.share === "function") {
      try {
        const canShare = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
        if (canShare) {
          await navigator.share({
            files: [file],
            title: "Neural Pulse",
            text: `${getScoreLabel(data.score, data.mode.id)} in ${data.mode.name} — can you beat it?`,
          });
          return "shared";
        }
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "neural-pulse.png";
    a.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    return "error";
  }
}
