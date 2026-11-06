"use strict";
// Verhaltenstests für die Übungs-App (jsdom). Start: npm test
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const KEY = "uebungs-app-2kl-v1";
let failed = 0;

function assert(cond, msg){
  if(!cond){ failed++; console.error("FAIL:", msg); }
  else console.log("ok:", msg);
}
function assertEq(actual, expected, msg){
  if(actual !== expected){ failed++; console.error("FAIL:", msg, "\n  got:", actual, "\n  want:", expected); }
  else console.log("ok:", msg);
}

function boot(raw){
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", err => errors.push(String(err && err.stack || err)));
  const dom = new JSDOM(html, {
    url: "https://local.test/index.html",
    runScripts: "dangerously",
    virtualConsole: vc,
    beforeParse(window){
      window.scrollTo = () => {};
      window.matchMedia = () => ({ matches: true, addEventListener(){}, removeEventListener(){} });
      window.addEventListener("error", e => errors.push(String(e.error && e.error.stack || e.message)));
      if(raw !== undefined) window.localStorage.setItem(KEY, typeof raw === "string" ? raw : JSON.stringify(raw));
    },
  });
  dom._errors = errors;
  return dom;
}
function close(dom){ try{ dom.window.close(); }catch(e){} }
function doc(dom){ return dom.window.document; }
function clock(dom){
  let t = Date.UTC(2026, 5, 15, 8, 0, 0);
  dom.window.UA.setNow(() => t);
  return { advance(ms){ t += ms; dom.window.UA.tickBlitz(); } };
}
function enter(dom, value){
  const d = doc(dom);
  for(const ch of String(value)) d.querySelector(`[data-key="${ch}"]`).click();
  d.querySelector('[data-key="ok"]').click();
}
function startMode(dom, mode){
  doc(dom).querySelector(`[data-mode="${mode}"]`).click();
}

function testModeAndTimer(){
  const dom = boot();
  try {
    assert(dom._errors.length === 0, "Seite startet ohne Fehler");
    const d = doc(dom);
    const UA0 = dom.window.UA;
    assertEq(UA0.APP_VERSION, "0.1", "Erste Version mit Blitz ist v0.1");
    assertEq(d.title, "Übungs-App – 2. Klasse – v" + UA0.APP_VERSION, "Fenstertitel kommt aus APP_VERSION");
    assertEq(d.getElementById("title").textContent, "⭐ Übungs-App – v" + UA0.APP_VERSION, "Überschrift kommt aus APP_VERSION");
    assertEq(UA0.STORE_KEY, "uebungs-app-2kl-v1", "Speicherschlüssel ist nicht die App-Version");
    const btn = d.querySelector('[data-mode="blitz"]');
    assert(btn && btn.textContent.includes("Blitz-Rechner"), "Blitz-Rechner ist auf dem Startbildschirm wählbar");
    for(const m of ["tage","plus","mal","mix"]) assert(!!d.querySelector(`[data-mode="${m}"]`), "Modus bleibt wählbar: "+m);
    assertEq(d.querySelector("#blitzSecs .chip.on").getAttribute("data-sek"), "8", "Voreinstellung ist 8 Sekunden");
    assert(d.getElementById("blitzBar").classList.contains("hidden"), "Uhr ist auf dem Startbildschirm verborgen");
    const c = clock(dom);
    startMode(dom, "blitz");
    const UA = dom.window.UA;
    assert(!d.getElementById("vQuiz").classList.contains("hidden"), "Blitz öffnet die Übung");
    assert(d.getElementById("vStart").classList.contains("hidden"), "Startbildschirm geht zu");
    assertEq(UA.round.mode, "blitz", "Runde läuft im Modus blitz");
    assertEq(UA.round.q.mode, "blitz", "Aufgabe gehört zum Blitz");
    assert(d.getElementById("qtag").textContent.includes("Blitz"), "Aufgabenzeile nennt den Blitz");
    const bar = d.getElementById("blitzBar");
    assert(!bar.classList.contains("hidden"), "Uhr ist in der Blitz-Runde sichtbar");
    assertEq(bar.getAttribute("role"), "timer", "Uhr ist ein Timer");
    assertEq(d.getElementById("blitzNum").textContent, "8", "Uhr zeigt 8 Sekunden");
    assert(d.getElementById("vQuiz").textContent.includes("⏱️"), "Timer-Symbol ist sichtbar");
    c.advance(1000);
    assertEq(d.getElementById("blitzNum").textContent, "7", "Uhr zählt herunter");
    assert(!UA.round.answered, "Nach einer Sekunde ist noch nicht ausgewertet");
  } finally { close(dom); }
}

