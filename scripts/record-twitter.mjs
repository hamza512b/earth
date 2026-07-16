// Records a short X/Twitter clip of the Earth globe.
//
// It boots the Vite dev server, opens the page in a real (headed) Chromium so
// WebGL renders on the GPU, then drags the globe to the RIGHT. Because the sun
// light is fixed at the front of the scene, orbiting the camera rightward swings
// it around toward the unlit night side ("dark side"). On release, the app's
// TrackballControls (dynamicDampingFactor = 0.05) keeps gliding and decays — so
// the motion eases out on its own. The frames are captured with CDP screencast
// and encoded to a Twitter-friendly MP4 with ffmpeg.
//
// Usage: node scripts/record-twitter.mjs
// Output: earth-twitter.mp4 in the repo root.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { ScreenRecorder } from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Twitter likes 16:9. 720p keeps the file small for a short clip.
const WIDTH = 1280;
const HEIGHT = 720;
const RAW = path.join(ROOT, "earth-twitter.webm");
const OUT = path.join(ROOT, "earth-twitter.mp4");

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
  // Even dimensions + yuv420p + faststart = maximum player/Twitter compatibility.
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
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
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

    // Let the scene settle for a beat.
    await sleep(700);

    console.log("• recording…");
    const recorder = await page.screencast({ path: RAW });

    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    // Grab the globe.
    await page.mouse.move(cx, cy);
    await page.mouse.down();

    // Ease-in curve: the drag starts from rest and accelerates smoothly, so the
    // globe fans in rather than snapping to full speed on the first frame. A
    // quart ease-in ends at maximum slope, so we release at peak velocity and the
    // damped glide picks up seamlessly from there.
    const easeIn = (t) => t * t * t;

    // Drag in small steps to build angular velocity. TrackballControls integrates
    // the movement, so a long drag orbits the camera toward the night side. Both
    // axes are driven off the SAME eased progress t (0 → 1) as an offset from the
    // mouse-down point, so the first frame stays put (no jitter) and the pointer
    // eases in along a straight diagonal.
    const steps = 110;
    const dragX = -600; // px (negative = leftward orbit)
    const dragY = 120; // px (negative = slight upward orbit)
    for (let i = 1; i <= steps; i++) {
      const t = easeIn(i / steps);
      await page.mouse.move(cx + dragX * t, cy + dragY * t);
      await sleep(12); // fixed dt → easeIn shapes the velocity ramp
    }

    // Release → the damped glide carries it the rest of the way and eases out.
    await page.mouse.up();

    // Let the damping settle into the dark side.
    await sleep(2600);

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
