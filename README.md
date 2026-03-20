# CompAInion - AI Companion Extension

Eine Chrome Extension, die KI-gestützte Analyse-Tools direkt auf jeder Website bereitstellt.

## Features

- **50+ AI Actions** von Zusammenfassung bis Code Review
- **Floating Interface** mit Aero-Glass Design
- **Local & Cloud LLM Support** (Ollama, LM Studio, OpenAI, Claude, etc.)
- **Kontext-Menü** mit Favoriten, Suche und Recent Actions
- **Baustellen-System** - Jeder Prompt markiert mit 🚧 (in Entwicklung) oder ✅ (fertig)

## Installation

### Entwickler-Modus
1. Chrome öffnen → `chrome://extensions/`
2. "Entwicklermodus" aktivieren
3. "Entpackte Erweiterung laden"
4. Diesen Ordner auswählen

## Verzeichnisstruktur

```
CompAInion/
├── manifest.json          # Extension Manifest v3
├── content.js             # Hauptlogik & Prompts
├── styles.css             # Aero Glass UI Styles
├── background.js          # Service Worker
├── options.js/html/css    # Einstellungen
├── popup.js/html          # Popup Interface
├── prompt-enhancer.js     # KI-Plattform Integration
├── local_llm_helpers.js   # Lokale LLM Kommunikation
└── README.md
```

## Aktions-Kategorien

### Content & Writing
- Zusammenfassen, TL;DR, Umschreiben
- Grammatik-Check, Plagiatserkennung
- FAQ, Quiz, Zitate extrahieren

### SEO
- Audit, Keywords, Content Analyzer
- Strategie, Themenideen

### Social Media
- Posts für Instagram, Twitter, LinkedIn
- Hashtags, Bios, YouTube Scripts

### Code & Technik
- Code Review, Website kopieren
- Diagramme erstellen

### Recherche
- Faktencheck, Website Analyse
- Deep Research, Legal Check

## Lokale LLM Integration

Unterstützt:
- **Ollama** (lokal)
- **LM Studio** (lokal)
- **OpenAI-kompatible APIs**

Einstellungen in der Extension-Options-Seite.

## Prompt-System

Jede Action hat einen optimierten Prompt mit:
- Kontext-Extraktion der aktuellen Seite
- Spezifischen Anweisungen für die KI
- Strukturierten Ausgabeformaten

## Lizenz

MIT License

## Autor

Erstellt für effizientes KI-gestütztes Browsen.