function testTimeoutNotSolved(){
  const old = {
    version:1, punkte:40,
    modes:{
      tage:{runden:1,n:10,r:8,sterne:2,best:2},
      plus:{runden:1,n:10,r:6,sterne:1,best:1},
      mal:{runden:0,n:0,r:0,sterne:0,best:0},
      mix:{runden:0,n:0,r:0,sterne:0,best:0},
    },
    wdh:{plus:{"4+7":2}, mal:{}},
    settings:{rows:[2,5]},
    abzeichen:{erste:"2026-01-01"},
  };
  const dom = boot(old);
  try {
    const c = clock(dom);
    const UA = dom.window.UA;
    assertEq(UA.state.punkte, 40, "Alter Punktestand bleibt geladen");
    assertEq(UA.state.settings.rows.join(), "2,5", "Alte Reihen bleiben geladen");
    assertEq(UA.state.wdh.plus["4+7"], 2, "Alte Wiederholungen bleiben geladen");
    startMode(dom, "blitz");
    const key = UA.round.q.key;
    c.advance(7999);
    assert(!UA.round.answered, "Kurz vor Ablauf noch offen");
    assertEq(doc(dom).getElementById("blitzNum").textContent, "1", "Letzte Sekunde ist sichtbar");
    c.advance(1);
    assertEq(UA.round.results[0], "timeout", "Ablauf ist Timeout, nicht richtig oder falsch");
    assert(UA.round.results[0] !== true, "Timeout zählt nicht als richtig");
    assertEq(UA.state.punkte, 40, "Timeout gibt keine Punkte");
    assertEq(UA.state.modes.blitz.n, 0, "Timeout zählt nicht als Versuch");
    assertEq(UA.state.modes.blitz.r, 0, "Timeout zählt nicht als Treffer");
    assertEq(UA.state.modes.plus.n, 10, "Plus-Statistik bleibt unberührt");
    assertEq(UA.state.wdh.blitz[key], undefined, "Timeout landet nicht in der Wiederholungsliste");
    assertEq(UA.state.wdh.plus["4+7"], 2, "Bestehende Wiederholungen bleiben");
    const fb = doc(dom).getElementById("fb");
    assert(fb.classList.contains("time") && fb.classList.contains("show"), "Timeout-Hinweis ist sichtbar");
    assert(!fb.classList.contains("good") && !fb.classList.contains("soft"), "Timeout sieht nicht aus wie richtig oder falsch");
    assert(fb.textContent.includes("Nicht gelöst"), "Text sagt nicht gelöst");
    assert(fb.textContent.includes("Zeit um"), "Text sagt Zeit um");
    assert(fb.textContent.includes(String(UA.round.q.answer)), "Die Lösung wird gezeigt");
    const dot = doc(dom).querySelector("#dots .dot");
    assert(dot.classList.contains("to") && !dot.classList.contains("r") && !dot.classList.contains("f"), "Punkt ist Timeout, nicht grün oder orange");
    const stored = JSON.parse(dom.window.localStorage.getItem(KEY));
    assertEq(stored.punkte, 40, "Gespeicherter Punktestand bleibt");
    assertEq(stored.modes.plus.r, 6, "Gespeicherte Plus-Treffer bleiben");
    doc(dom).querySelector('[data-key="1"]').click();
    doc(dom).querySelector('[data-key="ok"]').click();
    assertEq(UA.round.results[0], "timeout", "Nach Ablauf zählt keine Taste mehr als Antwort");
    assertEq(UA.state.punkte, 40, "Nach Ablauf gibt es weiter keine Punkte");
  } finally { close(dom); }
}

