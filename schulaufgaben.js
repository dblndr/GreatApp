"use strict";
// Schulaufgaben, Zahlenraum 0–100. Reine Logik, ohne Bildschirm.
// Dieselben Aufgabentypen wie im Heft, jedes Mal mit neuen Zahlen.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SA = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TYPES = ["hunderter", "geheim", "wort", "vergleich", "vn", "ordnen", "strahl", "zehner", "raetsel"];
  // Größer/kleiner kommt in der gemischten Runde öfter vor als jeder andere Typ.
  const MIX = { hunderter: 1, geheim: 1, wort: 1, vergleich: 4, vn: 1, ordnen: 1, strahl: 1, zehner: 1, raetsel: 1 };
  const PREFIX = {
    hunderter: "h:", geheim: "g:", wort: "w:", vergleich: "gk:",
    vn: "vn:", ordnen: "o:", strahl: "s:", zehner: "z:", raetsel: "r:"
  };
  const NAMES = {
    hunderter: "Hunderterfeld", geheim: "Geheimschrift", wort: "Zahlwörter",
    vergleich: "Größer / kleiner", vn: "Vorgänger", ordnen: "Ordnen",
    strahl: "Zahlenstrahl", zehner: "Zum Zehner", raetsel: "Zahlenrätsel"
  };
  const EINER = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  const TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const TENS = ["", "zehn", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
  const REPEAT_SHARE = 0.35;

  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }
  function rint(lo, hi, rnd) { return lo + Math.floor(rnd() * (hi - lo + 1)); }
  function shuffle(arr, rnd) {
    const o = arr.slice();
    for (let i = o.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = o[i]; o[i] = o[j]; o[j] = t;
    }
    return o;
  }
  function mixBag() {
    const bag = [];
    for (let i = 0; i < TYPES.length; i++) {
      const t = TYPES[i];
      const w = MIX[t] || 1;
      for (let k = 0; k < w; k++) bag.push(t);
    }
    return bag;
  }

  function zahlwort(n) {
    n = n | 0;
    if (n === 100) return "hundert";
    if (n < 0 || n > 100) return String(n);
    if (n < 10) return EINER[n];
    if (n < 20) return TEENS[n - 10];
    const z = Math.floor(n / 10), e = n % 10;
    if (e === 0) return TENS[z];
    return (e === 1 ? "ein" : EINER[e]) + "und" + TENS[z];
  }

  function stellen(n) {
    n = n | 0;
    if (n >= 100) return { h: 1, z: 0, e: 0 };
    if (n <= 0) return { h: 0, z: 0, e: n < 0 ? 0 : n };
    return { h: 0, z: Math.floor(n / 10), e: n % 10 };
  }
  function zehnerPhrase(z) {
    if (z === 0) return "keinen Zehner";
    if (z === 1) return "1 Zehner";
    return z + " Zehner";
  }

  function sign(a, b) { return a < b ? "<" : ">"; }
  function isSwap(a, b) {
    if (a < 10 || b < 10 || a > 99 || b > 99) return false;
    const az = Math.floor(a / 10), ae = a % 10, bz = Math.floor(b / 10), be = b % 10;
    return az !== ae && az === be && ae === bz;
  }
  function isNear(a, b) {
    const d = Math.abs(a - b);
    return d >= 1 && d <= 4;
  }

  function explain(a, b) {
    const big = Math.max(a, b), small = Math.min(a, b);
    const out = { sign: sign(a, b), big: big, small: small };
    if (big === 100 && small < 100) {
      out.focus = "hundert";
      out.text = "100 ist ein ganzer Hunderter. " + small + " ist kleiner als 100.";
      return out;
    }
    const zB = Math.floor(big / 10), zS = Math.floor(small / 10);
    const eB = big % 10, eS = small % 10;
    if (big < 10) {
      out.focus = "einer";
      out.text = "Beide sind kleiner als 10. " + big + " ist mehr als " + small + ".";
      return out;
    }
    if (zB !== zS) {
      out.focus = "zehner";
      out.text = big + " hat " + zehnerPhrase(zB) + ", " + small + " hat " + zehnerPhrase(zS) + ". Mehr Zehner, also größer.";
      if (isSwap(a, b)) out.text += " Die Ziffern sind vertauscht – zuerst die Zehner ansehen.";
      return out;
    }
    out.focus = "einer";
    out.text = "Beide haben " + zehnerPhrase(zB) + ". Dann entscheiden die Einer: " + eB + " ist mehr als " + eS + ".";
    return out;
  }

  function numHtml(n, focus) {
    if (n >= 100) return "100";
    const z = Math.floor(n / 10), e = n % 10;
    if (n < 10) return focus === "einer" ? '<b class="hot">' + e + "</b>" : String(n);
    if (focus === "zehner") return '<b class="hot">' + z + "</b>" + e;
    if (focus === "einer") return z + '<b class="hot">' + e + "</b>";
    return String(n);
  }

  function vergleichFrom(a, b, pairKind) {
    a = a | 0; b = b | 0;
    if (a === b || a < 0 || b < 0 || a > 100 || b > 100) return null;
    const info = explain(a, b);
    return {
      type: "vergleich", kind: "vergleich", mode: "gk",
      a: a, b: b, answer: info.sign, pairKind: pairKind || pairKindOf(a, b),
      key: "gk:" + a + ":" + b,
      text: "Größer oder kleiner?",
      say: "Ist " + a + " größer oder kleiner als " + b + "?"
    };
  }
  function pairKindOf(a, b) {
    if (isSwap(a, b)) return "tausch";
    if (isNear(a, b)) return "nah";
    if (a % 10 === b % 10) return "zehner";
    return "weit";
  }

  function feedbackVergleich(q, given) {
    const info = explain(q.a, q.b);
    const ok = given === info.sign;
    const lead = ok ? "Genau! ⭐" : "Schau mal 💛";
    const headline = info.big + " ist größer als " + info.small + ".";
    const eq = q.a + " " + info.sign + " " + q.b;
    const signHtml = info.sign === "<" ? "&lt;" : "&gt;";
    const eqHtml = numHtml(q.a, info.focus) + ' <span class="gksign">' + signHtml + "</span> " + numHtml(q.b, info.focus);
    return {
      ok: ok, lead: lead, headline: headline, reason: info.text, eq: eq, eqHtml: eqHtml,
      sign: info.sign, big: info.big, small: info.small, focus: info.focus,
      rods: { a: stellen(q.a), b: stellen(q.b) },
      plain: lead + " " + headline + " " + info.text + " " + eq
    };
  }

  function makeSwapPair(rnd) {
    const z = rint(1, 9, rnd);
    let e = rint(1, 9, rnd);
    if (e === z) e = e === 9 ? 1 : e + 1;
    return [z * 10 + e, e * 10 + z];
  }
  function makeNahPair(rnd) {
    if (rnd() < 0.7) {
      const z = rint(0, 9, rnd);
      const gap = rint(1, 4, rnd);
      const e1 = rint(0, 9 - gap, rnd);
      const a = z * 10 + e1;
      return [a, a + gap];
    }
    const z = rint(0, 9, rnd);
    const e = rint(7, 9, rnd);
    const a = z * 10 + e;
    const b = Math.min(100, a + rint(2, 4, rnd));
    return [a, b === a ? a + 1 : b];
  }
  function makeZehnerPair(rnd) {
    const e = rint(0, 9, rnd);
    const z1 = rint(0, 9, rnd);
    let z2 = rint(0, 9, rnd);
    if (z2 === z1) z2 = (z2 + 1) % 10;
    return [z1 * 10 + e, z2 * 10 + e];
  }
  function makeWeitPair(rnd) {
    let a = rint(0, 100, rnd);
    let b = rint(0, 100, rnd);
    let guard = 0;
    while ((a === b || Math.abs(a - b) < 10) && guard < 30) { b = rint(0, 100, rnd); guard++; }
    if (a === b || Math.abs(a - b) < 10) b = a >= 50 ? Math.max(0, a - 20) : Math.min(100, a + 20);
    return [a, b];
  }
  function makeVergleichQ(rnd) {
    rnd = rnd || Math.random;
    const roll = rnd();
    let pair, kind;
    if (roll < 0.40) { pair = makeSwapPair(rnd); kind = "tausch"; }
    else if (roll < 0.75) { pair = makeNahPair(rnd); kind = "nah"; }
    else if (roll < 0.90) { pair = makeZehnerPair(rnd); kind = "zehner"; }
    else { pair = makeWeitPair(rnd); kind = "weit"; }
    if (rnd() < 0.5) pair = [pair[1], pair[0]];
    return vergleichFrom(pair[0], pair[1], kind);
  }

  function hunderterPos(n) {
    return { row: Math.ceil(n / 10), col: ((n - 1) % 10) + 1 };
  }
  function makeHunderterQ(rnd) {
    const n = rint(1, 100, rnd);
    return {
      type: "hunderter", kind: "zahl", mode: "hund", n: n, answer: n,
      key: "h:" + n, text: "Welche Zahl ist im Stern?",
      say: "Welche Zahl ist im Stern auf dem Hunderterfeld?"
    };
  }
  function hunderterHint(n) {
    if (n === 100) return "100 steht ganz unten rechts, am Ende der letzten Reihe.";
    const start = Math.floor((n - 1) / 10) * 10 + 1;
    return n + " steht in der Reihe von " + start + " bis " + (start + 9) + ".";
  }

  function geheim(n) { return { striche: Math.floor(n / 10), punkte: n % 10 }; }
  function makeGeheimQ(rnd) {
    const roll = rnd();
    let n;
    if (roll < 0.15) n = rint(1, 9, rnd) * 10;
    else if (roll < 0.30) n = rint(1, 9, rnd);
    else n = rint(1, 99, rnd);
    const g = geheim(n);
    return {
      type: "geheim", kind: "zahl", mode: "geheim", n: n, answer: n,
      striche: g.striche, punkte: g.punkte,
      key: "g:" + n, text: "Wie heißt die Zahl?",
      say: "Wie heißt die Zahl in der Geheimschrift?"
    };
  }
  function geheimHint(n) {
    const g = geheim(n);
    const s = g.striche === 1 ? "1 Strich" : g.striche + " Striche";
    const p = g.punkte === 1 ? "1 Punkt" : g.punkte + " Punkte";
    return "Jeder Strich ist ein Zehner, jeder Punkt ein Einer. " + s + " und " + p + " sind " + n + ".";
  }

  function wortHint(n) {
    const w = zahlwort(n);
    if (n >= 21 && n < 100 && n % 10 !== 0) {
      return "Zuerst die Einer (" + (n % 10) + "), dann die Zehner (" + Math.floor(n / 10) + "). " + w + " ist " + n + ".";
    }
    if (n === 11) return "Elf ist ein eigenes Wort. Das ist 11.";
    if (n === 12) return "Zwölf ist ein eigenes Wort. Das ist 12.";
    if (n === 16) return "Sechzehn schreibt man ohne s am Ende. Das ist 16.";
    if (n === 17) return "Siebzehn schreibt man ohne en. Das ist 17.";
    return w.charAt(0).toUpperCase() + w.slice(1) + " ist " + n + ".";
  }
  function makeWortQ(rnd) {
    const roll = rnd();
    let n;
    if (roll < 0.55) n = rint(2, 9, rnd) * 10 + rint(1, 9, rnd);
    else if (roll < 0.80) n = rint(11, 19, rnd);
    else if (roll < 0.92) n = rint(1, 10, rnd) * 10;
    else n = rint(0, 100, rnd);
    const w = zahlwort(n);
    return {
      type: "wort", kind: "zahl", mode: "wort", n: n, answer: n, word: w,
      key: "w:" + n, text: w, say: w
    };
  }

  function makeVnQ(rnd) {
    const z = rint(1, 99, rnd);
    return {
      type: "vn", kind: "vn", mode: "vn", z: z,
      answer: { v: z - 1, n: z + 1 },
      key: "vn:" + z,
      text: "Was kommt davor und danach?",
      say: "Was ist der Vorgänger und der Nachfolger von " + z + "?"
    };
  }
  function vnHint(z) {
    return "Vor " + z + " kommt " + (z - 1) + ". Danach kommt " + (z + 1) + ".";
  }

  function makeOrdnenQ(rnd) {
    const nums = [];
    const a = rint(0, 97, rnd);
    nums.push(a, a + rint(1, 3, rnd));
    let guard = 0;
    while (nums.length < 5 && guard < 80) {
      const n = rint(0, 100, rnd);
      if (nums.indexOf(n) < 0) nums.push(n);
      guard++;
    }
    for (let n = 0; nums.length < 5 && n <= 100; n++) if (nums.indexOf(n) < 0) nums.push(n);
    const answer = nums.slice().sort(function (x, y) { return x - y; });
    let display = shuffle(nums, rnd);
    if (display.join() === answer.join()) display = shuffle(display, rnd);
    return {
      type: "ordnen", kind: "ordnen", mode: "ordn",
      numbers: display, answer: answer,
      key: "o:" + answer.join(","),
      text: "Beginne mit der kleinsten Zahl.",
      say: "Ordne die Zahlen. Beginne mit der kleinsten."
    };
  }
  function ordnenHint(q) {
    return "Die kleinste Zahl kommt zuerst: " + q.answer.join(" < ") + ".";
  }

  function decadeOf(n) {
    if (n >= 100) return { lo: 90, hi: 100 };
    const lo = Math.floor(n / 10) * 10;
    return { lo: lo, hi: lo + 10 };
  }
  function strahlHint(n) {
    if (n === 100) return "100 steht ganz am Ende des Strahls.";
    if (n % 10 === 0) return n + " steht genau auf dem Zehnerstrich.";
    const lo = Math.floor(n / 10) * 10;
    const steps = n - lo;
    return n + " liegt zwischen " + lo + " und " + (lo + 10) + ", " + steps + (steps === 1 ? " Schritt" : " Schritte") + " nach " + lo + ".";
  }
  function makeStrahlQ(rnd, sub) {
    if (sub !== "lesen" && sub !== "legen") sub = rnd() < 0.5 ? "lesen" : "legen";
    let n = rint(0, 100, rnd);
    if (sub === "lesen" && n % 10 === 0 && rnd() < 0.75) {
      const base = n === 100 ? 90 : n;
      n = Math.min(99, base + rint(1, 9, rnd));
    }
    let start = 0;
    if (sub === "legen") {
      start = rint(0, 100, rnd);
      let guard = 0;
      while (Math.abs(start - n) < 12 && guard < 20) { start = rint(0, 100, rnd); guard++; }
      if (start === n) start = n >= 50 ? 0 : 100;
    }
    return {
      type: "strahl", kind: sub === "lesen" ? "zahl" : "strahl", mode: "strahl",
      sub: sub, n: n, answer: n, start: start,
      key: "s:" + sub + ":" + n,
      text: sub === "lesen" ? "Welche Zahl ist markiert?" : "Lege die Zahl auf den Strahl.",
      say: sub === "lesen" ? "Welche Zahl ist auf dem Zahlenstrahl markiert?" : "Lege " + n + " auf den Zahlenstrahl."
    };
  }

  function ergaenze(n) {
    const gap = n % 10 === 0 ? 10 : 10 - (n % 10);
    return { n: n, add: gap, goal: n + gap };
  }
  function makeZehnerQ(rnd) {
    const n = rint(0, 9, rnd) * 10 + rint(1, 9, rnd);
    const e = ergaenze(n);
    return {
      type: "zehner", kind: "zahl", mode: "zehn",
      n: n, goal: e.goal, answer: e.add,
      key: "z:" + n,
      text: n + " + ? = " + e.goal,
      say: "Wie viel fehlt von " + n + " bis " + e.goal + "?"
    };
  }
  function zehnerHint(q) {
    return "Von " + q.n + " bis " + q.goal + " fehlen " + q.answer + ".";
  }

  function buildRaetsel(kind, base) {
    let answer = null, text = "";
    if (kind === "plus10") { answer = base + 10; text = "Meine Zahl ist um 10 größer als " + base + "."; }
    else if (kind === "minus10") { answer = base - 10; text = "Meine Zahl ist um 10 kleiner als " + base + "."; }
    else if (kind === "plus1") { answer = base + 1; text = "Meine Zahl ist um 1 größer als " + base + "."; }
    else if (kind === "minus1") { answer = base - 1; text = "Meine Zahl ist um 1 kleiner als " + base + "."; }
    else if (kind === "einer-halb") {
      if (base % 2 || base < 2 || base > 8) return null;
      answer = (base / 2) * 10 + base;
      text = "Meine Zahl hat " + base + " Einer und halb so viele Zehner.";
    } else if (kind === "zehner-halb") {
      if (base % 2 || base < 2 || base > 8) return null;
      answer = base * 10 + base / 2;
      text = "Meine Zahl hat " + base + " Zehner und halb so viele Einer.";
    } else if (kind === "doppelt-einer") {
      if (base < 1 || base > 4) return null;
      answer = base * 10 + base * 2;
      text = "Meine Zahl hat " + base + " Zehner und doppelt so viele Einer.";
    } else if (kind === "doppelt-zehner") {
      if (base < 1 || base > 4) return null;
      answer = base * 2 * 10 + base;
      text = "Meine Zahl hat " + base + " Einer und doppelt so viele Zehner.";
    } else return null;
    if (!Number.isInteger(answer) || answer < 0 || answer > 100) return null;
    return {
      type: "raetsel", kind: "zahl", mode: "raetsel",
      raetsel: kind, base: base, answer: answer,
      key: "r:" + kind + ":" + base,
      text: text, say: text
    };
  }
  function makeRaetselQ(rnd) {
    const kinds = ["plus10", "minus10", "plus1", "minus1", "einer-halb", "zehner-halb", "doppelt-einer", "doppelt-zehner"];
    const kind = pick(kinds, rnd);
    let base;
    if (kind === "plus10") base = rint(0, 90, rnd);
    else if (kind === "minus10") base = rint(10, 100, rnd);
    else if (kind === "plus1") base = rint(0, 99, rnd);
    else if (kind === "minus1") base = rint(1, 100, rnd);
    else if (kind === "einer-halb" || kind === "zehner-halb") base = pick([2, 4, 6, 8], rnd);
    else base = rint(1, 4, rnd);
    return buildRaetsel(kind, base);
  }
  function raetselHint(q) {
    const k = q.raetsel, b = q.base, a = q.answer;
    if (k === "plus10") return "Um 10 größer: ein Zehner dazu. " + b + " + 10 = " + a + ".";
    if (k === "minus10") return "Um 10 kleiner: ein Zehner weg. " + b + " − 10 = " + a + ".";
    if (k === "plus1") return "Um 1 größer ist die nächste Zahl: " + a + ".";
    if (k === "minus1") return "Um 1 kleiner ist die Zahl davor: " + a + ".";
    if (k === "einer-halb") return b + " Einer, halb so viele Zehner sind " + (b / 2) + ". Das ist " + a + ".";
    if (k === "zehner-halb") return b + " Zehner, halb so viele Einer sind " + (b / 2) + ". Das ist " + a + ".";
    if (k === "doppelt-einer") return b + " Zehner und doppelt so viele Einer sind " + (b * 2) + ". Das ist " + a + ".";
    return b + " Einer und doppelt so viele Zehner sind " + (b * 2) + ". Das ist " + a + ".";
  }

  const BUILD = {
    hunderter: makeHunderterQ, geheim: makeGeheimQ, wort: makeWortQ, vergleich: makeVergleichQ,
    vn: makeVnQ, ordnen: makeOrdnenQ, strahl: makeStrahlQ, zehner: makeZehnerQ, raetsel: makeRaetselQ
  };

  function replay(key, rnd) {
    rnd = rnd || Math.random;
    const parts = String(key || "").split(":");
    const head = parts[0];
    if (head === "gk") return vergleichFrom(+parts[1], +parts[2], "repeat");
    if (head === "h") return (+parts[1] >= 1 && +parts[1] <= 100) ? makeHunderterFixed(+parts[1]) : null;
    if (head === "g") return (+parts[1] >= 1 && +parts[1] <= 99) ? makeGeheimFixed(+parts[1]) : null;
    if (head === "w") return (+parts[1] >= 0 && +parts[1] <= 100) ? makeWortFixed(+parts[1]) : null;
    if (head === "vn") return (+parts[1] >= 1 && +parts[1] <= 99) ? makeVnFixed(+parts[1]) : null;
    if (head === "o") return makeOrdnenFixed(parts[1], rnd);
    if (head === "s") return makeStrahlFixed(parts[1], +parts[2], rnd);
    if (head === "z") return makeZehnerFixed(+parts[1]);
    if (head === "r") return buildRaetsel(parts[1], +parts[2]);
    return null;
  }
  function makeHunderterFixed(n) {
    const q = makeHunderterQ(function () { return 0; });
    q.n = n; q.answer = n; q.key = "h:" + n;
    return q;
  }
  function makeGeheimFixed(n) {
    const g = geheim(n);
    return {
      type: "geheim", kind: "zahl", mode: "geheim", n: n, answer: n,
      striche: g.striche, punkte: g.punkte, key: "g:" + n,
      text: "Wie heißt die Zahl?", say: "Wie heißt die Zahl in der Geheimschrift?"
    };
  }
  function makeWortFixed(n) {
    const w = zahlwort(n);
    return { type: "wort", kind: "zahl", mode: "wort", n: n, answer: n, word: w, key: "w:" + n, text: w, say: w };
  }
  function makeVnFixed(z) {
    return {
      type: "vn", kind: "vn", mode: "vn", z: z, answer: { v: z - 1, n: z + 1 },
      key: "vn:" + z, text: "Was kommt davor und danach?",
      say: "Was ist der Vorgänger und der Nachfolger von " + z + "?"
    };
  }
  function makeZehnerFixed(n) {
    if (n < 1 || n > 99 || n % 10 === 0) return null;
    const e = ergaenze(n);
    return {
      type: "zehner", kind: "zahl", mode: "zehn", n: n, goal: e.goal, answer: e.add,
      key: "z:" + n, text: n + " + ? = " + e.goal,
      say: "Wie viel fehlt von " + n + " bis " + e.goal + "?"
    };
  }
  function makeOrdnenFixed(list, rnd) {
    const nums = String(list || "").split(",").map(function (x) { return +x; });
    if (nums.length < 2 || nums.some(function (n) { return !Number.isInteger(n) || n < 0 || n > 100; })) return null;
    const answer = nums.slice().sort(function (x, y) { return x - y; });
    const display = shuffle(answer, rnd);
    return {
      type: "ordnen", kind: "ordnen", mode: "ordn", numbers: display, answer: answer,
      key: "o:" + answer.join(","),
      text: "Beginne mit der kleinsten Zahl.",
      say: "Ordne die Zahlen. Beginne mit der kleinsten."
    };
  }
  function makeStrahlFixed(sub, n, rnd) {
    if ((sub !== "lesen" && sub !== "legen") || n < 0 || n > 100 || !Number.isInteger(n)) return null;
    return overrideStrahl(sub, n, rnd);
  }
  function overrideStrahl(sub, n, rnd) {
    const q = {
      type: "strahl", kind: sub === "lesen" ? "zahl" : "strahl", mode: "strahl",
      sub: sub, n: n, answer: n, start: 0,
      key: "s:" + sub + ":" + n,
      text: sub === "lesen" ? "Welche Zahl ist markiert?" : "Lege die Zahl auf den Strahl.",
      say: sub === "lesen" ? "Welche Zahl ist auf dem Zahlenstrahl markiert?" : "Lege " + n + " auf den Zahlenstrahl."
    };
    if (sub === "legen") {
      q.start = n >= 50 ? 0 : 100;
      if (rnd() < 0.5) q.start = n >= 50 ? 10 : 90;
    }
    return q;
  }

  function takeRepeat(repeat, rnd, type) {
    const list = (repeat || []).filter(function (k) {
      return !type || String(k).indexOf(PREFIX[type]) === 0;
    });
    if (!list.length || rnd() >= REPEAT_SHARE) return null;
    const q = replay(pick(list, rnd), rnd);
    if (!q) return null;
    if (type && q.type !== type) return null;
    q.repeat = true;
    return q;
  }
  function makeTypeQ(type, rnd, repeat) {
    rnd = rnd || Math.random;
    const again = takeRepeat(repeat, rnd, type);
    if (again) return again;
    const build = BUILD[type] || makeVergleichQ;
    return build(rnd);
  }
  function makeSchulQ(rnd, repeat) {
    rnd = rnd || Math.random;
    const again = takeRepeat(repeat, rnd, null);
    if (again) return again;
    return makeTypeQ(pick(mixBag(), rnd), rnd, []);
  }

  function hint(q) {
    if (!q) return "";
    if (q.type === "vergleich") return explain(q.a, q.b).text;
    if (q.type === "hunderter") return hunderterHint(q.answer);
    if (q.type === "geheim") return geheimHint(q.answer);
    if (q.type === "wort") return wortHint(q.answer);
    if (q.type === "vn") return vnHint(q.z);
    if (q.type === "ordnen") return ordnenHint(q);
    if (q.type === "strahl") return strahlHint(q.answer);
    if (q.type === "zehner") return zehnerHint(q);
    if (q.type === "raetsel") return raetselHint(q);
    return "";
  }
  function check(q, val) {
    if (!q) return false;
    if (q.kind === "ordnen") {
      if (!Array.isArray(val) || val.length !== q.answer.length) return false;
      for (let i = 0; i < val.length; i++) if (val[i] !== q.answer[i]) return false;
      return true;
    }
    if (q.kind === "vn") return !!val && val.v === q.answer.v && val.n === q.answer.n;
    return val === q.answer;
  }

  return {
    TYPES: TYPES, MIX: MIX, PREFIX: PREFIX, NAMES: NAMES, REPEAT_SHARE: REPEAT_SHARE,
    mixBag: mixBag, zahlwort: zahlwort, stellen: stellen, sign: sign, isSwap: isSwap, isNear: isNear,
    explain: explain, feedbackVergleich: feedbackVergleich, vergleichFrom: vergleichFrom,
    makeVergleichQ: makeVergleichQ, geheim: geheim, ergaenze: ergaenze, decadeOf: decadeOf,
    hunderterPos: hunderterPos, buildRaetsel: buildRaetsel, hint: hint, check: check, replay: replay,
    makeHunderterQ: makeHunderterQ, makeGeheimQ: makeGeheimQ, makeWortQ: makeWortQ,
    makeVnQ: makeVnQ, makeOrdnenQ: makeOrdnenQ, makeStrahlQ: makeStrahlQ,
    makeZehnerQ: makeZehnerQ, makeRaetselQ: makeRaetselQ, makeTypeQ: makeTypeQ, makeSchulQ: makeSchulQ
  };
});
