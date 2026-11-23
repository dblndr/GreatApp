# Übungs-App – v0.2

Kleine Übungs-App für Kinder der 2. Klasse, als einzelne HTML-Seite (`index.html`) plus `schulaufgaben.js`. Sie läuft im Browser auf Handy, Tablet und Laptop, ohne Anmeldung. Nach dem Laden braucht sie kein Internet.

Die Versionsnummer steht im Titel: **Übungs-App – v0.2**. Was sich geändert hat, steht in [CHANGELOG.md](CHANGELOG.md).

## Schulaufgaben

Zahlen von 0 bis 100, jedes Mal neu gemischt:

- Hunderterfeld ablesen
- Geheimschrift (Strich = Zehner, Punkt = Einer)
- Zahlwörter
- Größer oder kleiner
- Vorgänger und Nachfolger
- Nach der Größe ordnen, bei der kleinsten Zahl anfangen
- Zahlenstrahl: Zahl legen und Stelle ablesen
- Bis zum nächsten Zehner ergänzen
- Zahlenrätsel

**Größer/kleiner** gibt es als eigenen Modus und kommt in „Alles gemischt“ am häufigsten. Die Zeichen sind groß. Bei einem Fehler zeigt die App, welche Zahl größer ist.

## Täglich üben

- **Wochentage:** nach, vor, morgen, übermorgen, gestern, vorgestern, auch ein paar Tage weiter. Die Tages-Buttons sind gemischt.
- **Plus bis 20:** Schwerpunkt auf 4+7, 4+8, 6+7, 6+8, 8+9, 7+9, 7+8, 3+8 und den Tauschaufgaben.
- **Einmaleins** bis 10·10. Reihen lassen sich aufklappen.
- **Gemischt** aus diesen drei.
- **Blitz-Rechner** mit Countdown. Ist die Zeit um, gilt die Aufgabe als nicht gelöst.

Eine Runde hat 10 Aufgaben und bis zu 3 Sterne.

## Daten

Punkte, Statistik und Abzeichen bleiben nur in diesem Browser (`localStorage`, Schlüssel `uebungs-app-2kl-v1`). Es werden keine Daten übertragen. Alte Speicherstände aus v0.1 bleiben lesbar.

## Tests

```bash
npm install
npm test
```