function testCorrectInTime(){
  const dom = boot({ version:1, punkte:5, modes:{ plus:{runden:0,n:0,r:0,sterne:0,best:0} }, settings:{rows:[1,2,3,4,5,6,7,8,9,10]} });
  try {
    const c = clock(dom);
    const UA = dom.window.UA;
    startMode(dom, "blitz");
    c.advance(2500);
    assertEq(doc(dom).getElementById("blitzNum").textContent, "6", "Bei der Antwort läuft die Uhr noch");
    const q = UA.round.q;
    enter(dom, q.answer);
    assertEq(UA.round.results[0], true, "Rechtzeitig richtig zählt als gelöst");
    assertEq(UA.state.punkte, 15, "Rechtzeitig richtig gibt 10 Punkte");
    assertEq(UA.state.modes.blitz.n, 1, "Rechtzeitige Antwort zählt als Versuch");
    assertEq(UA.state.modes.blitz.r, 1, "Rechtzeitige Antwort zählt als Treffer");
    assertEq(UA.state.modes.plus.n, 0, "Blitz-Treffer schreiben nicht in Plus");
    const fb = doc(dom).getElementById("fb");
    assert(fb.classList.contains("good"), "Richtige Antwort bleibt grün");
    assert(fb.textContent.includes("+10"), "Punkte stehen im Hinweis");
    const dot = doc(dom).querySelector("#dots .dot");
    assert(dot.classList.contains("r") && !dot.classList.contains("to"), "Punkt ist richtig, nicht Timeout");
    c.advance(20000);
    assertEq(UA.round.results[0], true, "Abgelaufene Zeit nach der Antwort storniert sie nicht");
    const stored = JSON.parse(dom.window.localStorage.getItem(KEY));
    assertEq(stored.punkte, 15, "Punkte werden unter dem bisherigen Schlüssel gespeichert");
    assertEq(stored.modes.blitz.r, 1, "Blitz-Treffer stehen im Speicher");
    assertEq(stored.settings.blitzSek, 8, "Blitz-Zeit wird mit Default ergänzt");
    assertEq(stored.settings.rows.length, 10, "Reihen bleiben erhalten");
    assertEq(UA.STORE_KEY, KEY, "localStorage-Schlüssel bleibt uebungs-app-2kl-v1");
  } finally { close(dom); }
}

function testWrongIsNotTimeout(){
  const dom = boot();
  try {
    const c = clock(dom);
    const UA = dom.window.UA;
    startMode(dom, "blitz");
    const q = UA.round.q;
    const wrong = q.answer === 0 ? 1 : q.answer + 1;
    c.advance(500);
    enter(dom, wrong);
    assertEq(UA.round.results[0], false, "Falsche Antwort in der Zeit bleibt ein Fehlversuch");
    assertEq(UA.state.punkte, 0, "Falsche Antwort gibt keine Punkte");
    assertEq(UA.state.modes.blitz.n, 1, "Fehlversuch zählt als Versuch");
    assertEq(UA.state.modes.blitz.r, 0, "Fehlversuch zählt nicht als Treffer");
    assertEq(UA.state.wdh.blitz[q.key], 2, "Fehlversuch kommt in die Wiederholungsliste");
    const fb = doc(dom).getElementById("fb");
    assert(fb.classList.contains("soft"), "Fehlversuch behält den bisherigen Hinweis");
    assert(!fb.textContent.includes("Nicht gelöst"), "Fehlversuch wird nicht als Timeout bezeichnet");
  } finally { close(dom); }
}

