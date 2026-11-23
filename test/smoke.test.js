"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { serve } = require("./serve.js");

const V1 = {
  version: 1,
  punkte: 77,
  modes: {
    tage: { runden: 2, n: 20, r: 15, sterne: 4, best: 3 },
    plus: { runden: 1, n: 10, r: 9, sterne: 2, best: 2 },
    mal: { runden: 0, n: 0, r: 0, sterne: 0, best: 0 },
    mix: { runden: 0, n: 0, r: 0, sterne: 0, best: 0 },
    blitz: { runden: 4, n: 40, r: 30, sterne: 8, best: 3 }
  },
  tage: { "2026-11-22": { n: 10, r: 8 } },
  wdh: { plus: { "4+7": 2 }, mal: {}, blitz: {} },
  settings: { rows: [2, 5], blitzSek: 6 },
  abzeichen: { erste: "2026-11-01" }
};

test("bestehende Modi laden, v0.1-Speicher bleibt", async (t) => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) {
    t.skip("playwright ist nicht installiert");
    return;
  }
  const root = path.join(__dirname, "..");
  const srv = await serve(root);
  const errors = [];
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page.on("pageerror", (err) => errors.push(String(err)));
    await page.addInitScript((saved) => {
      localStorage.setItem("uebungs-app-2kl-v1", JSON.stringify(saved));
    }, V1);
    await page.goto(srv.url + "/index.html", { waitUntil: "load" });

    const boot = await page.evaluate(() => {
      const days = UA.shuffleDays(Math.random, null);
      const blitz = UA.makeBlitzQ(Math.random, UA.state.settings.rows, []);
      const day = UA.makeDayQ(1, Math.random);
      return {
        title: document.title,
        version: UA.APP_VERSION,
        key: UA.STORE_KEY,
        h1: document.getElementById("title").textContent,
        body: document.body.innerText,
        week: UA.isWeekSequence(days),
        dayCount: days.length,
        blitzMode: blitz.mode,
        blitzKind: blitz.kind,
        dayKind: day.kind,
        punkte: UA.state.punkte,
        tageRunden: UA.state.modes.tage.runden,
        tageBest: UA.state.modes.tage.best,
        blitzRunden: UA.state.modes.blitz.runden,
        rows: UA.state.settings.rows.join(","),
        sek: UA.state.settings.blitzSek,
        badge: UA.state.abzeichen.erste,
        wdh: UA.state.wdh.plus["4+7"],
        schul: UA.state.modes.schul.runden,
        gk: UA.state.modes.gk.runden,
        plusRep: Object.keys(UA.state.wdh.plus).length
      };
    });
    assert.deepEqual(errors, []);
    assert.equal(boot.title, "Übungs-App – v0.2");
    assert.equal(boot.h1, "Übungs-App – v0.2");
    assert.equal(boot.version, "0.2");
    assert.equal(boot.key, "uebungs-app-2kl-v1");
    assert.equal(boot.body.includes("Greta"), false);
    assert.equal(boot.week, false);
    assert.equal(boot.dayCount, 7);
    assert.equal(boot.blitzMode, "blitz");
    assert.equal(boot.blitzKind, "zahl");
    assert.equal(boot.dayKind, "tag");
    assert.equal(boot.punkte, 77);
    assert.equal(boot.tageRunden, 2);
    assert.equal(boot.tageBest, 3);
    assert.equal(boot.blitzRunden, 4);
    assert.equal(boot.rows, "2,5");
    assert.equal(boot.sek, 6);
    assert.equal(boot.badge, "2026-11-01");
    assert.equal(boot.wdh, 2);
    assert.equal(boot.schul, 0);
    assert.equal(boot.gk, 0);

    await page.locator('#vStart [data-mode="tage"]').click();
    await page.locator(".days button").first().waitFor();
    const order = await page.locator(".days button").evaluateAll((bs) => bs.map((b) => +b.getAttribute("data-day")));
    assert.equal(order.length, 7);
    assert.equal(await page.evaluate((o) => UA.isWeekSequence(o), order), false);
    const ans = await page.evaluate(() => UA.round.q.answer);
    await page.locator('[data-day="' + ans + '"]').click();
    await page.locator(".fb.good").waitFor();

    await page.locator("#homeBtn").click();
    await page.locator("#vStart").waitFor();
    await page.locator('#vStart [data-mode="blitz"]').click();
    await page.locator("#blitzBar").waitFor();
    const blitzShown = await page.locator("#blitzNum").textContent();
    assert.ok(Number(blitzShown) <= 6 && Number(blitzShown) >= 1);
    assert.equal(await page.locator(".pad").count(), 1);

    await page.locator("#homeBtn").click();
    await page.locator('#vStart [data-mode="plus"]').click();
    await page.locator(".pad").waitFor();
    assert.match(await page.locator("#prompt").innerText(), /\+/);

    await page.locator("#homeBtn").click();
    await page.locator('#vStart [data-mode="mal"]').click();
    assert.match(await page.locator("#prompt").innerText(), /·/);

    await page.locator("#homeBtn").click();
    await page.locator('#vStart [data-mode="mix"]').click();
    await page.locator("#qtag").waitFor();
    const mixUi = await page.evaluate(() => ({
      days: document.querySelectorAll(".days button").length,
      pad: document.querySelectorAll(".pad").length,
      mode: UA.round.mode
    }));
    assert.equal(mixUi.mode, "mix");
    assert.ok(mixUi.days === 7 || mixUi.pad === 1);

    await page.locator("#homeBtn").click();
    await page.locator('[data-go="schul"]').click();
    await page.locator("#vSchul .feature").waitFor();
    for (const id of ["gk", "schul", "hund", "geheim", "wort", "vn", "ordn", "strahl", "zehn", "raetsel"]) {
      assert.ok(await page.locator('#vSchul [data-mode="' + id + '"]').count() >= 1, id);
    }

    const before = await page.evaluate(() => UA.state.punkte);
    await page.evaluate(() => UA.preview("gk", SA.vergleichFrom(25, 52, "tausch")));
    await page.locator('.signbtn[data-sign="<"]').waitFor();
    await page.locator('.signbtn[data-sign=">"]').waitFor();
    const cmp = await page.locator("#prompt").innerText();
    assert.match(cmp, /25/);
    assert.match(cmp, /52/);
    const box = await page.locator(".signbtn").first().boundingBox();
    assert.ok(box.height >= 80 && box.width >= 100);
    await page.locator('.signbtn[data-sign=">"]').click();
    const fb = await page.locator("#fb").innerText();
    assert.match(fb, /52/);
    assert.match(fb, /größer/);
    assert.match(fb, /Zehner/);
    assert.doesNotMatch(fb, /Falsch/);
    assert.equal(await page.evaluate(() => UA.state.punkte), before);

    await page.evaluate(() => UA.preview("geheim", SA.replay("g:53")));
    const marks = await page.evaluate(() => ({
      strokes: document.querySelectorAll("#figure .stroke").length,
      pips: document.querySelectorAll("#figure .pip").length
    }));
    assert.equal(marks.strokes, 5);
    assert.equal(marks.pips, 3);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => srv.server.close(resolve));
  }
});
