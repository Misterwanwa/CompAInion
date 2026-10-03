---
name: version-bump
description: Instructs the agent to automatically bump the version in manifest.json, package.json, and VERSIONS.md following Semantic Versioning (SemVer) on every code change, bugfix, or feature addition.
---

# Version Bump Workflow

Dieses Skill verpflichtet den Agenten dazu, bei jeder Code-Änderung die Versionsnummer der Erweiterung vorschriftsmäßig und konsistent hochzuzählen.

## 🎯 Regel: Automatische Versionierung bei jeder Änderung

Sobald im Projekt Code modifiziert, korrigiert, refaktoriert oder neu hinzugefügt wird, **muss** vor dem Erstellen des Git-Commits die Versionsnummer aktualisiert werden.

### 1. Relevante Dateien
Die Versionsnummer muss synchron in allen drei Dateien gehalten werden:
1. [`manifest.json`](file:///c:/Users/kevin/Documents/VSCode/CompAInion/manifest.json) — `"version": "X.Y.Z"` (Primäre Chrome-Extension Version)
2. [`package.json`](file:///c:/Users/kevin/Documents/VSCode/CompAInion/package.json) — `"version": "X.Y.Z"` (NPM / Package Version)
3. [`VERSIONS.md`](file:///c:/Users/kevin/Documents/VSCode/CompAInion/VERSIONS.md) — Tabelle oben und neuer Changelog-Abschnitt

### 2. SemVer-Schema (Semantic Versioning: `MAJOR.MINOR.PATCH`)

- **PATCH** (`X.Y.Z` → `X.Y.Z+1`):
  - Bugfixes, CSS-Korrekturen, kleinere Fehlerbehebungen (z.B. Pointer-Fix, Dialog-Handling, Typo-Korrekturen).
  - *Beispiel*: `2.8.0` → `2.8.1`
- **MINOR** (`X.Y.Z` → `X.Y+1.0`):
  - Neue Features, neue Modi, UI-Überarbeitungen, neue Tool-Aktionen (z.B. Autopilot-Modus, neue Theme-Unterstützung, Batch-Schrittlimit).
  - *Beispiel*: `2.8.1` → `2.9.0`
- **MAJOR** (`X.Y.Z` → `X+1.0.0`):
  - Grundlegende Architektur-Umstellungen oder nicht-rückwärtskompatible Änderungen.
  - *Beispiel*: `2.9.0` → `3.0.0`

### 3. Checkliste für den Commit-Ablauf

Vor jedem Commit muss folgende Reihenfolge eingehalten werden:

1. **Version hochzählen**:
   - In `manifest.json` und `package.json` die neue Version eintragen.
   - In `VERSIONS.md` die Tabelle aktualisieren und einen kurzen Changelog-Block unter `### vX.Y.Z (aktuell)` anlegen.
2. **Build verifizieren**:
   - `npm run build` (`tsc`) ausführen und sicherstellen, dass keine Fehler auftreten (Exit Code 0).
3. **Stagen**:
   - Alle modifizierten Code- und Versionsdateien stagen (`git add .`).
4. **Commit & Push**:
   - Commit-Nachricht mit Bezug zur Version verfassen: z.B. `feat/fix: ... (vX.Y.Z)`.
   - Sofort `git push` ausführen.
