# Version History & Prompt Archiv

Dieses Dokument erklärt das Versionssystem für Prompts und wie du auf historische Versionen zugreifen kannst.

## 🏷️ Git Tags = Snapshots

Jede Version wird als **Git Tag** gespeichert. Das bedeutet: Der gesamte Code-Stand (inkl. aller Prompts) wird bei jedem Release eingefroren.

### Verfügbare Versionen

| Tag | Datum | Highlights |
|-----|-------|------------|
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
git checkout v2.2

# Zeige PROMPTS.md einer alten Version
git show v2.1:PROMPTS.md

# Vergleiche zwei Versionen
git diff v2.1..v2.2 -- PROMPTS.md
```

### Option C: Permalink (Direkt-Link)
Jede Datei hat einen permanenten Link pro Version:
```
https://github.com/Misterwanwa/CompAInion/blob/v2.2/PROMPTS.md
https://github.com/Misterwanwa/CompAInion/blob/v2.1/PROMPTS.md
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

### v2.2 (aktuell)
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
