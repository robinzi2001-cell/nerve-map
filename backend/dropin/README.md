# Drop-in-Ordner für zusätzliche Studien

Lege hier `.json`- oder `.csv`-Dateien ab und klicke im Admin-Bereich auf **„Ordner importieren“**.
Erfolgreich verarbeitete Dateien werden nach `importiert/` verschoben.

## CSV (Komma oder Semikolon)
```
entry_code;title;authors;journal;year;pmid;url;source;evidence;notes
zahn-13;Canine agenesis case series;Muster A;J Orofac Orthop;2021;;https://...;Uni-Bibliothek;schwach;eigene Notiz
```

## JSON – nur Studien
```json
[{"entry_code": "n-medianus", "title": "...", "authors": "...", "year": "2020", "url": "...", "source": "Cochrane"}]
```

## JSON – neue/aktualisierte Einträge
```json
{"entries": [{"code": "punkt-neu", "name": "Neuer Punkt", "layer": "druckpunkte", "tradition": "TCM",
  "evidence": "traditionell", "positions": [[-0.1, 1.2, 0.1]], "description": "..."}]}
```
Layer: `nerven`, `druckpunkte`, `meridiane`, `zaehne`, `ketten` · Evidenz: `gut`, `maessig`, `schwach`, `traditionell`
Koordinaten: x (rechts des Patienten = negativ), y (Höhe 0–1.75), z (vorne = positiv).