function testOtherModesUntimed(){
  const dom = boot();
  try {
    const c = clock(dom);
    const UA = dom.window.UA;
    startMode(dom, "plus");
    assert(doc(dom).getElementById("blitzBar").classList.contains("hidden"), "Plus zeigt keine Blitz-Uhr");
    assertEq(UA.round.mode, "plus", "Plus-Runde bleibt Plus");
    const q = UA.round.q;
    enter(dom, q.answer);
    assertEq(UA.round.results[0], true, "Plus richtig zählt weiter");
    assertEq(UA.state.modes.plus.r, 1, "Plus-Treffer bleiben bei Plus");
    assertEq(UA.state.modes.blitz.n, 0, "Plus schreibt nicht in den Blitz");
    assertEq(UA.state.punkte, 10, "Plus gibt weiter 10 Punkte");
    c.advance(60000);
    assertEq(UA.round.results[0], true, "Ohne Blitz gibt es keinen Timeout");
  } finally { close(dom); }
}

function testRoundOfTimeouts(){
  const dom = boot();
  try {
    const c = clock(dom);
    const UA = dom.window.UA;
    doc(dom).querySelector('[data-sek="6"]').click();
    assertEq(UA.state.settings.blitzSek, 6, "6 Sekunden lassen sich wählen");
    assert(doc(dom).querySelector('[data-sek="6"]').classList.contains("on"), "Gewählte Zeit ist markiert");
    startMode(dom, "blitz");
    assertEq(doc(dom).getElementById("blitzNum").textContent, "6", "Uhr übernimmt 6 Sekunden");
    for(let i=0;i<10;i++){
      c.advance(5999);
      assert(!UA.round.answered, "Bei 6 Sekunden ist kurz vor Schluss noch offen ("+i+")");
      c.advance(1);
      assertEq(UA.round.results[i], "timeout", "Aufgabe "+(i+1)+" läuft ab");
      if(i<9) doc(dom).getElementById("nextBtn").click();
      else doc(dom).getElementById("nextBtn").click();
    }
    assert(doc(dom).getElementById("vResult").classList.contains("hidden") === false, "Runde endet nach 10 Aufgaben");
    const text = doc(dom).getElementById("resText").textContent;
    assert(text.includes("0 von 10 richtig"), "Keine Timeout-Aufgabe zählt als richtig");
    assert(text.includes("10 nicht gelöst"), "Alle zehn stehen als nicht gelöst");
    assertEq(UA.state.punkte, 0, "Reiner Timeout bringt keine Punkte");
    assertEq(UA.state.modes.blitz.n, 0, "Reiner Timeout verändert die Trefferquote nicht");
    assertEq(UA.state.modes.blitz.r, 0, "Reiner Timeout hat keine Treffer");
    assertEq(UA.state.modes.blitz.runden, 1, "Die Runde wird trotzdem gezählt");
    assertEq(Object.keys(UA.state.wdh.blitz).length, 0, "Keine Wiederholung nach lauter Timeouts");
  } finally { close(dom); }
}

