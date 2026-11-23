"use strict";
const fs = require("fs");
const path = require("path");
const { serve } = require("../test/serve.js");

async function main() {
  const { chromium } = require("playwright");
  const root = path.join(__dirname, "..");
  const out = path.join(root, "shots");
  fs.mkdirSync(out, { recursive: true });
  const srv = await serve(root);
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on("pageerror", (err) => { throw err; });
  await page.goto(srv.url + "/index.html", { waitUntil: "load" });
  await page.locator(".fcard.sa").waitFor();
  await page.screenshot({ path: path.join(out, "home.png") });

  await page.locator('[data-go="schul"]').click();
  await page.locator("#vSchul .feature").waitFor();
  await page.screenshot({ path: path.join(out, "schulaufgaben.png") });

  await page.evaluate(() => UA.preview("gk", SA.vergleichFrom(25, 52, "tausch")));
  await page.locator(".signbtn").first().waitFor();
  await page.screenshot({ path: path.join(out, "groesser-kleiner.png") });

  await page.evaluate(() => UA.preview("geheim", SA.replay("g:53")));
  await page.locator("#figure .stroke").first().waitFor();
  await page.screenshot({ path: path.join(out, "geheimschrift.png") });

  await browser.close();
  await new Promise((resolve) => srv.server.close(resolve));
  console.log("shots written to " + out);
}

main().catch((err) => { console.error(err); process.exit(1); });
