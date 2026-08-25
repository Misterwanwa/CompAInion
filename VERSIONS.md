# Version History & Prompt Archiv

Dieses Dokument erklärt das Versionssystem für Prompts und wie du auf historische Versionen zugreifen kannst.

## 🏷️ Git Tags = Snapshots

Jede Version wird als **Git Tag** gespeichert. Das bedeutet: Der gesamte Code-Stand (inkl. aller Prompts) wird bei jedem Release eingefroren.

### Verfügbare Versionen

| Tag | Datum | Highlights |
|-----|-------|------------|
| `v2.8.0` | 2026-08-25 | Clippy Overhaul: 39 Aktionen, Eignung-vor-Zufall Pools, 8 kreative Sprech-Stile, 11 Posen, animierter Mund & Typewriter |
| `v2.7.0` | 2026-07-28 | Animierter Clippy-Assistent repariert & erweitert (Variationen, Distortion-Fix), Gemini 3.5 & Flash, Kontext-Matrix, Prompt Enhancer & Timeline |
| `v2.6.8` | 2026-06-15 | Performance Optimierungen, Local LLM Support, Deep Research Overlay |
| `v2.3` | 2026-03-22 | TL;DR in Zusammenfassen-Submenü integriert, 4 neue Zusammenfassungs-Optionen |
| `v2.2` | 2025-03-20 | Snipping Tool, FINANCE Menü, Dark Mode, 80+ Prompts |

## 📥 Zugriff auf alte Prompt-Versionen

### Option A: GitHub Web Interface
1. Gehe zu https://github.com/Misterwanwa/CompAInion
2. Klicke auf **"Releases"** (rechte Seitenleiste)
3. Wähle die gewünschte Version
4. Unter "Assets" findest du den Source Code Download

### Option B: Git Command Line
```bash
# Zeige alle Tags
git tag -l

# Checkout einer spezifischen Version
git checkout v2.8.0

# Zeige PROMPTS.md einer alten Version
git show v2.8.0:PROMPTS.md

# Vergleiche zwei Versionen
git diff v2.7.0..v2.8.0 -- PROMPTS.md
```

### Option C: Permalink (Direkt-Link)
Jede Datei hat einen permanenten Link pro Version:
```
https://github.com/Misterwanwa/CompAInion/blob/v2.8.0/PROMPTS.md
https://github.com/Misterwanwa/CompAInion/blob/v2.7.0/PROMPTS.md
```

## 🔄 Workflow: Neue Version erstellen

Bei jedem Release wird automatisch ein Tag erstellt:

```bash
# 1. Version in manifest.json aktualisieren
# 2. Committen
git add manifest.json
git commit -m "Bump version to X.Y"

# 3. Tag erstellen
git tag -a vX.Y -m "Release vX.Y: Beschreibung"

# 4. Pushen
git push origin master
git push origin vX.Y
```

## 📋 Changelog

### v2.8.0 (aktuell)
- **Clippy Prompt-Vielfalt & Eignung-vor-Zufall:**
  - 39 Candidate Actions für das LLM (14 neue Aktionen wie `shoppingAssistant`, `createPresentation`, `extractQuotes`, `accessibility`, `grammarCheck`, `checklist`, `socialBio`, etc.)
  - Neuer Eignung-vor-Zufall Algorithmus für Offline- & Fallback-Nutzung: Alle passenden Regeln landen in einem Pool, daraus wird zufällig gewählt
  - Über 110 handgeschriebene Fallback-Sprüche (4-6 pro Kategorie statt 1 fixer)
  - 8 Universal-Sprüche für unbekannte Webseiten
  - LLM Temperature auf `0.9` erhöht mit 8 distinkten Sprachstilen (🎭 Dramatisch, 🤓 Nerdig, 😏 Frech, 🎬 Pop-Kultur, 📢 Motivierend, 🕵️ Detektivisch, 🎲 Wortspiele, ❓ Rhetorisch)
- **Clippy Animations-Engine Erweiterung:**
  - 11 dynamische SVG-Posen: 5 brandneue Posen (`pose-nod`, `pose-peek`, `pose-dizzy`, `pose-celebrate`, `pose-shy`)
  - Organischer Posen-Wechsel alle 3–7 Sekunden (randomisiert)
  - Interaktiver Hover-Jubel (`pose-celebrate`) bei Mouse-Over
  - Rhythmisches Mund-Sprechen beim Erscheinen der Sprechblase
  - Typewriter-Einblendung für Text in der Sprechblase
  - Flüssigeres Eye-Tracking mit 6 Blickpositionen
- **Bugfixes:**
  - Syntaxfehler in Fallback-String behoben

### v2.7.0
- **Clippy Assistent Animation-Engine & Variationen:**
  - Verzerrungsfreie SVG-Struktur: Parent-Transformationen (`<g transform="translate(...)">`) von animierten Elementen entkoppelt
  - Exakte `transform-box: fill-box; transform-origin: center;` Einbindung verhindert das Springen von Augen, Pupillen und Augenbrauen
  - 6 lebendige, abwechslungsreiche Posen: `pose-float`, `pose-think`, `pose-bounce`, `pose-wink`, `pose-wave`, `pose-surprised`
  - Automatische kontextbasierte Start-Pose je nach Website-Aktion
  - Dynamischer Posen-Wechsler alle 4,5 Sekunden & interaktiver Hover-Bounce Effekt
- **Highlights seit 2.6.8:**
  - Gemini 3.5 & Flash Integration mit intelligenter Kontext-Matrix
  - Prompt Enhancer & Chat History Timeline Integration
  - Deep Research Mode & Local LLM Integration Framework
  - Umfassendes UI-Theme Redesign (Aero Glass, Retro, Modern Dark)

- **Prompts gesamt:** 87
- **Implementiert:** ~30 | **Geplant:** ~55

### v2.2
- **Neue Features:**
  - Snipping Tool für "Ansicht erfassen"
  - FINANCE Menü (Einfluss auf Märkte, Finanznews)
  - Dark Mode Support für Aero Glass Design
  - Sokrates-Fragekette
  - Rezept-Untermenü (7 Optionen)
  - DeepL Übersetzung
  - Logo Position top-left

- **Prompts gesamt:** 80+
- **Implementiert:** ~25 | **Geplant:** ~55

## 🔍 Prompt-Änderungen suchen

```bash
# Zeige alle Commits die PROMPTS.md geändert haben
git log --oneline -- PROMPTS.md

# Zeige wer was wann geändert hat
git blame PROMPTS.md

# Unterschied zwischen zwei Versionen
git diff v2.1..v2.2 -- PROMPTS.md
```

---

**Tipp:** GitHub Releases können auch ZIP-Dateien mit dem kompletten Prompt-Archiv als Assets enthalten. Frag mich, wenn du das automatisiert haben möchtest!