function testStorageMigration(){
  const dom = boot();
  try {
    const UA = dom.window.UA;
    assertEq(UA.STORE_KEY, KEY, "Schlüssel heißt weiter uebungs-app-2kl-v1");
    assertEq(UA.BLITZ_DEFAULT_SEK, 8, "Default im Code ist 8");
    const old = {
      version:1, punkte:17,
      modes:{
        tage:{runden:2,n:20,r:15,sterne:4,best:3},
        plus:{runden:1,n:10,r:7,sterne:2,best:2},
        mal:{runden:0,n:0,r:0,sterne:0,best:0},
        mix:{runden:3,n:30,r:21,sterne:6,best:3},
      },
      tage:{"2026-01-02":{n:10,r:7}},
      wdh:{plus:{"8+9":1}, mal:{"3·4":2}},
      settings:{rows:[3,4]},
      abzeichen:{erste:"2026-01-02", plus:"2026-01-02"},
      extraAlt:"behalten-wir-nicht-extra",
    };
    const s = UA.migrate(old);
    assertEq(s.punkte, 17, "Punkte aus altem Stand");
    assertEq(s.modes.tage.r, 15, "Wochentage-Treffer aus altem Stand");
    assertEq(s.modes.tage.best, 3, "Bester Sternstand aus altem Stand");
    assertEq(s.modes.mix.runden, 3, "Gemischt-Runden aus altem Stand");
    assertEq(s.modes.blitz.runden, 0, "Fehlender Blitz startet bei null Runden");
    assertEq(s.modes.blitz.n, 0, "Fehlender Blitz startet ohne Versuche");
    assertEq(s.settings.rows.join(), "3,4", "Alte Reihen bleiben");
    assertEq(s.settings.blitzSek, 8, "Ohne Blitz-Zeit gilt 8");
    assertEq(s.wdh.plus["8+9"], 1, "Plus-Wiederholung bleibt");
    assertEq(s.wdh.mal["3·4"], 2, "Mal-Wiederholung bleibt");
    assertEq(Object.keys(s.wdh.blitz).length, 0, "Blitz-Wiederholung startet leer");
    assertEq(s.abzeichen.erste, "2026-01-02", "Abzeichen bleiben");
    assertEq(s.tage["2026-01-02"].r, 7, "Tagesstatistik bleibt");
    const weird = UA.migrate({ punkte:2, settings:{rows:[1], blitzSek:99}, modes:{blitz:{r:4, n:9, extra:7}} });
    assertEq(weird.punkte, 2, "Teilstand behält Punkte");
    assertEq(weird.settings.blitzSek, 8, "Ungültige Blitz-Zeit fällt auf 8 zurück");
    assertEq(weird.settings.rows.join(), "1", "Gültige Reihe bleibt");
    assertEq(weird.modes.blitz.r, 4, "Vorhandene Blitz-Treffer bleiben");
    assertEq(weird.modes.blitz.n, 9, "Vorhandene Blitz-Versuche bleiben");
    assertEq(weird.modes.blitz.runden, 0, "Fehlende Blitz-Felder werden null");
    assertEq(weird.modes.blitz.extra, undefined, "Unbekannte Zähler werden nicht übernommen");
    assertEq(UA.migrate({ settings:{blitzSek:10} }).settings.blitzSek, 10, "Gültige 10 Sekunden bleiben");
    assertEq(UA.migrate({ settings:{blitzSek:"6"} }).settings.blitzSek, 6, "Gespeicherte 6 Sekunden bleiben");
    const fresh = UA.migrate(null);
    assertEq(fresh.modes.blitz.r, 0, "Leerer Stand hat einen Blitz-Modus");
    assertEq(fresh.settings.blitzSek, 8, "Leerer Stand hat 8 Sekunden");
    let i = 0;
    const rnd = () => ((i++) % 97) / 97;
    const st = UA.defaultState();
    for(let k=0;k<20;k++){
      const q = UA.nextQ("blitz", st, rnd, null);
      assert(q.mode==="blitz" && q.kind==="zahl" && (q.answer===q.a+q.b || q.answer===q.a*q.b), "Blitz-Aufgabe ist Plus oder Mal");
    }
    for(let k=0;k<20;k++){
      const q = UA.nextQ("mix", st, Math.random, null);
      assert(q.mode==="tage" || q.mode==="plus" || q.mode==="mal", "Gemischt bleibt ohne Blitz-Aufgaben");
    }
  } finally { close(dom); }
}

function testBrokenSave(){
  const dom = boot("{{{");
  try {
    assert(dom.window.UA && dom.window.UA.state.punkte === 0, "Unlesbarer Speicher fällt auf den Anfang zurück");
    assertEq(dom.window.UA.state.settings.blitzSek, 8, "Unlesbarer Speicher hat die Blitz-Zeit 8");
    assert(doc(dom).querySelector('[data-mode="blitz"]'), "Die App bleibt bedienbar");
  } finally { close(dom); }
}

testModeAndTimer();
testTimeoutNotSolved();
testCorrectInTime();
testWrongIsNotTimeout();
testOtherModesUntimed();
testRoundOfTimeouts();
testStorageMigration();
testBrokenSave();

if(failed){
  console.error("\n"+failed+" Test(s) fehlgeschlagen");
  process.exit(1);
}
console.log("\nAlle Tests bestanden");
