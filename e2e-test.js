const { chromium } = require("playwright");

const BASE = "http://localhost:3099";
let passed = 0;
let failed = 0;
const failures = [];

function log(test, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${test}`);
  } else {
    failed++;
    failures.push({ test, detail });
    console.log(`  ✗ ${test} — ${detail}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
  });

  // ============================================================
  console.log("\n=== 1. PAGE LOAD & HYDRATION ===");
  // ============================================================
  const routes = [
    "/", "/stats", "/leaderboard",
    "/play/classic", "/play/speed-round", "/play/sequence",
    "/play/shrinking-target", "/play/aim-trainer", "/play/inhibition", "/play/zen",
    "/play/daily-sync",
  ];

  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.substring(0, 120)));
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(2000);
      log(`${route} loads without JS errors`, errors.length === 0, errors[0]);
    } catch (e) {
      log(`${route} loads`, false, e.message.substring(0, 80));
    }
    await page.close();
  }

  // Test redirect
  const rPage = await context.newPage();
  await rPage.goto(BASE + "/play/shrink", { waitUntil: "networkidle", timeout: 10000 });
  log("/play/shrink redirects to /play/shrinking-target", rPage.url().includes("shrinking-target"), rPage.url());
  await rPage.close();

  // ============================================================
  console.log("\n=== 2. API SECURITY ===");
  // ============================================================
  const apiPage = await context.newPage();
  await apiPage.goto(BASE, { waitUntil: "networkidle" });

  async function apiPost(data) {
    return apiPage.evaluate(async (d) => {
      const r = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      return { status: r.status, body: await r.json() };
    }, data);
  }

  async function apiGet(mode) {
    return apiPage.evaluate(async (m) => {
      const r = await fetch(`/api/leaderboard?mode=${m}`);
      return { status: r.status, body: await r.json() };
    }, mode);
  }

  // Invalid inputs
  let r = await apiPost({ mode: "classic", score: NaN, username: "test12" });
  log("Rejects NaN score", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: -5, username: "test12" });
  log("Rejects negative score", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: 10, username: "test12" });
  log("Rejects impossibly fast score (<80ms)", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: 50000, username: "test12" });
  log("Rejects score above max (>9999ms)", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "hacked", score: 200, username: "test12" });
  log("Rejects invalid mode", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: 200, username: "" });
  log("Rejects empty username", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: 200, username: "A" });
  log("Rejects 1-char username", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "zen", score: 100, username: "test12" });
  log("Rejects zen mode submission", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: 200.5, username: "test12" });
  log("Rejects non-integer score", r.status === 400, `status=${r.status}`);

  r = await apiPost({ mode: "classic", score: 200, username: "test|pipe" });
  log("Rejects pipe in username", r.status === 400, `status=${r.status}`);

  // Valid GET
  r = await apiGet("classic");
  log("GET /api/leaderboard?mode=classic returns entries array", r.status === 200 && Array.isArray(r.body.entries), `status=${r.status}`);

  r = await apiGet("invalid");
  log("GET with invalid mode returns 400", r.status === 400, `status=${r.status}`);

  r = await apiGet("");
  log("GET with empty mode returns 400", r.status === 400, `status=${r.status}`);

  // All mode GETs
  for (const m of ["classic", "speed-round", "sequence", "shrinking-target", "aim-trainer", "inhibition"]) {
    r = await apiGet(m);
    log(`GET mode=${m} returns 200`, r.status === 200, `status=${r.status}`);
  }

  await apiPage.close();

  // ============================================================
  console.log("\n=== 3. SECURITY HEADERS ===");
  // ============================================================
  const headPage = await context.newPage();
  const headResp = await headPage.goto(BASE, { waitUntil: "networkidle" });
  const headers = headResp.headers();
  log("X-Content-Type-Options: nosniff", headers["x-content-type-options"] === "nosniff", headers["x-content-type-options"]);
  log("X-Frame-Options: DENY", headers["x-frame-options"] === "DENY", headers["x-frame-options"]);
  log("Referrer-Policy set", !!headers["referrer-policy"], headers["referrer-policy"]);
  await headPage.close();

  // ============================================================
  console.log("\n=== 4. ERROR BOUNDARIES ===");
  // ============================================================
  const errPage = await context.newPage();
  await errPage.goto(BASE + "/play/nonexistent", { waitUntil: "networkidle", timeout: 10000 });
  const errContent = await errPage.textContent("body");
  log("404 for invalid game mode doesn't crash", !errContent.includes("Application error"), errContent.substring(0, 80));
  await errPage.close();

  // ============================================================
  console.log("\n=== 5. RESPONSIVE LAYOUT (390px) ===");
  // ============================================================
  const respPage = await context.newPage();
  // Set onboarding as complete to avoid first-play redirect
  await respPage.goto(BASE, { waitUntil: "networkidle" });
  await respPage.evaluate(() => {
    localStorage.setItem("neural-pulse-onboarding", JSON.stringify({
      state: { playedModes: ["classic"], hasCompletedFirstGame: true },
      version: 1
    }));
  });
  await respPage.goto(BASE, { waitUntil: "networkidle" });
  await respPage.waitForTimeout(2000);

  // Check no horizontal overflow
  const hasOverflow = await respPage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  log("No horizontal overflow at 390px", !hasOverflow, `scrollWidth > clientWidth: ${hasOverflow}`);

  // Check title visible
  const titleVisible = await respPage.evaluate(() => {
    const el = document.querySelector("h1");
    return el && el.textContent?.includes("NEURAL PULSE");
  });
  log("Title 'NEURAL PULSE' is visible", !!titleVisible, "");

  // Check mode cards render
  const modeButtons = await respPage.evaluate(() => {
    const buttons = document.querySelectorAll("button");
    let count = 0;
    buttons.forEach(b => {
      if (/Classic|Speed|Sequence|Shrink|Aim|Inhibition|Zen/.test(b.textContent || "")) count++;
    });
    return count;
  });
  log("Mode cards render (at least 3 visible)", modeButtons >= 3, `found ${modeButtons}`);

  await respPage.close();

  // ============================================================
  console.log("\n=== 6. GAME FLOW: CLASSIC ===");
  // ============================================================
  const classicPage = await context.newPage();
  const classicErrors = [];
  classicPage.on("pageerror", (e) => classicErrors.push(e.message.substring(0, 120)));
  await classicPage.goto(BASE + "/play/classic", { waitUntil: "networkidle" });

  // Should see countdown or instruction
  await classicPage.waitForTimeout(500);
  const hasCountdownOrInstruction = await classicPage.evaluate(() => {
    const text = document.body.textContent || "";
    return text.includes("3") || text.includes("2") || text.includes("1") ||
           text.includes("GO") || text.includes("WAIT") ||
           text.includes("Tap when") || text.includes("TAP TO START") ||
           text.includes("Classic");
  });
  log("Classic shows countdown/instruction on entry", hasCountdownOrInstruction, "");

  // Wait for game to start
  await classicPage.waitForTimeout(5000);
  log("Classic mode runs without JS errors after 5s", classicErrors.length === 0, classicErrors[0]);
  await classicPage.close();

  // ============================================================
  console.log("\n=== 7. GAME FLOW: ALL MODES SURVIVE 3s ===");
  // ============================================================
  const gameModes = ["speed-round", "sequence", "shrinking-target", "aim-trainer", "inhibition", "zen"];
  for (const mode of gameModes) {
    const gPage = await context.newPage();
    const gErrors = [];
    gPage.on("pageerror", (e) => gErrors.push(e.message.substring(0, 120)));
    await gPage.goto(BASE + `/play/${mode}`, { waitUntil: "networkidle" });
    await gPage.waitForTimeout(3500);
    log(`/play/${mode} survives 3.5s without errors`, gErrors.length === 0, gErrors[0]);
    await gPage.close();
  }

  // ============================================================
  console.log("\n=== 8. LEADERBOARD PAGE ===");
  // ============================================================
  const lbPage = await context.newPage();
  const lbErrors = [];
  lbPage.on("pageerror", (e) => lbErrors.push(e.message.substring(0, 120)));
  await lbPage.goto(BASE + "/leaderboard", { waitUntil: "networkidle" });
  await lbPage.waitForTimeout(2000);

  log("Leaderboard page loads without errors", lbErrors.length === 0, lbErrors[0]);

  // Check Global/Personal toggle exists
  const hasGlobalTab = await lbPage.locator("text=Global").first().isVisible().catch(() => false);
  const hasPersonalTab = await lbPage.locator("text=Personal").first().isVisible().catch(() => false);
  log("Global tab visible", hasGlobalTab, "");
  log("Personal tab visible", hasPersonalTab, "");

  await lbPage.close();

  // ============================================================
  console.log("\n=== 9. STATS PAGE ===");
  // ============================================================
  const statsPage = await context.newPage();
  const statsErrors = [];
  statsPage.on("pageerror", (e) => statsErrors.push(e.message.substring(0, 120)));
  await statsPage.goto(BASE + "/stats", { waitUntil: "networkidle" });
  await statsPage.waitForTimeout(1500);
  log("Stats page loads without errors", statsErrors.length === 0, statsErrors[0]);
  await statsPage.close();

  // ============================================================
  console.log("\n=== 10. RATE LIMITING ===");
  // ============================================================
  const rlPage = await context.newPage();
  await rlPage.goto(BASE, { waitUntil: "networkidle" });
  const rateLimitResult = await rlPage.evaluate(async () => {
    const results = [];
    for (let i = 0; i < 12; i++) {
      const r = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "classic", score: 250, username: `ratelimit${i}` }),
      });
      results.push(r.status);
    }
    return results;
  });
  const has429 = rateLimitResult.includes(429);
  log("Rate limiter triggers after 10 rapid requests", has429, `statuses: ${rateLimitResult.join(",")}`);
  await rlPage.close();

  // ============================================================
  console.log("\n=== 11. MANIFEST & PWA ===");
  // ============================================================
  const mPage = await context.newPage();
  const mResp = await mPage.goto(BASE + "/manifest.json", { waitUntil: "networkidle" });
  let manifestOk = false;
  try {
    const manifest = await mResp.json();
    manifestOk = manifest.name === "Neural Pulse" && manifest.display === "standalone";
  } catch {}
  log("manifest.json is valid and accessible", manifestOk, "");
  await mPage.close();

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failures.length > 0) {
    console.log(`\nFAILURES:`);
    failures.forEach((f) => console.log(`  ✗ ${f.test}: ${f.detail}`));
  }
  console.log(`${"=".repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error("Test runner crashed:", e.message);
  process.exit(1);
});
