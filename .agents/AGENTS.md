# Git, Versionierung & Deployment (GitHub-Push)
Nach jeder Änderung am Programm (sobald Code verändert, hinzugefügt oder korrigiert wurde) müssen die Änderungen zwingend versioniert, committet und auf GitHub in den remote Branch (z. B. `master`) gepusht werden.

**Vorgaben für den Ablauf:**
1. **Versionsnummer aktualisieren**: Bei jeder Änderung die Versionsnummer nach SemVer (Patch, Minor oder Major) synchron in `manifest.json`, `package.json` und `VERSIONS.md` hochzählen.
2. **Build verifizieren**: Immer ein erfolgreiches Build (`npm run build`) verifizieren.
3. **Stagen**: Alle geänderten Dateien stagen (`git add .` oder gezielte Auswahl).
4. **Commit**: Einen aussagekräftigen Commit-Text verfassen (inkl. Versionsangabe, z.B. `feat/fix: ... (vX.Y.Z)`).
5. **Push**: Sofort `git push` ausführen, um das automatische Deployment anzustoßen, damit die Änderungen live gehen.
