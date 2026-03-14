import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const LOWER_IS_BETTER = new Set(["classic", "speed-round", "aim-trainer"]);
const VALID_MODES = ["classic", "speed-round", "sequence", "shrinking-target", "aim-trainer", "inhibition"];
const MAX_ENTRIES = 100;

// Server-side score bounds per mode [min, max]
const SCORE_BOUNDS: Record<string, [number, number]> = {
  classic: [80, 9999],
  "speed-round": [500, 30000],
  sequence: [1, 50],
  "shrinking-target": [0, 200],
  "aim-trainer": [100, 5000],
  inhibition: [0, 20000],
};

// Simple in-memory rate limiter (per-IP, resets on cold start — fine for serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 submissions per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Sanitize username — strip dangerous chars
function sanitizeUsername(raw: string): string | null {
  const trimmed = raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g, "") // zero-width & bidi
    .replace(/[\u0300-\u036F]/g, "") // combining diacritics (Zalgo)
    .replace(/[<>"'&\\]/g, "") // HTML-sensitive chars
    .slice(0, 20);

  if (trimmed.length < 2) return null;
  if (/[|]/.test(trimmed)) return null; // delimiter char
  return trimmed;
}

function toRedisScore(score: number, mode: string): number {
  return LOWER_IS_BETTER.has(mode) ? score : -score;
}

function fromRedisScore(redisScore: number, mode: string): number {
  return LOWER_IS_BETTER.has(mode) ? redisScore : -redisScore;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "https://neuralpulse.gg",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Max-Age": "3600",
};

// OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/leaderboard?mode=classic
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400, headers: CORS_HEADERS });
  }

  const key = `leaderboard:${mode}`;

  try {
    const raw = await Promise.race([
      kv.zrange(key, 0, MAX_ENTRIES - 1, { withScores: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("KV timeout")), 5000)),
    ]);

    const entries: { username: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const member = raw[i] as string;
      const redisScore = raw[i + 1] as number;
      const username = member.split("|")[0];
      entries.push({
        username: username.slice(0, 20),
        score: fromRedisScore(redisScore, mode),
      });
    }

    return NextResponse.json({ entries }, { headers: CORS_HEADERS });
  } catch {
    // Graceful degradation — return empty on KV failure
    return NextResponse.json({ entries: [], offline: true }, { headers: CORS_HEADERS });
  }
}

// POST /api/leaderboard { mode, score, username }
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS_HEADERS });
  }

  try {
    // Request size guard
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 1024) {
      return NextResponse.json({ error: "Request too large" }, { status: 413, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const { mode, score, username } = body;

    // Mode validation
    if (!mode || !VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400, headers: CORS_HEADERS });
    }

    // Score validation — reject NaN, Infinity, non-numbers
    if (typeof score !== "number" || !isFinite(score) || !Number.isInteger(score) || score < 0) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400, headers: CORS_HEADERS });
    }

    // Score range validation per mode
    const bounds = SCORE_BOUNDS[mode];
    if (bounds && (score < bounds[0] || score > bounds[1])) {
      return NextResponse.json({ error: "Score out of range" }, { status: 400, headers: CORS_HEADERS });
    }

    // Username validation
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Invalid username" }, { status: 400, headers: CORS_HEADERS });
    }

    const sanitized = sanitizeUsername(username);
    if (!sanitized) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400, headers: CORS_HEADERS });
    }

    const key = `leaderboard:${mode}`;
    const member = `${sanitized}|${Date.now()}`;
    const redisScore = toRedisScore(score, mode);

    // If KV is not configured, still return success without persisting
    try {
      await Promise.race([
        (async () => {
          await kv.zadd(key, { score: redisScore, member });
          const totalEntries = await kv.zcard(key);
          if (totalEntries > MAX_ENTRIES) {
            await kv.zremrangebyrank(key, MAX_ENTRIES, -1);
          }
        })(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("KV timeout")), 5000)),
      ]);

      const rank = await kv.zrank(key, member);
      const position = rank !== null ? rank + 1 : null;
      return NextResponse.json({ position, totalEntries: Math.min(MAX_ENTRIES, 100) }, { headers: CORS_HEADERS });
    } catch {
      // KV unavailable — return success without position (graceful degradation)
      return NextResponse.json({ position: null, offline: true }, { headers: CORS_HEADERS });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: CORS_HEADERS });
  }
}
