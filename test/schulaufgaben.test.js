"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const SA = require("../schulaufgaben.js");

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function zeros() { return function () { return 0; }; }

const WORDS = {
  0: "null", 1: "eins", 2: "zwei", 11: "elf", 12: "zwölf", 15: "fünfzehn",
  16: "sechzehn", 17: "siebzehn", 18: "achtzehn", 21: "einundzwanzig",
  30: "dreißig", 36: "sechsunddreißig", 42: "zweiundvierzig", 59: "neunundfünfzig",
  60: "sechzig", 70: "siebzig", 87: "siebenundachtzig", 100: "hundert"
};

test("Zahlwörter, auch unregelmäßige und und-Formen", () => {
  for (const n of Object.keys(WORDS)) assert.equal(SA.zahlwort(+n), WORDS[n]);
  assert.equal(SA.zahlwort(24), "vierundzwanzig");
  assert.notEqual(SA.zahlwort(42), "vierundzwanzig");
  const seen = new Set();
  for (let n = 0; n <= 100; n++) {
    const w = SA.zahlwort(n);
    assert.ok(w && !seen.has(w), w);
    seen.add(w);
  }
  const hint = SA.hint(SA.replay("w:42", zeros()));
  assert.match(hint, /Einer \(2\)/);
  assert.match(hint, /Zehner \(4\)/);
  assert.match(hint, /42/);
  assert.doesNotMatch(hint, /ist 24/);
});

test("Geheimschrift: Strich = Zehner, Punkt = Einer", () => {
  assert.deepEqual(SA.geheim(32), { striche: 3, punkte: 2 });
  assert.deepEqual(SA.geheim(53), { striche: 5, punkte: 3 });
  assert.deepEqual(SA.geheim(75), { striche: 7, punkte: 5 });
  assert.deepEqual(SA.geheim(48), { striche: 4, punkte: 8 });
  assert.deepEqual(SA.geheim(40), { striche: 4, punkte: 0 });
  assert.deepEqual(SA.geheim(7), { striche: 0, punkte: 7 });
  const rnd = mulberry32(4);
  for (let i = 0; i < 40; i++) {
    const q = SA.makeGeheimQ(rnd);
    assert.ok(q.answer >= 1 && q.answer <= 99);
    assert.equal(q.striche * 10 + q.punkte, q.answer);
    assert.equal(SA.check(q, q.answer), true);
    assert.equal(SA.check(q, q.answer + 1), false);
  }
});

test("Hunderterfeld liegt auf 1 bis 100", () => {
  assert.deepEqual(SA.hunderterPos(1), { row: 1, col: 1 });
  assert.deepEqual(SA.hunderterPos(15), { row: 2, col: 5 });
  assert.deepEqual(SA.hunderterPos(57), { row: 6, col: 7 });
  assert.deepEqual(SA.hunderterPos(71), { row: 8, col: 1 });
  assert.deepEqual(SA.hunderterPos(99), { row: 10, col: 9 });
  assert.deepEqual(SA.hunderterPos(100), { row: 10, col: 10 });
  const rnd = mulberry32(5);
  for (let i = 0; i < 30; i++) {
    const q = SA.makeHunderterQ(rnd);
    assert.ok(q.answer >= 1 && q.answer <= 100);
    assert.match(SA.hint(q), new RegExp(String(q.answer)));
  }
});

test("Ergänzen bis zum nächsten Zehner", () => {
  assert.deepEqual(SA.ergaenze(33), { n: 33, add: 7, goal: 40 });
  assert.deepEqual(SA.ergaenze(47), { n: 47, add: 3, goal: 50 });
  assert.deepEqual(SA.ergaenze(35), { n: 35, add: 5, goal: 40 });
  assert.deepEqual(SA.ergaenze(79), { n: 79, add: 1, goal: 80 });
  const rnd = mulberry32(6);
  for (let i = 0; i < 40; i++) {
    const q = SA.makeZehnerQ(rnd);
    assert.equal(q.n % 10 === 0, false);
    assert.equal(q.n + q.answer, q.goal);
    assert.equal(q.goal % 10, 0);
    assert.match(q.text, new RegExp(q.n + " \\+ \\? = " + q.goal));
  }
});

