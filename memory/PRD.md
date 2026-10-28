# NervenPfad – PRD

## Original Problem (DE)
Interaktives Nervensystem mit Daten aus echten Studien zu Nerven-Selbstheilung, Druckpunkten mit Korrelation zu Krankheiten/Symptomen, speziell Zahn-Nerven & Nichtanlagen (z. B. Zahn 13 → Becken), Datenbank, interaktive Nervenbahn für Masseure & Physios.

## User Choices
3D-Modell drehbar mit mehreren Ebenen · Evidenz-Stufe je Eintrag inkl. TCM/andere alte Heilmethoden · kuratierte Startdatenbank + PubMed-Live-Suche · Admin-Login · erst localhost + Drop-in-Ordner für weitere Studien · KI später.

## Architecture
FastAPI + MongoDB (entries, users, login_attempts); seed from `backend/seed_data.py` + real PubMed refs cached in `backend/data/seed_studies.json` (`enrich_seed.py`). PubMed via NCBI E-utilities (no key). Drop-in folder `backend/dropin/` (JSON/CSV → importiert/). React + react-three-fiber procedural body.

## Implemented (2026-06)
- 3D body with 8 layers (Haut, Muskeln, Skelett, Nerven, Druckpunkte, Meridiane, Zähne, Ketten), camera presets, auto-rotate, skin opacity
- 77 entries: 13 nerves, 24 points (TCM, Marma, trigger points, reflexology), 6 meridians, 2 chains, 32 teeth (FDI, innervation, agenesis, Voll scheme) – claims with evidence levels
- Dental chart with agenesis simulation (13 default) → chain Zahn 13 → Becken
- Symptom search, evidence filter, detail panel with therapist technique & contraindications
- PubMed live search, admin attaches/removes studies
- Admin (JWT): CRUD editor, drop-in upload/import with report

## Backlog
- P1: AI assistant (user said later)
- P1: more nerves (N. tibialis/fibularis separately, plexus), more trigger points
- P2: export/print of entry sheets for therapists, notes per patient
