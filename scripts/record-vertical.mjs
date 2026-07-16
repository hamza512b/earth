// Records a seamless, loopable vertical clip of the Earth globe for
// TikTok / YouTube Shorts / Instagram Reels (9:16, 1080x1920).
//
// It boots the Vite dev server, opens the page in a real (headed) Chromium so
// WebGL renders on the GPU, then orbits the camera a FULL 360° around the globe
// and back to its exact starting pose. The sun light is fixed at the front of
// the scene, so a full orbit sweeps through day → terminator → full night side
// → terminator → day, ending where it began.
//
// LOOPABILITY. Two things guarantee the last frame matches the first:
//
//   1. Full 360° with zero velocity at the seam. Rather than drag the mouse
//      (which can't wrap around the screen or hit an exact angle), we drive the
//      camera directly along a latitude circle around the globe. The azimuth
//      runs 0 → 2π on an ease-in-out curve, so it starts and ends at rest and
//      lands on the identical pose — no jump and no velocity discontinuity.
//
//   2. Frozen ambient animation. The app auto-spins the earth and advances the
//      cloud shader every frame; over a few seconds that drifts the continents
//      and clouds enough to show a jump at the loop point. We set
//      window.__freezeAnim (see src/main.ts) so those stay put during capture.
//
// The orbit is driven in-page with requestAnimationFrame (timed by
// performance.now), so the clip length matches DURATION_MS exactly. Frames are
// captured with CDP screencast and encoded to a platform-friendly MP4.
//
// Usage: node scripts/record-vertical.mjs
// Output: earth-vertical.mp4 in the repo root.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// 9:16 vertical. Render at a logical 540x960 with deviceScaleFactor 2, so the
// screencast captures true 1080x1920 while keeping the Chromium window small
// enough to fit any laptop screen.
const WIDTH = 540;
const HEIGHT = 960;
const SCALE = 2; // → 1080x1920 output
const RAW = path.join(ROOT, "earth-vertical.webm");
const OUT = path.join(ROOT, "earth-vertical.mp4");

// Orbit shape (all tunable).
const DURATION_MS = 9000; // time for one full revolution
const ELEVATION_DEG = 12; // camera height above the equator (positive = look down slightly)
const DIR = 1; // orbit direction: 1 or -1
const DISTANCE = 8; // camera distance from the globe (app clamps to <= 10; default view ≈ 5)

function startDevServer() {
  const proc = spawn("npm", ["run", "dev"], { cwd: ROOT });
  return new Promise((resolve, reject) => {
    let out = "";
    const onData = (buf) => {
      out += buf.toString();
      const m = out.match(/https?:\/\/localhost:(\d+)\/?/);
      if (m) {
        proc.stdout.off("data", onData);
        proc.stderr.off("data", onData);
        resolve({ proc, url: m[0] });
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    setTimeout(
      () => reject(new Error("dev server did not start in time")),
      30000,
    );
  });
}

function encodeMp4() {
  // Even dimensions + yuv420p + faststart = maximum player/platform compatibility.
  const args = [
    "-y",
    "-i",
    RAW,
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    "-r",
    "30",
    OUT,
  ];
  const ff = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });
  return once(ff, "close");
}

async function main() {
  console.log("• starting dev server…");
  const { proc: dev, url } = await startDevServer();
  console.log("  dev server:", url);

  const browser = await puppeteer.launch({
    headless: false, // headed → real GPU so WebGL actually renders
    args: [
      "--mute-audio",
      "--hide-scrollbars",
      `--window-size=${WIDTH},${HEIGHT + 120}`,
      "--enable-webgl",
      "--use-gl=angle",
      "--ignore-gpu-blocklist",
    ],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE },
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // Wait for textures to finish loading (app removes the spinner when ready).
    await page.waitForFunction(() => !document.querySelector("#spinner"), {
      timeout: 60000,
    });
    // Dismiss the intro overlay so only the globe is visible.
    await page.evaluate(() => document.querySelector("#start")?.remove());

    // Freeze the ambient earth spin + cloud animation so the first and last
    // frames are identical (see header note #2).
    await page.evaluate(() => {
      window.__freezeAnim = true;
    });

    // Move the camera to the tilted start pose (the loop anchor) BEFORE
    // recording, so the clip begins already on the orbit's latitude circle.
    await page.evaluate(({ elevDeg, distance }) => {
      const { camera, control } = window.__scene;
      const target = control.target;
      // Pull the camera back, but stay within the app's maxDistance.
      const R = Math.min(distance, control.maxDistance - 0.01);
      const phi = (elevDeg * Math.PI) / 180;
      window.__orbit = {
        R,
        phi,
        tx: target.x,
        ty: target.y,
        tz: target.z,
      };
      const xz = R * Math.cos(phi);
      // azimuth 0 → front (+z), fully lit day side.
      camera.position.set(target.x, target.y + R * Math.sin(phi), target.z + xz);
    }, { elevDeg: ELEVATION_DEG, distance: DISTANCE });

    // Let the scene settle on the start pose for a beat.
    await sleep(700);

    console.log("• recording…");
    const recorder = await page.screencast({ path: RAW });

    // Drive one full revolution in-page. Azimuth eases 0 → 2π (ease-in-out), so
    // it starts and ends at rest on the identical pose. The app's render loop
    // keeps the camera aimed at the target each frame.
    await page.evaluate(
      ({ durationMs, dir }) =>
        new Promise((resolve) => {
          const { camera } = window.__scene;
          const { R, phi, tx, ty, tz } = window.__orbit;
          const xz = R * Math.cos(phi);
          const y = ty + R * Math.sin(phi);
          const easeInOut = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const start = performance.now();
          const frame = (now) => {
            const t = Math.min((now - start) / durationMs, 1);
            const a = easeInOut(t) * Math.PI * 2 * dir;
            camera.position.set(tx + xz * Math.sin(a), y, tz + xz * Math.cos(a));
            if (t < 1) {
              requestAnimationFrame(frame);
            } else {
              // Snap to the exact anchor so last frame == first frame.
              camera.position.set(tx, y, tz + xz);
              resolve();
            }
          };
          requestAnimationFrame(frame);
        }),
      { durationMs: DURATION_MS, dir: DIR },
    );

    // Hold the closing frame briefly so the loop point renders cleanly.
    await sleep(150);

    await recorder.stop();
    console.log("• encoding mp4…");
    await encodeMp4();
    await unlink(RAW).catch(() => {});
    console.log("✓ done:", path.relative(ROOT, OUT));
  } finally {
    await browser.close();
    dev.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
