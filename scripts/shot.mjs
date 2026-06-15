import { chromium } from "playwright";

const BASE = "https://career-vault-zeta.vercel.app";
const shots = [
  { path: "/", name: "landing" },
  { path: "/login", name: "login" },
  { path: "/waitlist", name: "waitlist" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const s of shots) {
  const res = await page.goto(BASE + s.path, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);
  const out = `posts/screenshots/${s.name}.png`;
  await page.screenshot({ path: out, fullPage: true });
  console.log(`${s.path} -> ${res?.status()} -> ${out}`);
}

await browser.close();