test("Zahlenrätsel wie im Heft", () => {
  const plus = SA.buildRaetsel("plus10", 60);
  assert.equal(plus.answer, 70);
  assert.equal(plus.text, "Meine Zahl ist um 10 größer als 60.");
  const minus = SA.buildRaetsel("minus1", 40);
  assert.equal(minus.answer, 39);
  assert.equal(minus.text, "Meine Zahl ist um 1 kleiner als 40.");
  const halb = SA.buildRaetsel("einer-halb", 6);
  assert.equal(halb.answer, 36);
  assert.equal(halb.text, "Meine Zahl hat 6 Einer und halb so viele Zehner.");
  assert.equal(SA.buildRaetsel("minus10", 70).answer, 60);
  assert.equal(SA.buildRaetsel("plus1", 39).answer, 40);
  assert.equal(SA.buildRaetsel("zehner-halb", 6).answer, 63);
  assert.equal(SA.buildRaetsel("doppelt-einer", 3).answer, 36);
  assert.equal(SA.buildRaetsel("doppelt-zehner", 3).answer, 63);
  assert.equal(SA.buildRaetsel("einer-halb", 5), null);
  const rnd = mulberry32(7);
  for (let i = 0; i < 40; i++) {
    const q = SA.makeRaetselQ(rnd);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 100);
    assert.equal(SA.replay(q.key, rnd).answer, q.answer);
    assert.match(SA.hint(q), new RegExp(String(q.answer)));
  }
});

test("Vorgänger, Nachfolger und Ordnen", () => {
  const rnd = mulberry32(8);
  for (let i = 0; i < 30; i++) {
    const q = SA.makeVnQ(rnd);
    assert.ok(q.z >= 1 && q.z <= 99);
    assert.deepEqual(q.answer, { v: q.z - 1, n: q.z + 1 });
    assert.equal(SA.check(q, q.answer), true);
    assert.equal(SA.check(q, { v: q.z, n: q.z + 1 }), false);
    assert.match(SA.hint(q), new RegExp("Vor " + q.z));
  }
  for (let i = 0; i < 40; i++) {
    const q = SA.makeOrdnenQ(rnd);
    assert.equal(q.numbers.length, 5);
    assert.deepEqual(q.answer, q.numbers.slice().sort((a, b) => a - b));
    assert.equal(new Set(q.numbers).size, 5);
    const near = q.answer.some((n, i) => i && q.answer[i] - q.answer[i - 1] <= 3);
    assert.equal(near, true);
    assert.equal(SA.check(q, q.answer), true);
    assert.equal(SA.check(q, q.answer.slice().reverse()), false);
  }
});

test("Zahlenstrahl lesen und legen, 0 bis 100", () => {
  const rnd = mulberry32(9);
  let lesen = 0, legen = 0;
  for (let i = 0; i < 80; i++) {
    const q = SA.makeStrahlQ(rnd);
    assert.ok(q.answer >= 0 && q.answer <= 100);
    assert.ok(q.sub === "lesen" || q.sub === "legen");
    if (q.sub === "lesen") lesen++;
    else {
      legen++;
      assert.notEqual(q.start, q.answer);
    }
    const d = SA.decadeOf(q.answer);
    assert.ok(q.answer >= d.lo && q.answer <= d.hi);
    assert.equal(SA.check(q, q.answer), true);
  }
  assert.ok(lesen > 10 && legen > 10);
  assert.match(SA.hint(SA.replay("s:lesen:24", rnd)), /24/);
  assert.match(SA.hint(SA.replay("s:lesen:24", rnd)), /20/);
});

test("Größer/kleiner: 25 und 52, 50 und 54", () => {
  assert.equal(SA.sign(25, 52), "<");
  assert.equal(SA.sign(52, 25), ">");
  assert.equal(SA.sign(50, 54), "<");
  assert.equal(SA.sign(54, 50), ">");
  assert.equal(SA.isSwap(25, 52), true);
  assert.equal(SA.isNear(50, 54), true);
  assert.equal(SA.isSwap(50, 54), false);
  assert.equal(SA.isNear(25, 52), false);
  const heft = [[25, 52, "<"], [42, 22, ">"], [36, 33, ">"], [34, 43, "<"], [97, 95, ">"], [50, 54, "<"]];
  for (const [a, b, sig] of heft) {
    assert.equal(SA.sign(a, b), sig);
    const wrong = sig === "<" ? ">" : "<";
    const fb = SA.feedbackVergleich(SA.vergleichFrom(a, b), wrong);
    assert.equal(fb.ok, false);
    assert.equal(fb.sign, sig);
    assert.match(fb.plain, new RegExp(Math.max(a, b) + " ist größer als " + Math.min(a, b)));
    assert.doesNotMatch(fb.plain, /Falsch/);
  }
  const swap = SA.feedbackVergleich(SA.vergleichFrom(25, 52, "tausch"), ">");
  assert.equal(swap.focus, "zehner");
  assert.match(swap.plain, /Zehner/);
  assert.match(swap.plain, /vertauscht/);
  assert.match(swap.eqHtml, /<b class="hot">2<\/b>5/);
  assert.match(swap.eqHtml, /<b class="hot">5<\/b>2/);
  assert.match(swap.eqHtml, /&lt;/);
  assert.deepEqual(swap.rods.a, { h: 0, z: 2, e: 5 });
  assert.deepEqual(swap.rods.b, { h: 0, z: 5, e: 2 });
  const near = SA.feedbackVergleich(SA.vergleichFrom(50, 54, "nah"), ">");
  assert.equal(near.focus, "einer");
  assert.match(near.plain, /Einer/);
  assert.match(near.plain, /Beide haben 5 Zehner/);
  assert.doesNotMatch(near.plain, /vertauscht/);
  assert.match(near.eqHtml, /5<b class="hot">0<\/b>/);
  assert.match(near.eqHtml, /5<b class="hot">4<\/b>/);
  const right = SA.feedbackVergleich(SA.vergleichFrom(25, 52), "<");
  assert.equal(right.ok, true);
  assert.match(right.plain, /Genau/);
  assert.match(right.plain, /52 ist größer als 25/);
});

