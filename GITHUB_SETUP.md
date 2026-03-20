# GitHub Setup Anleitung

## Schritt 1: Repository erstellen

### Option A: GitHub Website
1. Gehe zu https://github.com/new
2. Repository Name: `CompAInion`
3. Beschreibung: `AI Companion Chrome Extension`
4. Public oder Private wählen
5. ✅ "Initialize this repository with a README" **nicht** ankreuzen (wir haben schon eine)
6. "Create repository"

### Option B: GitHub CLI
```bash
gh repo create CompAInion --public --description "AI Companion Chrome Extension"
```

## Schritt 2: Git initialisieren

Im Projekt-Ordner:

```bash
cd "c:\Users\kevin\Documents\VSCode\CompAInion"

# Git initialisieren
git init

# Alle Dateien hinzufügen
git add .

# Erster Commit
git commit -m "Initial commit: CompAInion AI Extension"
```

## Schritt 3: Mit GitHub verbinden

Nach dem Erstellen des Repos auf GitHub:

```bash
# Remote hinzufügen (ersetze USERNAME mit deinem GitHub Namen)
git remote add origin https://github.com/USERNAME/CompAInion.git

# Push
git branch -M main
git push -u origin main
```

## Fertig!

Dein Repo ist jetzt auf: `https://github.com/USERNAME/CompAInion`

## Nützliche Git Befehle

```bash
# Status checken
git status

# Änderungen committen
git add .
git commit -m "Beschreibung der Änderung"
git push

# Neue Version taggen
git tag -a v1.6 -m "Version 1.6"
git push origin v1.6
```
