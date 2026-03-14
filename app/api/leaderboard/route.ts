import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

// Each mode has a sorted set in Redis: leaderboard:{mode}
// For lower-is-better modes, we store the score as-is (lower rank = better)
// For higher-is-better modes, we store negative score so ZRANGEBYSCORE still works

const LOWER_IS_BETTER = new Set(["classic", "speed-round", "aim-trainer"]);
const VALID_MODES = ["classic", "speed-round", "sequence", "shrinking-target", "aim-trainer", "inhibition"];
const MAX_ENTRIES = 100;

function toRedisScore(score: number, mode: string): number {
  return LOWER_IS_BETTER.has(mode) ? score : -score;
}

function fromRedisScore(redisScore: number, mode: string): number {
  return LOWER_IS_BETTER.has(mode) ? redisScore : -redisScore;
}

// GET /api/leaderboard?mode=classic
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const key = `leaderboard:${mode}`;

  // Get top 100 entries (lowest score first for all modes due to our encoding)
  const raw = await kv.zrange(key, 0, MAX_ENTRIES - 1, { withScores: true });

  // raw is [member, score, member, score, ...]
  const entries: { username: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const member = raw[i] as string;
    const redisScore = raw[i + 1] as number;
    // member format: "username:timestamp" to allow same user multiple entries
    const username = member.split(":").slice(0, -1).join(":");
    entries.push({
      username,
      score: fromRedisScore(redisScore, mode),
    });
  }

  return NextResponse.json({ entries });
}

// POST /api/leaderboard { mode, score, username }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, score, username } = body;

    if (!mode || !VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }
    if (!username || typeof username !== "string" || username.length > 20) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const sanitized = username.trim().slice(0, 20);
    const key = `leaderboard:${mode}`;
    const member = `${sanitized}:${Date.now()}`;
    const redisScore = toRedisScore(score, mode);

    // Add the score
    await kv.zadd(key, { score: redisScore, member });

    // Trim to top 100 (remove entries beyond rank 100)
    const totalEntries = await kv.zcard(key);
    if (totalEntries > MAX_ENTRIES) {
      await kv.zremrangebyrank(key, MAX_ENTRIES, -1);
    }

    // Get the player's rank (0-indexed)
    const rank = await kv.zrank(key, member);
    const position = rank !== null ? rank + 1 : null;

    return NextResponse.json({ position, totalEntries: Math.min(totalEntries, MAX_ENTRIES) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