test("Vergleich erzeugt Tauschpaare und knappe Paare", () => {
  const rnd = mulberry32(11);
  let tausch = 0, nah = 0, sameTen = 0, cross = 0, zehner = 0;
  for (let i = 0; i < 800; i++) {
    const q = SA.makeVergleichQ(rnd);
    assert.notEqual(q.a, q.b);
    assert.ok(q.a >= 0 && q.a <= 100 && q.b >= 0 && q.b <= 100);
    assert.equal(q.answer, SA.sign(q.a, q.b));
    assert.equal(q.kind, "vergleich");
    if (q.pairKind === "tausch") {
      tausch++;
      assert.equal(SA.isSwap(q.a, q.b), true);
    } else if (q.pairKind === "nah") {
      nah++;
      assert.ok(Math.abs(q.a - q.b) <= 4);
      if (q.a < 100 && q.b < 100 && Math.floor(q.a / 10) === Math.floor(q.b / 10)) sameTen++;
      else cross++;
    } else if (q.pairKind === "zehner") {
      zehner++;
      assert.equal(q.a % 10, q.b % 10);
      assert.notEqual(Math.floor(q.a / 10), Math.floor(q.b / 10));
    }
  }
  assert.ok(tausch > 200, "tausch " + tausch);
  assert.ok(nah > 150, "nah " + nah);
  assert.ok(sameTen > 80, "gleiche Zehner " + sameTen);
  assert.ok(cross > 20, "über den Zehner " + cross);
  assert.ok(zehner > 40, "zehner " + zehner);
});

test("Gemischt: Größer/kleiner kommt am häufigsten", () => {
  const bag = SA.mixBag();
  const weight = {};
  for (const t of bag) weight[t] = (weight[t] || 0) + 1;
  for (const t of SA.TYPES) {
    if (t !== "vergleich") assert.ok(weight.vergleich > weight[t]);
  }
  assert.equal(weight.vergleich, SA.MIX.vergleich);
  const rnd = mulberry32(12);
  const counts = {};
  for (let i = 0; i < 3000; i++) {
    const q = SA.makeSchulQ(rnd, []);
    counts[q.type] = (counts[q.type] || 0) + 1;
    assert.equal(JSON.stringify(q).includes("Greta"), false);
    assert.equal(SA.check(q, q.answer), true);
  }
  for (const t of SA.TYPES) assert.ok(counts[t] > 0, t);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  assert.equal(top[0], "vergleich");
  assert.ok(top[1] > 3000 * 0.28, String(top[1]));
});

test("Wiederholung merkt sich 25 gegen 52", () => {
  const q = SA.makeSchulQ(zeros(), ["gk:25:52"]);
  assert.equal(q.repeat, true);
  assert.equal(q.a, 25);
  assert.equal(q.b, 52);
  assert.equal(q.answer, "<");
  const only = SA.makeTypeQ("vergleich", zeros(), ["gk:50:54", "g:32"]);
  assert.equal(only.repeat, true);
  assert.equal(only.a, 50);
  assert.equal(only.b, 54);
});

test("Schlüssel lassen sich wieder abspielen", () => {
  const rnd = mulberry32(13);
  for (let i = 0; i < 60; i++) {
    const q = SA.makeSchulQ(rnd, []);
    const again = SA.replay(q.key, mulberry32(99 + i));
    assert.ok(again, q.key);
    assert.equal(again.type, q.type);
    assert.equal(JSON.stringify(again.answer), JSON.stringify(q.answer));
  }
});
