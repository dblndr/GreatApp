# Übungs-App – 2. Klasse

Kleine Übungs-App für Kinder der 2. Klasse, als einzelne HTML-Datei (`index.html`). Sie läuft im Browser auf iPhone, iPad und Laptop, ohne Anmeldung und ohne Internetverbindung nach dem Laden.

Sichtbare Version: **v0.1**, nur an der Konstante `APP_VERSION` in `index.html`. Sie steht im Fenstertitel und in der Überschrift. Die nächste Live-Verbesserung erhöht diese Nummer um 0.1 (v0.2, v0.3, …). Das Speicherformat bleibt davon unabhängig.

## Modi

- **📅 Wochentage:** Welcher Tag kommt nach/vor …? Morgen, übermorgen, gestern, vorgestern. „N Tage nach/vor …“, auch über das Wochenende hinweg. Die Fragen werden mit der Zeit schwieriger.
- **➕ Plus bis 20:** Kopfrechnen mit Schwerpunkt auf den kniffligen Aufgaben 4+7, 4+8, 6+7, 6+8, 8+9, 7+9, 7+8, 3+8 und ihren Tauschaufgaben (etwa zwei Drittel der Aufgaben).
- **✖️ Einmaleins:** kleines Einmaleins bis 10 · 10. Einzelne Reihen sind auf dem Startbildschirm wählbar.
- **🎲 Gemischt:** alles durcheinander.
- **⚡ Blitz-Rechner:** Plus bis 20 und Einmaleins im Wechsel, mit Countdown. Voreingestellt sind 8 Sekunden, wählbar sind 6, 8 oder 10. Richtig in der Zeit zählt wie gewohnt. Ist die Zeit um, gilt die Aufgabe als nicht gelöst: kein Punkt und kein Fehlversuch, sie wandert dadurch nicht in die Wiederholungsliste. Die gewählten Einmaleins-Reihen gelten auch hier.

Eine Runde hat 10 Aufgaben. Danach gibt es bis zu 3 Sterne (im Blitz zählen nur Aufgaben, die in der Zeit richtig gelöst wurden). Falsch gelöste Rechenaufgaben kommen öfter wieder, bis sie zweimal richtig gelöst wurden. Abgelaufene Blitz-Aufgaben zählen nicht als falsch.

## Daten

Punkte, Statistik und Abzeichen werden nur lokal im Browser gespeichert (`localStorage`, Schlüssel `uebungs-app-2kl-v1`). Es werden keine Daten übertragen. Der Blitz-Modus hängt nur neue Felder an (`modes.blitz`, `wdh.blitz`, `settings.blitzSek`). Ältere Speicherstände bleiben lesbar.

## Tests

`npm test` startet `test.js` mit jsdom. Geprüft wird unter anderem: Blitz ist wählbar, die Uhr ist sichtbar, ein Timeout zählt nicht als richtig und nicht als Fehlversuch, eine rechtzeitige richtige Antwort gibt weiter Punkte, ältere Speicherstände laden.
