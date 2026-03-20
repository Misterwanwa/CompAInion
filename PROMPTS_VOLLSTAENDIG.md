# CompAInion - Vollständige Prompts

**Stand:** 20.03.2026  
**Gesamtzahl:** 87 Prompts (ALLE vollständig implementiert)

Diese Datei enthält ALLE vollständigen Prompts des CompAInion-Extensions.

---

## Inhaltsverzeichnis

1. [Content & Writing](#content--writing)
2. [Code & Technik](#code--technik)
3. [SEO](#seo)
4. [Social Media](#social-media)
5. [Produkte & Shopping](#produkte--shopping)
6. [Recherche & Analyse](#recherche--analyse)
7. [Finance](#finance)
8. [YouTube](#youtube)
9. [Küche & Rezepte](#küche--rezepte)
10. [Sonstige](#sonstige)
11. [Spezielle Handler](#spezielle-handler)
12. [Bild-Kontextmenü](#bild-kontextmenü)
13. [Text-Kontextmenü](#text-kontextmenü)

---

## Content & Writing

### 3 Prompts generieren (`ahaMoments`)

```
Ich besuche gerade die folgende Website: ${context.url}

Seiteninhalt (Auszug): ${context.text.substring(0, 2000)}

Generiere mir genau 3 prägnante Prompts, die ich direkt in einer KI (Claude, ChatGPT etc.) verwenden kann, um überraschende, wertvolle oder nicht offensichtliche Erkenntnisse über diese Website, ihr Thema oder ihren Inhalt zu gewinnen. 

Anforderungen an die Prompts:
- Jeder Prompt soll einen echten "Aha-Moment" erzeugen – keine oberflächlichen Fragen
- Prompts sollen direkt copy-pasteable sein
- Unterschiedliche Perspektiven (z.B. kritisch, strategisch, kreativ)

Format:
1. [Prompt-Titel]: [Vollständiger Prompt-Text]
2. [Prompt-Titel]: [Vollständiger Prompt-Text]
3. [Prompt-Titel]: [Vollständiger Prompt-Text]
```

---

### TL;DR (`tldr`)

```
Erstelle eine TL;DR Zusammenfassung (Too Long; Didn't Read).

URL: ${context.url}

Originaltext:
"""
${context.text.substring(0, 4000)}
"""

TL;DR Format:
📌 **In 1 Satz:** [Kernbotschaft]

📋 **Die 3 wichtigsten Punkte:**
1. [Punkt 1]
2. [Punkt 2]
3. [Punkt 3]

⚡ **Action Item:** [Was sollte ich tun/merken?]

💡 **Key Takeaway:** [Hauptinsight]

Länge: Maximal 100 Wörter insgesamt. Schnell scannbar.
```

---

### Zusammenfassen (`summary`)

**Normal:**
```
Fasse den folgenden Inhalt zusammen:

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle eine ausgewogene Zusammenfassung:
• Einleitung mit Hauptthema (1 Satz)
• 5-7 Hauptpunkte als Bullet Points
• Fazit mit Key Takeaway
• Länge: etwa 20% des Originals

Sprache: Deutsch
Stil: Sachlich, präzise, ohne Informationen zu verlieren.
```

**Kapitel:**
```
Erstelle eine Kapitel-Zusammenfassung:
• Gliedere in logische Abschnitte/Kapitel
• Jeder Abschnitt: 3-5 Bullet Points
• Überschriften für jedes Kapitel
• Gesamtumfang: 10-15% des Originals
```

**Short:**
```
Erstelle eine extrem kurze Zusammenfassung:
• Maximal 3 Sätze
• Nur das Allerwichtigste
• Jeder Satz eine Kernbotschaft
• Für schnelles Scannen optimiert
```

---

### Zitate extrahieren (`extractQuotes`)

```
Extrahiere die besten Zitate aus diesem Text.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Zitat-Extraktion:
Finde 5-10 markante Zitate/Sätze, die:
• Inspirierend sind
• Zum Nachdenken anregen
• Für Social Media geeignet (Tweet/Post Länge)
• Den Kern einer Aussage treffen

Format pro Zitat:
"[Zitat]"
— Kontext: [Wo/Wer]
💡 Einsatzmöglichkeit: [Social Media, Präsentation, etc.]

Markiere das beste Zitat mit ⭐
```

---

### FAQ Erstellen (`createFAQ`)

```
Erstelle einen FAQ-Bereich (Häufig gestellte Fragen) basierend auf diesem Inhalt.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3500)}
"""

Erstelle 8-12 FAQ-Einträge:
• Beginne mit den wahrscheinlichsten Anfänger-Fragen
• Steigere die Komplexität nach unten
• Decke verschiedene Aspekte ab (Nutzen, Nutzung, Preis, Probleme)

Format pro Eintrag:
**Q: [Frage]?**
A: [Kurze, präzise Antwort mit direktem Nutzen]

Antworte auf Deutsch.
```

---

### Quiz erstellen (`createQuiz`)

```
Erstelle ein Quiz basierend auf dem Inhalt dieser Website.

Thema/URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3500)}
"""

Quiz-Struktur:
• 10 Fragen insgesamt
• 3 Leicht (Faktenwissen)
• 4 Mittel (Verständnis)
• 3 Schwer (Anwendung/Analyse)

Format pro Frage:
Q[N]: [Frage]
a) [Option]
b) [Option]
c) [Option]
d) [Option]

Richtige Antwort: [Buchstabe]
Erklärung: [Warum ist diese Antwort richtig?]

Füge am Ende eine Bewertungsskala hinzu (z.B. 8-10 richtig = Experte).
```

---

### Checkliste (`checklist`)

```
Erstelle eine praktische Checkliste basierend auf dem Inhalt dieser Website.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3000)}
"""

Erstelle:
1. **Must-Do-Checkliste** – Unbedingt erledigen (mit Checkbox-Format [ ])
2. **Optional-Checkliste** – Nice-to-have Punkte
3. **Reihenfolge** – Logische Abfolge der Schritte
4. **Zeitschätzung** – Ungefähre Dauer pro Punkt (falls sinnvoll)

Formatiere alles als direkt abhakelbare Markdown-Checkliste.
```

---

### Text vervollständigen (`completeText`)

```
Vervollständige den folgenden Text sinnvoll.

URL: ${context.url}

Vorhandener Text:
"""
${context.text.substring(0, 3000)}
"""

Anweisung:
Analysiere den Text und ergänze:
• Fehlende Schlusssätze/Absätze
• Unvollständige Listen
• Abgebrochene Gedanken
• Notwendige Erklärungen

Stil: Passend zum bestehenden Schreibstil.
Ton: Beibehalten.

Falls mehrere Vervollständigungsmöglichkeiten:
• Biete 2-3 Varianten an
• Oder frage nach der gewünschten Richtung
```

---

### Umschreiben (`rewrite`)

```
Formuliere den folgenden Text um.

URL: ${context.url}

Originaltext:
"""
${context.text.substring(0, 3000)}
"""

Umschreibung:
Erstelle 3 Varianten:
1. **Einfacher** – Für Laien verständlich
2. **Professioneller** – Fachlich, präzise
3. **Kreativer** – Storytelling-Ansatz

Jede Variante sollte:
• Die gleiche Kerninformation enthalten
• Unterschiedliche Satzstrukturen nutzen
• Den gleichen Umfang haben (±10%)

Frage mich: Gibt es spezielle Anforderungen (Zielgruppe, Ton, Länge)?
```

---

### Grammatik prüfen (`grammarCheck`)

```
Bitte prüfe den folgenden Text sorgfältig auf Grammatik-, Rechtschreib- und Zeichensetzungsfehler sowie stilistische Schwächen.

Vorgehen:
1. Liste alle gefundenen Fehler mit Textstelle auf
2. Erkläre kurz, warum es ein Fehler ist
3. Liefere am Ende den vollständig korrigierten Text als saubere Version

Wichtig: Verändere den Inhalt und Stil des Textes nicht – korrigiere nur sprachliche Fehler.
Sprache des Textes: automatisch erkennen.

Text:
"""
${context.text}
"""
```

---

### Genderkorrekte Sprache prüfen (`genderLanguage`)

```
Überprüfe den folgenden Text auf gendergerechte Sprache.

URL: ${context.url}

Text:
"""
${context.text.substring(0, 3000)}
"""

Analysiere:
• Generische Maskulina ("die User", "die Entwickler")
• Geschlechterstereotype ("die weibliche Zielgruppe")
• Ausschlussformulierungen
• Alternative Gender-Formen (Binnen-I, Doppelpunkt, Gendersternchen)

Bewertung:
• 🔴 Problem – Ausschluss oder Stereotyp
• 🟡 Nachbesserung – Könnte präziser sein
• 🟢 Gut – Bereits gendergerecht

Liefere konkrete Alternativformulierungen bei Problemen.
```

---

### Plagiatscheck (`plagiarism`)

```
Überprüfe den Text auf mögliche Plagiate oder kopierten Inhalt.

URL: ${context.url}

Zu prüfender Text:
"""
${context.text.substring(0, 3500)}
"""

Analysiere:
• Generische Phrasen, die überall vorkommen
• Sprungstellen (plötzlicher Wechsel des Schreibstils)
• Ungewöhnliche Formatierungen (z.B. verschiedene Anführungszeichen)
• Fachbegriffe ohne Kontext
• Wiederholungen (Copy-Paste-Spuren)

Einschätzung:
• Originalitätsgrad (%)
• Verdachtsmomente (falls vorhanden)
• Empfohlene Plagiats-Check-Tools für weitere Prüfung

Hinweis: Dies ist eine Heuristik, keine definitive Prüfung.
```

---

## Code & Technik

### CODE Code Review (`codeReview`)

```
Führe ein Code Review für den Code auf dieser Seite durch.

URL: ${context.url}

Gefundener Code:
"""
${context.text.substring(0, 4000)}
"""

Analysiere:
• 🔴 **Kritische Probleme** – Bugs, Sicherheitslücken, Performance-Killer
• 🟡 **Verbesserungen** – Refactoring, Clean Code, Best Practices
• 🟢 **Positives** – Was ist gut gelungen?
• 📋 **Architektur** – Struktur, Patterns, Abhängigkeiten

Für jedes Problem:
1. Beschreibung des Issues
2. Konkreter Code-Ausschnitt
3. Vorgeschlagene Lösung/Alternative

Sprache der Antwort: Deutsch, Code-Beispiele in Originalsprache.
```

---

### CODE Website kopieren (Code) (`copyCode`)

```
Extrahiere den gesamten relevanten Quellcode von dieser Website.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 4000)}
"""

Extrahiere und strukturiere:
1. **HTML-Struktur** – Semantischer Aufbau
2. **CSS-Styling** – Wichtige Styles (falls erkennbar)
3. **JavaScript** – Skripte und Funktionen
4. **Metadaten** – Open Graph, Meta-Tags

Formatiere den Code sauber mit Syntax-Highlighting-Markdown (```html, ```css, ```js).
Falls der Code zu lang ist, konzentriere dich auf die Hauptkomponenten.
```

---

### Diagramm erstellen (`createDiagram`)

```
Erstelle eine Diagramm-Beschreibung basierend auf dem Inhalt dieser Website.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3000)}
"""

Analysiere den Inhalt und schlage das passendste Diagramm vor:
• Flussdiagramm (Abläufe, Prozesse)
• Mindmap (Konzepte, Zusammenhänge)
• Balken-/Liniendiagramm (Daten, Statistiken)
• Gantt-Diagramm (Zeitplanung)
• ER-Diagramm (Datenbankbeziehungen)
• Systemarchitektur (Komponenten)

Liefere:
1. Empfohlenes Diagramm-Typ mit Begründung
2. Mermaid.js-Code (```mermaid...```) oder Textbeschreibung
3. Kurze Erläuterung der Knoten/Elemente
```

---

### Google Sheets Prompt (`googleSheetsPrompt`)

```
Erstelle einen Prompt für Visual Studio Code, der beim Erstellen eines Google Sheets Scripts hilft.

Ich arbeite gerade mit diesem Google Sheet:
URL: ${context.url}

Kontext der gewünschten Funktionalität:
"""
${context.text.substring(0, 2000)}
"""

Erstelle einen präzisen Prompt für VS Code, der folgendes enthält:
1. Klare Beschreibung der gewünschten Funktionalität
2. Bezug zum aktuellen Sheet-Kontext
3. Anforderungen an das Google Apps Script
4. Gewünschte Ein-/Ausgaben
5. Eventuelle Fehlerbehandlung

Der Prompt soll direkt in VS Code kopiert und verwendet werden können.
```

---

### Autolabel Googlemail (`autolabelGmail`)

```
Hilf mir, ein automatisches Gmail-Labeling-System zu erstellen.

Basierend auf dieser Website/Information:
URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 2500)}
"""

Erstelle:
1. **Label-Struktur** – Welche Labels/Kategorien sinnvoll sind
2. **Filterregeln** – Bedingungen für automatisches Labeln (Absender, Betreff, Inhalt)
3. **Google Apps Script** – Code für die Automatisierung
4. **Anleitung** – Schritt-für-Schritt Einrichtung

Optimiere für: Produktivität und Posteingang-Zero.
```

---

### Barrierefreiheit prüfen (`accessibility`)

```
Führe ein Accessibility-Audit (Barrierefreiheits-Prüfung) für diese Website durch.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3000)}
"""

Prüfe folgende Aspekte (basierend auf WCAG-Richtlinien):
• Kontrastverhältnisse (Text lesbar?)
• Alt-Texte für Bilder (sind vorhanden/aussagekräftig?)
• Überschriftenstruktur (logische Hierarchie?)
• Formular-Labels (korrekt zugeordnet?)
• Tastatur-Navigation (möglich?)
• ARIA-Attribute (sinnvoll genutzt?)

Bewertung:
• 🔴 Kritisch (muss behoben werden)
• 🟡 Nachbesserung empfohlen
• 🟢 Erfüllt

Gib konkrete Verbesserungsvorschläge.
```

---

## SEO

### SEO Audit (`seoAudit`)

```
Führe ein technisches SEO-Audit für diese Website durch.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3000)}
"""

Prüfe folgende SEO-Faktoren:
• Title-Tag (Länge, Keywords, Einzigartigkeit)
• Meta-Description (vorhanden, Call-to-Action?)
• Überschriften-Hierarchie (H1, H2, H3... logisch?)
• URL-Struktur (lesbar, Keywords?)
• Interne Verlinkung (gute Anker-Texte?)
• Bild-Optimierung (Alt-Texte, Dateinamen)
• Schema.org Markup (Rich Snippets möglich?)
• Ladezeit-Faktoren (erkennbar?)

Bewertung pro Punkt:
🟢 Gut / 🟡 Verbesserungswürdig / 🔴 Kritisch

Priorisierte To-Do-Liste für Quick Wins.
```

---

### SEO Content Analyzer (`seoContentAnalyzer`)

```
Analysiere den Content dieser Seite aus SEO-Perspektive.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3500)}
"""

Content-Analyse:
1. **Keyword-Dichte** – Welche Begriffe dominieren?
2. **Content-Lücke** – Fehlende Themen im Vergleich zu Wettbewerbern?
3. **Lesbarkeit** – Satzlänge, Absatzstruktur, Fachbegriffe
4. **Intent-Match** – Erfüllt der Content die Suchabsicht?
5. **Content-Tiefe** – Oberflächlich oder umfassend?
6. **Unique Value** – Was macht diesen Content besonders?

Vorschläge:
• Fehlende Keywords/Themen
• Struktur-Verbesserungen
• Erweiterungsmöglichkeiten
```

---

### SEO Hero Image Ideen (`seoHeroImages`)

```
Entwickle Hero-Image-Ideen für diese Website/ diesen Content.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Erstelle 5 Hero-Image-Konzepte:
Für jedes Konzept:
1. **Titel** – Kurzer Name
2. **Beschreibung** – Was ist zu sehen?
3. **Stil** – Fotorealistisch, Illustration, 3D, etc.
4. **Farbpalette** – Hauptfarben
5. **Prompt** – KI-Bildgenerierungs-Prompt (Englisch)

Ziel: Visueller Stop-Effekt, Markenwiedererkennung, emotionale Ansprache.
```

---

### SEO Keyword Cluster (`seoKeywordCluster`)

```
Erstelle Keyword-Cluster für dieses Thema.

Ausgangs-URL: ${context.url}

Themenkontext:
"""
${context.text.substring(0, 2500)}
"""

Keyword-Clustering:
Erstelle 3-5 thematische Cluster. Pro Cluster:
• **Haupt-Keyword** (hohes Volumen, allgemein)
• **Secondary Keywords** (spezifischer)
• **Long-Tail Keywords** (fragende/nutzbasiert)
• **Content-Typ** – Welche Seitenform passt?

Beispiel-Struktur:
Cluster 1: [Thema]
- Main: "..."
- Secondary: "...", "..."
- Long-Tail: "...", "..."
- Content: Blogpost / Produktseite / FAQ
```

---

### SEO Keywords (`seoKeywords`)

```
Recherchiere Keywords für diese Website/Seite.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 2500)}
"""

Keyword-Recherche:
1. **Primäres Keyword** – Das wichtigste Ziel-Keyword
2. **Sekundäre Keywords** – Ergänzende Begriffe (5-7)
3. **Long-Tail Variationen** – Spezifische Suchanfragen (5-10)
4. **LSI Keywords** – Semantisch verwandte Begriffe
5. **W-Fragen** – Häufige Fragen zum Thema

Für jedes Keyword:
• Geschätzte Suchintention (Info, Transaktion, Navigation)
• Content-Typ Empfehlung

Zusätzlich: Wettbewerbsanalyse (welche Domains ranken wahrscheinlich?).
```

---

### SEO Strategie (`seoStrategy`)

```
Entwickle eine SEO-Strategie für diese Website.

Website: ${context.url}

Aktueller Stand:
"""
${context.text.substring(0, 3000)}
"""

Strategie-Plan:
1. **Status Quo Analyse** – Was ist erkennbar? (Stärken/Schwächen)
2. **Zieldefinition** – Realistische SEO-Ziele (Traffic, Rankings)
3. **Quick Wins** – Maßnahmen mit sofortiger Wirkung
4. **Mid-Term** – 3-6 Monate (Content-Ausbau, Optimierung)
5. **Long-Term** – 6-12 Monate (Authority-Aufbau, Linkbuilding)
6. **Content-Priorisierung** – Welche Themen zuerst?
7. **KPIs** – Erfolgsmessung

Berücksichtige: Budget, Wettbewerb, Ressourcen (realistisch).
```

---

### SEO Themenideen (`seoTopicIdeas`)

```
Generiere Content-Ideen/Topideen für dieses Thema.

Thema/URL: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Content-Ideen:
Erstelle 15 Content-Ideen in verschiedenen Formaten:
• **Leitfäden** (How-To, Schritt-für-Schritt)
• **Listen** (Top 10, Best-Of)
• **Vergleiche** (vs., Unterschiede)
• **Fallstudien** (Beispiele, Erfolgsgeschichten)
• **Meinungen** (Trends, Prognosen)
• **Tools** (Checklisten, Templates)

Pro Idee:
• Titel-Vorschlag
• Ziel-Keyword (geschätzt)
• Format (Blogpost, Video, Infografik)
• Unique Angle (was macht diesen Content besonders?)
```

---

### SEO Wandle Website in Artikel um (`seoWebsiteToArticle`)

```
Wandle den Inhalt dieser Website in einen Artikel um.

Quelle: ${context.url}

Rohinhalt:
"""
${context.text.substring(0, 4000)}
"""

Umwandlung:
1. **Headline** – Aufmerksamkeitsstarker Titel
2. **Lead** – Einleitung mit Kernbotschaft
3. **Struktur** – Logischer Fluss mit Zwischenüberschriften
4. **Zitate** – Markante Aussagen markieren
5. **Fakten-Boxen** – Zahlen/Daten hervorheben
6. **Call-to-Action** – Was soll der Leser tun?

Stil: Journalistisch, faktenbasiert, unterhaltsam.
Länge: 800-1200 Wörter (je nach Ausgangsmaterial anpassbar).
```

---

## Social Media

### SOCIAL Bio erstellen (`socialBio`)

```
Erstelle Social Media Bios basierend auf diesem Kontext.

Website/Kontext: ${context.url}

Informationen:
"""
${context.text.substring(0, 2000)}
"""

Bio-Varianten:
1. **Twitter/X** (160 Zeichen) – Knapp, prägnant
2. **Instagram** (150 Zeichen) – Persönlich, mit Emoji
3. **LinkedIn** – Professionell, value-focused
4. **TikTok** – Jugendlich, authentisch
5. **YouTube** – Kanalbeschreibung

Für jede Plattform:
• Haupt-Bio
• Optionale Call-to-Action
• Link-in-Bio Text (falls relevant)

Frage mich nach: Zielgruppe und gewünschter Ton (seriös vs. locker).
```

---

### SOCIAL Clickbaitartikel (`socialClickbait`)

```
Erstelle Clickbait-Artikel-Ideen zu diesem Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Clickbait-Strategie (ethisch, nicht täuschend):
5 Headline-Varianten:
• **Neugier-Lücke** ("Das passiert, wenn...")
• **Zahlen** ("7 Dinge, die...")
• **Überraschung** ("Niemand erwartet, dass...")
• **Wie-Fragen** ("Wie ich in 30 Tagen...")
• **Kontrovers** ("Die unbequeme Wahrheit über...")

Dazu:
• Meta-Description (155 Zeichen)
• Eröffnungsparagraf (Hook)
• Vorschlag für Featured Image

Ziel: Hohe CTR, aber Content liefert was versprochen wird.
```

---

### SOCIAL Facebook Ideen (`socialFacebook`)

```
Entwickle Facebook-Content-Ideen für dieses Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Facebook-Content:
1. **Post-Ideen** (5 Varianten)
   - Frage-Post (Engagement)
   - Link-Post mit Teaser
   - Bild/Zitat-Post
   - Umfrage/Poll
   - Storytelling-Post

2. **Gruppen-Strategie** – In welchen Gruppen könnte man teilen?

3. **Werbung-Vorschlag** – Zielgruppen-Targeting

4. **Beste Posting-Zeit** – B2B vs. B2C

Jeder Post mit:
• Text (max. 2 Absätze)
• Call-to-Action
• Hashtag-Vorschläge (3-5)
```

---

### SOCIAL Hashtags (`socialHashtags`)

```
Generiere Hashtag-Sets für diesen Content.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 2000)}
"""

Hashtag-Strategie:
Für jede Plattform:

**Instagram** (25-30 Hashtags)
• 5 breite (1M+ Posts)
• 10 mittlere (100K-1M)
• 10 nischen (10K-100K)
• 5 spezifische (unter 10K)

**TikTok** (3-5 Hashtags)
• Trending + Nische kombiniert

**LinkedIn** (3-5 Hashtags)
• Professionell, branchenspezifisch

**Twitter/X** (1-2 Hashtags)
• Konversationsfördernd

Zusätzlich:
• Branded Hashtag-Vorschlag
• Community-Hashtags im Trend
```

---

### SOCIAL Instagram Ideen (`socialInstagram`)

```
Erstelle Instagram-Content-Ideen für dieses Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Instagram-Content-Plan:
1. **Feed-Posts** (3 Ideen)
   - Bild + Caption + Call-to-Action

2. **Stories** (3 Ideen)
   - Interaktive Elemente (Poll, Frage, Quiz)

3. **Reels** (3 Ideen)
   - Hook (erste 3 Sekunden)
   - Content-Beschreibung
   - Audio-Vorschlag

4. **Carousels** (2 Ideen)
   - Slide-für-Slide-Aufbau

Captions-Struktur:
• Hook (erste Zeile)
• Hauptteil (mit Zeilenumbrüchen)
• Call-to-Action
• Hashtags
```

---

### SOCIAL Post generieren (`socialPost`)

```
Erstelle Social Media Posts für diesen Content.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 2500)}
"""

Multi-Plattform Posts:
Erstelle für jede Plattform einen angepassten Post:

1. **Twitter/X** (280 Zeichen) – Kurz, knackig, Thread-Option
2. **LinkedIn** – Professionell, mit Einblick/Meinung
3. **Instagram** – Visuell fokussiert, mit Emoji
4. **Facebook** – Gesprächig, Community-orientiert

Jeder Post enthält:
• Haupttext
• Call-to-Action
• Passende Hashtags
• Beste Posting-Uhrzeit (Empfehlung)
```

---

### SOCIAL Social Media Ideen generell (`socialGeneral`)

```
Entwickle eine Social Media Strategie/Ideen für dieses Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Social Media Masterplan:
1. **Plattform-Auswahl** – Welche Kanäle passen?
2. **Content-Pillars** – 4-5 Hauptthemen (80/20 Regel)
3. **Posting-Frequenz** – Realistischer Rhythmus
4. **Content-Mix** – 50% Value, 30% Engagement, 20% Promo
5. **Tone of Voice** – Wie spricht die Marke?
6. **30-Tage-Ideen** – Content-Kalender-Vorschlag

Zusätzlich:
• Influencer-Collab Ideen
• User-Generated Content Strategie
• Krisenkommunikation (falls nötig)
```

---

### SOCIAL TikTok Ideen (`socialTikTok`)

```
Erstelle TikTok-Content-Ideen für dieses Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

TikTok-Content:
1. **Video-Ideen** (5 Stück)
   - Hook (Text-Overlay erste Sekunden)
   - Konzept (was passiert im Video?)
   - Dauer (15s / 30s / 60s)
   - Trend-Audio-Vorschlag
   - Call-to-Action

2. **Hashtag-Strategie** – FYP + Nische + Branded

3. **Posting-Zeit** – Optimale Uhrzeiten

4. **Engagement-Taktiken** – Kommentar-Bait, Duet-Starter

Beispiel-Formate:
• "POV: Du..."
• "3 Dinge, die..."
• "Erkläre es wie ich 5 wäre"
• "Day in the life"
```

---

### SOCIAL Twitter Ideen (`socialTwitter`)

```
Erstelle Twitter/X-Content für dieses Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Twitter-Content:
1. **Einzel-Tweets** (5 Stück)
   - Kurze Insights, Hot Takes, Fragen
   - Mit optimaler Länge (unter 280 Zeichen)

2. **Thread-Idee** – 5-7 Tweets Tiefe
   - Erster Tweet: Hook
   - Aufbau: Logische Kette
   - Letzter Tweet: CTA + Follow-Bitte

3. **Engagement-Taktik** – Wie Interaktionen generieren?

4. **Hashtag/Community** – Relevante Tags und Spaces

Stil: Snappy, wertvoll, authentisch.
```

---

### SOCIAL Vor- und Nachteile erfassen (`socialProsCons`)

```
Erstelle einen Social-Media-Post mit Vor- und Nachteilen.

Thema: ${context.url}

Inhalt:
"""
${context.text.substring(0, 2500)}
"""

Post-Struktur:
1. **Hook** – Warum ist das Thema relevant?
2. **Kurze Einleitung** – Kontext in 1-2 Sätzen

3. **Vorteile** (3-4 Punkte)
   - Als knackige Bullet Points
   - Mit Emoji

4. **Nachteile** (3-4 Punkte)
   - Ehrlich, aber fair
   - Mit Emoji

5. **Fazit/Meinung** – Persönliche Einschätzung
6. **Call-to-Action** – Frage an die Community

Optimiere für: Instagram Carousel oder Twitter Thread.
```

---

### SOCIAL YouTube Beschreibung (`socialYouTubeDesc`)

```
Erstelle eine YouTube-Videobeschreibung für diesen Content.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

YouTube-Beschreibung:
1. **Erste 2 Zeilen** – Hook (wird in Suche/Feed angezeigt)
2. **Hauptbeschreibung** – Was das Video bietet (3-5 Sätze)
3. **Timestamps** – Kapitelmarken vorschlagen
4. **Links** – Website, Social Media, verwendete Tools
5. **Hashtags** – 3-5 relevante Tags
6. **Disclaimer** – Falls nötig (Werbung, Affiliate)

Zusätzlich:
• Title-Vorschläge (3 Varianten)
• Thumbnail-Idee (Text + Visual)
• Tag-Vorschläge (SEO)
```

---

### SOCIAL YouTube Ideen (`socialYouTube`)

```
Entwickle YouTube-Video-Ideen für dieses Thema.

Thema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

YouTube-Content:
1. **Video-Ideen** (5 Stück)
   - Titel (Clickbait, aber ehrlich)
   - Format (Tutorial, Vlog, Review, etc.)
   - Geschätzte Länge
   - 3-Satz-Konzept

2. **Thumbnail-Konzepte** – Visual + Text-Overlay

3. **SEO-Strategie** – Hauptkeyword + Longtail

4. **Community-Tab** – Posting-Ideen zwischen Videos

Formate-Mix:
• Long-Form (10-20 Min)
• Shorts (unter 60 Sek)
• Livestream-Themen
```

---

## Produkte & Shopping

### Produkt Vor- und Nachteile (`productProsCons`)

```
Erstelle eine ausgewogene Vor- und Nachteils-Analyse dieses Produkts.

Produktseite: ${context.url}

Produktinformationen:
"""
${context.text.substring(0, 3000)}
"""

Analyse:

✅ **Vorteile (Pros)**
• Liste 5-7 konkrete Stärken
• Bewerte jede Stärke: 🔥 Stark / 👍 Gut / ➖ Neutral

❌ **Nachteile (Cons)**
• Liste 5-7 konkrete Schwächen
• Bewerte jede Schwäche: 🚫 Kritisch / ⚠️ Beachten / ➖ Akzeptabel

🎯 **Fazit**
• Für wen ist das Produkt ideal?
• Wer sollte Alternativen in Betracht ziehen?
• Preis-Leistungs-Einschätzung
```

---

### Shopping-Assistent (`shoppingAssistant`)

```
Du bist mein persönlicher Shopping-Assistent mit dem Ziel, mir bei jedem Kauf maximal Geld, Zeit und Aufwand zu sparen. Ich befinde mich gerade auf folgender Produktseite:

URL: ${context.url}
Seiteninhalt: ${context.text.substring(0, 2000)}

Führe für mich folgende Schritte durch:

1. **Produktidentifikation:** Nenne das genaue Produkt, Modell und relevante Spezifikationen.

2. **Preischeck:** Wo ist dieses Produkt aktuell günstiger erhältlich? Nenne bekannte Preisvergleichsportale (idealo, geizhals, Google Shopping) und schätze, ob der aktuelle Preis gut, durchschnittlich oder überteuert ist.

3. **Gutscheincodes:** Welche Gutschein- oder Rabattcodes könnten für diesen Shop aktuell funktionieren? Nenne gängige Quellen (coupert, honey, retailmenot) und typische Code-Muster des Shops.

4. **Cashback-Möglichkeiten:** Bei welchen Cashback-Portalen (Shoop, Igraal, Rakuten) ist dieser Shop gelistet? Wie hoch ist typischerweise die Cashback-Quote?

5. **Kaufempfehlung:** Soll ich jetzt kaufen oder warten? Begründe kurz (Saisonalität, Black Friday, Produktzyklus etc.).

6. **Alternativen:** Nenne 2–3 vergleichbare Produkte, die ein besseres Preis-Leistungs-Verhältnis bieten könnten.

Sei konkret, direkt und spare keine Details.
```

---

### Preisvergleich (`priceCompare`)

```
Hilf mir, den besten Preis für dieses Produkt zu finden.

Produktseite: ${context.url}

Produktinformationen:
"""
${context.text.substring(0, 2500)}
"""

Recherche-Plan:
1. **Produktidentifikation** – Genauer Name, Modell, SKU
2. **Preisvergleichsportale** – Idealo, Google Shopping, Geizhals
3. **Händler-Optionen** – Amazon, Media Markt, Fachhandel
4. **Gebraucht/Refurbished** – eBay Kleinanzeigen, rebuy, asgoodasnew
5. **Gutscheinmöglichkeiten** – Gängige Codes, Cashback-Portale
6. **Timing** – Aktuell guter Preis oder warten?

Erstelle eine strukturierte Vergleichsübersicht mit konkreten Suchlinks.
```

---

### Alternative hierzu (`alternative`)

```
Ich suche Alternativen zu dem, was auf dieser Website angeboten/beschrieben wird.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 3000)}
"""

Finde mir:
1. **Direkte Alternativen** – Konkurrenzprodukte/-dienstleistungen mit ähnlicher Funktion
2. **Open-Source-Alternativen** – Kostenlose, selbst hostbare Optionen
3. **Low-Budget-Alternativen** – Günstigere Optionen mit ähnlichem Nutzen
4. **Premium-Alternativen** – Hochwertigere Optionen (falls Budget keine Rolle spielt)

Für jede Alternative nenne:
• Name und kurze Beschreibung
• Hauptvorteile gegenüber dem Original
• Hauptnachteile
• Preisvergleich (ungefähr)
```

---

### Benötige ich das wirklich? (`doINeedThis`)

```
Hilf mir zu entscheiden, ob ich dieses Produkt wirklich brauche.

Produkt/Website: ${context.url}

Produktinformationen:
"""
${context.text.substring(0, 3000)}
"""

Stelle mir folgende Entscheidungsfragen:

**1. Verwendungszweck**
- Hast du ein konkretes Problem, das dieses Produkt löst?
- Wie oft würdest du es nutzen (täglich/wöchentlich/nie)?

**2. Alternativen**
- Was nutzt du aktuell stattdessen?
- Gibt es kostenlose/billigere Alternativen?

**3. Kosten-Nutzen**
- Preis pro Nutzung (geschätzt)
- Lebensdauer vs. Preis

**4. Impulskauf-Check**
- Würdest du es auch in 3 Tagen noch kaufen?
- Ist es ein "Nice to have" oder "Must have"?

**5. Fazit**
Empfehlung: Kaufen / Warten / Nicht kaufen

Antworte auf Deutsch und stelle mir die Fragen interaktiv.
```

---

## Recherche & Analyse

### AI Erkennung (`aiDetection`)

```
Analysiere den folgenden Website-Text auf typische Merkmale einer KI-Generierung (ChatGPT, Claude, Gemini, etc.).

URL: ${context.url}

Text:
"""
${context.text.substring(0, 4000)}
"""

Untersuche das Dokument auf folgende KI-typische Merkmale und bewerte jedes Kriterium:

1. **Monotone Wortwahl und Satzrhythmus**
   - Wiederholung ähnlicher Satzanfänge ("Der", "Es", "Dies")
   - Gleichförmige Satzlängen (zu viele Hauptsätze, wenig Variation)
   - Fehlende rhythmische Abwechslung

2. **Typische KI-Phrasen und Füllwörter**
   - Formulierungen wie: "Es ist wichtig zu betonen, dass...", "Alles klar", "Zusammenfassend lässt sich sagen..."
   - "In der heutigen Zeit...", "Einleitend muss gesagt werden..."
   - Übermäßiger Gebrauch von "sehr", "besonders", "signifikant", "relevant"
   - Starke Übergänge: "Darüber hinaus", "Des Weiteren", "Nichtsdestotrotz", "Insofern"

3. **Zu perfekte Struktur**
   - Übermäßig ausgewogene Absatzlängen
   - Mathematisch wirkende Abfolge (Einführung, 3 Argumente, Fazit)
   - Fehlende kleine Unvollkommenheiten, die menschliche Texte haben

4. **Inhaltliche Wiederholungen (Redundanz)**
   - Gleiche Ideen werden mit anderen Worten wiederholt
   - Selbe Aussage in Einleitung und Fazit ohne neue Erkenntnis
   - Ausschmückende Füllsätze ohne Informationsgehalt

5. **Übermäßige Übergänge und Strukturierungen**
   - Zu viele Zwischenüberschriften
   - Zu häufige Verwendung von Aufzählungen und nummerierten Listen
   - Starke, künstliche Übergänge zwischen Absätzen

6. **Oberflächliche Allgemeinplätze**
   - Floskeln ohne konkreten Bezug zum Thema
   - Allgemeingültige Aussagen, die auf alles zutreffen könnten
   - Vermeidung spezifischer Details oder persönlicher Erfahrungen

7. **Emotionale Distanz und Sterilität**
   - Fehlende persönliche Anekdoten oder subjektive Perspektiven
   - Keine regionalen oder kulturellen Nuancen
   - Zu sachlich, zu wenig menschliche Unregelmäßigkeit

8. **Formale Konsistenz**
   - Durchgehend gleicher Tonfall ohne Schwankungen
   - Keine spontanen Gedankensprünge oder Assoziationen
   - Fehlende rhetorische Fragen oder direkte Ansprache des Lesers

**Antworte im folgenden Format:**

## KI-Erkennung Analyse

### Gesamteinschätzung
**Wahrscheinlichkeit KI-generiert: [XX-XX]%** (Bereich angeben, z.B. 60-75%)

### Detaillierte Analyse

| Merkmal | Bewertung (0-10) | Bemerkung |
|---------|------------------|-----------|
| Monotone Wortwahl | X/10 | Kurze Begründung |
| Typische KI-Phrasen | X/10 | Konkrete Beispiele nennen |
| Zu perfekte Struktur | X/10 | Kurze Begründung |
| Inhaltliche Wiederholungen | X/10 | Kurze Begründung |
| Übergänge/Strukturierung | X/10 | Kurze Begründung |
| Oberflächliche Allgemeinplätze | X/10 | Kurze Begründung |
| Emotionale Distanz | X/10 | Kurze Begründung |
| Formale Konsistenz | X/10 | Kurze Begründung |

### Auffällige Textbeispiele
- "[KI-typische Phrase aus dem Text]"
- "[Wiederholung/Redundanz im Text]"
- "[Zu generischer Satz]"

### Fazit
[2-3 Sätze mit der Gesamteinschätzung und den stärksten Indikatoren]
```

---

### Antwort schreiben (`writeReply`)

```
Hilf mir, eine passende Antwort zu verfassen. Auf der aktuellen Website geht es um:

URL: ${context.url}

Kontext:
"""
${context.text.substring(0, 3000)}
"""

Erstelle einen Antwortentwurf, der:
• Professionell und höflich ist
• Auf den Kern des Themas eingeht
• Klare Position/Stellungnahme zeigt
• Für E-Mails, Kommentare oder Foren geeignet ist

Frage mich nach:
1. Was ist meine Position/Ziel der Antwort?
2. An wen richtet sich die Antwort (Kunde, Kollege, öffentlich)?
3. Soll der Ton eher formell oder locker sein?
```

---

### Ansicht erfassen (`captureView`)

```
Erstelle eine detaillierte Beschreibung der aktuellen Website, als würdest du jemandem am Telefon erklären, was zu sehen ist.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 2500)}
"""

Beschreibe:
1. **Layout & Struktur** – Wie ist die Seite aufgebaut?
2. **Visuelle Elemente** – Farben, Schriften, Bilder (geschätzt)
3. **Hauptnavigation** – Welche Menüpunkte gibt es?
4. **Kerninhalt** – Was ist die Hauptbotschaft?
5. **Call-to-Actions** – Was soll der Nutzer tun?
6. **Besonderheiten** – Auffällige Design-Elemente oder Funktionen

Antworte strukturiert mit Zwischenüberschriften.
```

---

### Daten formatieren in... (`extractData`)

**Tabelle:**
```
Erstelle eine gut strukturierte Tabelle aus den Daten. 
- Nutze Markdown-Tabellenformat mit | als Trennzeichen
- Erstelle aussagekräftige Spaltenüberschriften
- Fasse ähnliche Informationen logisch zusammen
- Füge bei komplexen Daten eine Kurzbeschreibung vor der Tabelle hinzu
```

**Datenbank:**
```
Formatiere die Daten als Datenbankeinträge.
- Zeige die Daten als strukturierte Datensätze mit Feldnamen und Werten
- Nutze das Format: Feldname: Wert (eines pro Zeile)
- Gruppiere zusammengehörige Datensätze visuell (z.B. mit Trennlinien oder nummeriert)
- Identifiziere Primärschlüssel oder eindeutige Identifikatoren wenn vorhanden
```

**Liste:**
```
Extrahiere die Daten als strukturierte Liste.
- Nutze hierarchische Aufzählungspunkte mit Einrückungen für Unterpunkte
- Gruppiere verwandte Informationen zusammen
- Nutze nummerierte Listen für rangierte oder sequentielle Daten
- Füge Zwischenüberschriften für verschiedene Kategorien hinzu
```

**Markdown:**
```
Formatiere die Daten als übersichtliches Markdown-Dokument.
- Nutze Überschriften (# ## ###) zur Strukturierung
- Hebe wichtige Begriffe **fett** oder *kursiv* hervor
- Nutze Code-Blöcke für technische Daten oder URLs
- Erstelle eine Inhaltsübersicht bei umfangreichen Daten
- Füge horizontale Linien (---) zur visuellen Trennung ein
```

**Hauptprompt:**
```
Analysiere den folgenden Seiteninhalt und extrahiere alle strukturierten Daten.

Website: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 4000)}
"""

Aufgabe:
1. Identifiziere alle strukturierten Daten auf der Seite (Produkte, Preise, Kontaktdaten, Termine, Listen, Spezifikationen, etc.)
2. Extrahiere diese Daten vollständig ohne Informationen zu verlieren
3. [Format-Anweisung]

Wichtig:
- Extrahiere ALLE relevanten Daten, nicht nur ein Beispiel
- Behalte die vollständige Information bei (keine Kürzung von wichtigen Details)
- Falls keine strukturierten Daten erkennbar sind, gib eine klare Rückmeldung
```

---

### Extrahiere Daten (`extractData2`)

```
Extrahiere strukturierte Daten aus diesem Inhalt.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 4000)}
"""

Extrahiere ALLE erkennbaren Datenpunkte:
• Namen (Personen, Organisationen, Produkte)
• Zahlen (Preise, Mengen, Statistiken, Daten)
• Kontaktdaten (E-Mail, Telefon, Adressen)
• URLs und Links
• Termine und Zeitangaben
• Technische Spezifikationen

Formatiere als strukturierte Liste mit Kategorien.
Bei Tabellen: Konvertiere in Markdown-Tabelle.
Bei Unsicherheiten: Markiere mit [?]
```

---

### Faktencheck (`factCheck`)

```
Führe einen Faktencheck für diese Aussagen durch.

URL: ${context.url}

Zu prüfende Inhalte:
"""
${context.text.substring(0, 3500)}
"""

Gehe jede Behauptung systematisch durch:
• ✅ **Verifiziert** – Stimmt, Quellen belegen dies
• ⚠️ **Kontextabhängig** – Teilweise wahr, aber nuanciert
• ❌ **Falsch** – Widerlegt durch Fakten
• ❓ **Nicht überprüfbar** – Zu wenig Informationen

Für jede bewertete Aussage:
1. Die konkrete Behauptung
2. Deine Einschätzung mit Begründung
3. (Falls möglich) Gegenstimmen oder bestätigende Quellen
```

---

### Im Internet suchen (`webSearch`)

```
Formuliere eine optimierte Suchanfrage für dieses Thema.

Ausgangsthema: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Erstelle Suchanfragen für:
1. **Google** – Allgemeine Websuche
2. **Google Scholar** – Wissenschaftliche Quellen
3. **News-Suche** – Aktuelle Entwicklungen
4. **Spezialisierte Datenbanken** – Je nach Thema (Stack Overflow, PubMed, etc.)

Nutze Suchoperatoren:
• "exakte Phrasen" für spezifische Begriffe
• site:domain für Quellen-Einschränkung
• -wort für Ausschluss
• filetype:pdf für Dokumente

Liefere direkt klickbare Links oder kopierbare Suchstrings.
```

---

### Kontext-Collector (`contextCollector`)

```
Sammle und strukturiere den Kontext dieser Website für spätere Nutzung.

URL: ${context.url}
Titel: ${context.title}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle ein Kontext-Paket:
1. **Kerninformation** – Was ist das Hauptthema?
2. **Wichtige Fakten** – Zahlen, Daten, Namen
3. **Zitate/Aussagen** – Markante Formulierungen
4. **Links** – Wichtige interne/externe Verweise
5. **Stichworte** – Tags für die Suche
6. **Zusammenfassung** – 3 Sätze für Quick-Reference

Formatiere als Copy-Paste-Block, der in Notion, Obsidian oder ähnliche Tools eingefügt werden kann.
```

---

### Kurs Page Sherlock (`pageSherlock`)

```
Führe eine detaillierte Website-Analyse durch (Page Sherlock Modus).

URL: ${context.url}
Titel: ${context.title}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Untersuche:
1. **Zweck der Seite** – Was will der Betreiber erreichen?
2. **Zielgruppe** – Für wen ist die Seite gedacht?
3. **Trust-Signale** – Was spricht für/ gegen Seriosität?
4. **Verkaufsstrategie** – Welche psychologischen Tricks werden genutzt?
5. **Technische Qualität** – Professionell oder billig?
6. **Transparenz** – Preise, Impressum, Datenschutz?
7. **Rote Flaggen** – Auffällige Warnsignale (falls vorhanden)

Antworte wie ein Detektiv: Sachlich, kritisch, mit konkreten Belegen.
```

---

### Lernhilfe (`learningHelp`)

```
Hilf mir, den Inhalt dieser Seite zu lernen und zu verstehen.

Thema: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3500)}
"""

Erstelle Lernmaterial:
1. **Kernkonzepte** – Die 3-5 wichtigsten Punkte
2. **Einfache Erklärung** – Als würdest du es einem 10-Jährigen erklären
3. **Beispiele** – Konkrete Anwendungsfälle
4. **Mnemonics** – Eselsbrücken zum Merken
5. **Verbindungen** – Bezug zu bekanntem Wissen
6. **Quiz-Fragen** – 5 Fragen zum Selbsttest

Ziel: Aktives Verständnis, nicht nur Auswendiglernen.
```

---

### Seite fragen (`askPage`)

```
Ich habe eine Frage zu dieser Seite. Bereite eine kontextuelle Antwort vor.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 4000)}
"""

Bereite dich vor:
Ich werde dir gleich eine spezifische Frage zu diesem Inhalt stellen. 
Nutze den obigen Kontext, um eine präzise, fundierte Antwort zu geben.

Falls meine Frage unklar ist:
• Stelle Rückfragen zur Präzisierung
• Biete verschiedene Interpretationsmöglichkeiten an
• Verweise auf relevante Stellen im Text

Warte nun auf meine Frage.
```

---

### Seite wiederverwenden (`reusePage`)

```
Wie kann ich diesen Inhalt wiederverwenden/repurposen?

Quelle: ${context.url}

Original-Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Content-Recycling Strategie:
1. **Format-Transformationen**
   - Blogpost → Twitter Thread
   - Artikel → LinkedIn Carousel
   - Text → Infografik-Skript
   - Daten → Video-Script

2. **Zusammenfassungen**
   - TL;DR Version
   - Twitter-freundliche Zitate
   - LinkedIn-Post Serie

3. **Erweiterungen**
   - Follow-up Content
   - Gegenpositionen darstellen
   - Aktualisierung in X Monaten

4. **Cross-Plattform**
   - Anpassungen für jeden Kanal

Priorisiere nach: Zeitaufwand vs. Impact.
```

---

### Story erstellen (`createStory`)

**Pen & Paper:**
```
Schreibe im Stil eines Tabletop-RPG-Abenteuers mit interaktiven Entscheidungspunkten, Hinweisen für Würfelmechaniken und einer detailreichen Welt für den Spielleiter
```

**Dramatisch:**
```
Schreibe mit maximaler emotionaler Tiefe, inneren Monologen, langsam aufgebautem Konflikt und einem unerwarteten, aber logisch nachvollziehbaren Wendepunkt
```

**Clickbait:**
```
Schreibe mit Cliffhangern am Ende jedes Absatzes, reißerischen Zwischenüberschriften, emotionalen Hochs und Tiefs und einem Finale, das zum Weiterteilen animiert
```

**Hauptprompt:**
```
Du bist ein erfahrener Geschichtenerzähler im Stil: ${style}.

Bevor du mit dem Schreiben beginnst, stelle mir genau 40 Fragen – und zwar genau die Fragen, die ein neugieriger Leser nach dem Lesen der fertigen Geschichte haben würde. Diese Fragen sollen aufdecken:
- Offene Handlungsstränge und potenzielle Plot Holes
- Motivationen der Charaktere, die unklar sein könnten
- Logische Lücken in der Weltenkonstruktion
- Zeitliche oder räumliche Widersprüche
- Emotionale Glaubwürdigkeit der Figuren

Nachdem ich alle 40 Fragen beantwortet habe, schreibe die Geschichte nach folgenden Pflichtregeln:
- **Keine Plot Holes:** Jede offene Frage aus den 40 Antworten muss in der Geschichte adressiert sein
- **Kontinuität:** Namen, Eigenschaften, Orte und Zeitlinien müssen konsistent bleiben – kein Element darf sich zwischen Szenen widersprechen
- **Kein loser Faden:** Jede eingeführte Figur oder jedes eingeführte Element muss eine Funktion für die Geschichte haben
- **Leserführung:** Der Leser soll zu keinem Zeitpunkt verwirrt sein, was gerade passiert und warum

[Stil-spezifische Zusatzanweisungen]

Beginne jetzt mit den 40 Fragen. Nummeriere sie durch.
```

---

### Wie ist die Rechtslage? (`legalCheck`)

```
Analysiere die juristische Rechtslage des Inhalts dieser Website.

Website: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 4000)}
"""

Führe eine rechtswissenschaftliche Analyse durch unter Verwendung angemessener juristischer Fachterminologie:

## 1. Rechtsgebiete
Identifiziere alle relevanten Rechtsgebiete (z.B. Privatrecht, Öffentliches Recht, Strafrecht, Wirtschaftsrecht, Arbeitsrecht, Datenschutzrecht, Immaterialgüterrecht, Verbraucherschutzrecht).

## 2. Rechtsdogmatische Einordnung
• **Tatbestand** – Welche rechtlich relevanten Sachverhalte liegen vor?
• **Rechtsfolge** – Welche rechtlichen Konsequenzen ergeben sich potenziell?
• **Rechtsgrundlagen** – Einschlägige Gesetze, Verordnungen, Richtlinien (§§ BGB, HGB, UWG, DSGVO, etc.)

## 3. Analyse mit Fachterminologie
Verwende juristische Begriffe wie:
- Verpflichtung/Rechtsanspruch
- Sorgfaltspflicht/Due Diligence
- Haftung (vertraglich/außervertraglich)
- Rechtsmangel/Freiheitsmangel
- Gewährleistung/Garantie
- AGB-Einbeziehung/Überraschende Klauseln
- Widerrufsrecht/Rücktrittsrecht
- Pflicht zur Aufklärung/Informationspflicht
- berechtigtes Interesse/legitimes Interesse
- Verhältnismäßigkeitsgrundsatz
- Vertrauensschutz/gutgläubiger Erwerb

## 4. Risikobewertung
• 🟢 Geringes Risiko
• 🟡 Moderates Risiko – Hinweise beachten
• 🔴 Hohes Risiko – Handlungsbedarf

## 5. Handlungsempfehlung
Konkrete nächste Schritte oder rechtliche Bedenken.

**Disclaimer:** Dies ist eine rechtswissenschaftliche Einschätzung ohne Gewähr. Für verbindliche Rechtsauskünfte ist ein Rechtsanwalt zu konsultieren.
```

---

## Finance

### FINANCE Einfluss auf Märkte (`financeMarket`)

```
Analysiere den potenziellen Einfluss dieses Themas auf die Finanzmärkte.

Thema/Website: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Marktanalyse:
1. **Betroffene Sektoren** – Welche Branchen sind direkt/indirekt betroffen?
2. **Aktientrends** – Wahrscheinliche Gewinner und Verlierer
3. **Anlageklassen** – Aktien, Bonds, Rohstoffe, Krypto
4. **Zeithorizont** – Kurzfristig vs. langfristige Auswirkungen
5. **Risiken** – Was könnte schiefgehen?

Hinweis: Dies ist keine Anlageberatung, sondern eine Einschätzung basierend auf öffentlich verfügbaren Informationen.
```

---

### FINANCE Finanznews hierzu (`financeNews`)

```
Finde aktuelle Finanznachrichten zu diesem Thema.

Thema/Website: ${context.url}

Kontext:
"""
${context.text.substring(0, 2000)}
"""

Recherchiere (simuliert) und berichte über:
1. **Aktuelle Entwicklungen** – Was ist in den letzten 24-48h passiert?
2. **Marktreaktionen** – Wie haben Märkte/Aktien reagiert?
3. **Analystenmeinungen** – Was sagen Experten dazu?
4. **Zusammenhänge** – Welche anderen Faktoren spielen eine Rolle?

Falls keine spezifischen aktuellen News erkennbar: Schlage vor, wo man aktuelle Informationen findet (Ticker, News-Portale).
```

---

## YouTube

### YouTube Kommentare zusammenfassen (`ytCommentsSummary`)

```
Fasse die YouTube-Kommentare zu diesem Video zusammen.

Video-URL: ${context.url}

Kommentare:
"""
${context.text.substring(0, 4000)}
"""

Kommentar-Analyse:
1. **Allgemeine Stimmung** – Positiv / Gemischt / Negativ (in %)
2. **Häufige Themen** – Was wird oft erwähnt?
3. **Kritikpunkte** – Konstruktive Negative Feedbacks
4. **Lob & Highlights** – Was gefällt besonders?
5. **Fragen** – Häufig gestellte Fragen
6. **Memes/Running Gags** – Insider-Witze

Zusammenfassung: 5-7 Bullet Points mit den wichtigsten Erkenntnissen.
```

---

### YouTube Zusammenfassung (`ytSummary`)

```
Erstelle eine Zusammenfassung des YouTube-Videos.

Video-URL: ${context.url}

Verfügbarer Kontext (Titel/Beschreibung/Kommentare):
"""
${context.text.substring(0, 3500)}
"""

Video-Zusammenfassung:
1. **Titel & Thema** – Worum geht es?
2. **Hauptpunkte** – 5-7 Kernbotschaften
3. **Zitate/Aussagen** – Markante Zitate aus dem Video
4. **Folgen/Next Steps** – Was soll der Zuschauer tun?
5. **Zielgruppe** – Für wen ist das Video relevant?

Format: Strukturierte Liste, schnell scannbar.
```

---

## Küche & Rezepte

### 🍳 Rezept - Einfach Backen Format (`recipe`)

```
Analysiere das Rezept auf dieser Website und formatiere es im "Einfach Backen" Format.

Rezept-URL: ${context.url}

Original-Rezept:
"""
${context.text.substring(0, 4000)}
"""

 WICHTIG: Behalte den Originaltext des Rezepts bei! 

Formatiere wie folgt:

## Zutatenliste (gesamt)
[Liste ALLER Zutaten mit Mengenangaben]

---

## Schritt 1: [Titel des Schritts]
**Zutaten für diesen Schritt:**
- [Zutat mit Menge]
- [Zutat mit Menge]

**Anleitung:**
[Originaltext dieses Arbeitsschritts - unverändert übernehmen]

---

[usw. für alle Schritte]

---

**Tipps & Tricks:** (falls im Original vorhanden)
**Backzeit & Temperatur:**
**Schwierigkeitsgrad:**
```

---

### 🍳 Rezept - Zutaten auflisten

```
Extrahiere alle Zutaten aus diesem Rezept als strukturierte Einkaufsliste.

Rezept-URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 4000)}
"""

Erstelle:
1. **Einkaufsliste** – Alle Zutaten alphabetisch sortiert mit exakten Mengenangaben
2. **Kategorisierte Liste** – Gruppiert nach: Obst/Gemüse, Backen/Gewürze, Kühlregal, Sonstiges
3. **Vorrats-Check** – Zutaten, die man wahrscheinlich schon hat (Salz, Zucker, Öl etc.) markieren

Format:
- [ ] 250g Mehl
- [ ] 3 Eier (Größe M)
- [ ] usw.
```

---

### 🍳 Rezept - Zutat ersetzen

```
Ich möchte ein Rezept nachkochen, aber mir fehlt folgende Zutat: "${missingIngredient}"

Rezept-URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 4000)}
"""

Schlage mir Alternativen vor:

1. **Direkter Ersatz** – Was kann ich 1:1 statt "${missingIngredient}" verwenden?
2. **Hausmittel-Alternative** – Was habe ich wahrscheinlich zuhause, das funktioniert?
3. **Gesunde Alternative** – Leichtere/gesündere Variante
4. **Allergiker-Option** – Falls "${missingIngredient}" ein Allergen ist

Für jede Alternative:
• Umrechnungsverhältnis (z.B. 1 Ei = 1 EL Leinsamen + 3 EL Wasser)
• Geschmacksveränderung (neutral/süßer/herber)
• Textur-Änderung (fluffiger/fester etc.)
• Wann funktioniert es NICHT?
```

---

### 🍳 Rezept - Alternatives Rezept

```
Schlage alternative Rezepte zu diesem vor.

Original-Rezept: ${context.url}

Rezept:
"""
${context.text.substring(0, 3000)}
"""

Finde Alternativen für:

1. **Schnellere Version** – Weniger als 30 Minuten Zubereitung
2. **Gesündere Variante** – Weniger Zucker/Fett, mehr Nährstoffe
3. **Vegan-Alternative** – Ohne tierische Produkte
4. **Budget-Version** – Günstigere Zutaten
5. **Gourmet-Upgrade** – Aufgewertet für besondere Anlässe

Für jede Alternative:
• Name des Rezepts
• Hauptunterschiede zum Original
• Wichtigste Zutaten-Änderungen
• Geschätzter Zeitaufwand
```

---

### 🍳 Rezept - Für Küchengerät umwandeln

```
Wandle dieses Rezept für folgendes Küchengerät um: ${device}

Original-Rezept: ${context.url}

Rezept:
"""
${context.text.substring(0, 4000)}
"""

 WICHTIG: Bleibe so originalgetreu wie möglich!

Konvertierung für: ${device}

1. **Gerät-spezifische Anpassungen:**
   - Temperaturanpassung (falls nötig)
   - Zeitumrechnung
   - Form/Gefäß-Größe
   - Besonderheiten des Geräts

2. **Schritt-für-Schritt Anleitung** speziell für ${device}:
   [Umgeschriebene Anleitung]

3. **Wichtige Hinweise:**
   - Was muss ich beim ${device} beachten?
   - Gefahren/typische Fehler vermeiden
   - Reinigungstipps

4. **Alternativ-Optionen** innerhalb des Geräts:
   - Verschiedene Programme/Einstellungen
   - Batch-Größen-Anpassung
```

---

### 🍳 Rezept - Wie hübsch anrichten

```
Erstelle eine detaillierte Beschreibung, wie ich dieses Gericht auf Michelin-Sterne Niveau anrichten kann.

Rezept: ${context.url}

Gericht:
"""
${context.text.substring(0, 3000)}
"""

Beschreibe:

1. **Tellerwahl** – Form, Größe, Farbe
2. **Anricht-Technik** – Positionierung des Hauptelements
3. **Saucenführung** – Smeared, dots, oder klassisch?
4. **Garnierung** – Kräuter, essbare Blüten, Texturen
5. **Höhen & Strukturen** – 3D-Elemente
6. **Farbenkontrast** – Visuelle Harmonie

Dann erstelle einen präzisen Prompt (auf Englisch) für ein KI-Bildgenerierungs-Tool wie DALL-E oder Midjourney, das zeigt, wie das fertig angerichtete Gericht aussehen könnte. 

Format: "Professional food photography, Michelin star plating, [Details], soft lighting, top-down angle, 8k --ar 4:5"
```

---

### 🍳 Rezept - Kalorien & Nährwerte

```
Analysiere die Nährwerte dieses Rezepts und erstelle eine kompakte Tabelle.

Rezept-URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 4000)}
"""

Berechne geschätzte Nährwerte (pro Portion, wenn nicht anders angegeben):

| Nährwert | Menge | % Tagesbedarf* |
|----------|-------|----------------|
| Kalorien | X kcal | X% |
| Protein | X g | X% |
| Kohlenhydrate | X g | X% |
| davon Zucker | X g | - |
| Fett | X g | X% |
| davon gesättigt | X g | - |
| Ballaststoffe | X g | X% |
| Natrium | X mg | X% |

*bei 2000 kcal Tagesbedarf

Zusätzlich:
- **Portionsgröße** – Wie viele Personen?
- **Gesundheitsbewertung** – 🟢 🟡 🔴 mit Begründung
- **Allergie-Hinweise** – Enthält: Gluten, Milch, Eier, Nüsse, etc.
- **Diät-Kompatibilität** – Keto, Low-Carb, Vegan, etc.

Hinweis: Dies sind Schätzwerte basierend auf Standardzutaten.
```

---

## Sonstige

### Deep Research (`deepResearch`)

```
Bevor du antwortest, stelle mir so viele Rückfragen, bis du zu mindestens 95 % sicher bist, dass du die folgende Aufgabe erfolgreich und vollständig erfüllen kannst.

Aufgabe: ${topic}

Recherchiere dieses Thema tiefgründig und umfassend nach folgenden Regeln:

1. **Quellen:** Verwende ausschließlich verifizierbare, glaubwürdige Quellen: offizielle Dokumentationen, Regierungs- oder Herstellerdatenbanken, peer-reviewte Publikationen oder anerkannte Fachmedien. Keine Blogs, Foren oder nicht verifizierbaren Seiten.

2. **Keine Spekulation:** Spekuliere nicht und erfinde keine Inhalte. Wenn eine Antwort nicht verifiziert werden kann, formuliere das explizit: „Diese Information konnte nicht verifiziert werden."

3. **Struktur der Ausgabe:**
   - Executive Summary (3–5 Sätze)
   - Hauptbefunde (gegliedert nach Themenbereichen)
   - Kritische Gegenargumente oder offene Fragen in der Forschung
   - Quellenverzeichnis mit Angabe von Autor, Titel, Jahr und URL (falls verfügbar)

4. **Transparenz:** Kennzeichne klar, was gesichertes Wissen ist, was aktuelle Forschungslage ist und was noch unklar oder umstritten ist.

Beginne mit deinen Rückfragen.
```

---

### Motivation (`motivation`)

```
Ich fühle mich gerade unmotiviert, folgende Aufgabe anzugehen: ${task}

Bitte hilf mir in zwei Schritten:

Schritt 1 – Verstehen:
Analysiere empathisch und ehrlich, warum ich mich bei dieser spezifischen Aufgabe wahrscheinlich so fühle. Berücksichtige mögliche psychologische Ursachen wie Prokrastination, Angst vor Versagen, Überwältigung, Langeweile oder fehlendes Sinngefühl. Sei direkt – kein falsches Aufmuntern.

Schritt 2 – Erster Schritt:
Schlage mir genau einen einzigen, kleinen, konkreten Schritt vor, mit dem ich jetzt sofort beginnen kann – so klein, dass er sich lächerlich einfach anfühlt. Erkläre kurz, warum genau dieser erste Schritt hilft, den inneren Widerstand zu überwinden.

Halte die Antwort kompakt (max. 150 Wörter gesamt).
```

---

### E-Mail Draft (`emailDraft`)

```
Hilf mir, einen E-Mail-Entwurf zu erstellen basierend auf diesem Kontext.

URL: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Erstelle einen E-Mail-Entwurf mit:
• Betreffzeile (prägnant)
• Anrede (anpassbar)
• Einleitung (Kontext kurz erklärt)
• Hauptteil (Kernbotschaft)
• Schluss (Call-to-Action oder nächste Schritte)
• Grußformel

Frage mich vor dem Entwurf:
1. Wer ist der Empfänger?
2. Was ist das Ziel der E-Mail?
3. Soll der Ton formell, freundlich oder direkt sein?
```

---

### Präsentation erstellen (`createPresentation`)

```
Ich möchte auf Basis der folgenden Website eine strukturierte Präsentation erstellen.

Website: ${context.url}
Seiteninhalt: ${context.text.substring(0, 3000)}

Erstelle eine vollständige Präsentationsgliederung mit den folgenden Anforderungen:
- 6–10 Folien
- Jede Folie hat: Titel, 3–5 Bullet Points, optionaler Speaker-Note-Hinweis
- Folie 1: Titelfolie mit Kernaussage
- Folie 2: Problemstellung / Kontext
- Folien 3–8: Hauptinhalt strukturiert nach Themenschwerpunkten der Website
- Vorletzte Folie: Fazit & Key Takeaways
- Letzte Folie: Call-to-Action oder weiterführende Ressourcen

Ausgabe als strukturierte Markdown-Liste, bereit zum Übertragen in PowerPoint, Google Slides oder Notion.
Sprache der Präsentation: Deutsch.
```

---

### Urlaubsplanung (`vacationPlan`)

```
Hilf mir bei der Urlaubsplanung für dieses Ziel.

Ziel/Reise-Website: ${context.url}

Kontext:
"""
${context.text.substring(0, 2500)}
"""

Reiseplanung:
1. **Beste Reisezeit** – Wetter, Preise, Touristenaufkommen
2. **Sehenswürdigkeiten** – Top 5-7 Attraktionen
3. **Insider-Tipps** – Weniger bekannte Highlights
4. **Essen** – Lokale Spezialitäten, Restaurant-Tipps
5. **Unterkunft** – Gute Gegenden zum Übernachten
6. **Transport** – Anreise, vor Ort
7. **Budget** – Geschätzte Kosten pro Tag
8. **Packliste** – Essentials für dieses Ziel

Frage mich nach: Reisedauer, Budget, Reisestil (Abenteuer vs. Entspannung).
```

---

### Witz erzählen (`tellJoke`)

```
Erzähle mir einen witzigen, aber jugendfreien Witz passend zum Kontext dieser Website.

Website: ${context.url}

Kontext:
"""
${context.text.substring(0, 2000)}
"""

Witz-Kriterien:
• Bezug zum Thema der Website (wenn möglich)
• Kurz und prägnant
• Für alle Altersgruppen geeignet
• Auf Deutsch

Format:
[Setup/Aufbau]
[Pointe/Auflösung]

Optional: Ein kurzer Emoji-Reaction-Block 😄
```

---

## Spezielle Handler

### Übersetzen (`translate`)

```
Übersetze den folgenden Text ins Deutsche. Falls der Text bereits auf Deutsch ist, übersetze ihn ins Englischen.

Erkenne die Ausgangssprache automatisch und übersetze natürlich, nicht wörtlich. Behalte den Ton und Stil bei.

Text:
"""
${textToTranslate}
"""
```

---

## Bild-Kontextmenü

### Bild senden
Nur die Bild-URL wird gesendet, kein Text-Prompt.

---

### Bild analysieren

```
Analysiere dieses Bild detailliert:
${imageUrl}

Beschreibe:
- Was ist auf dem Bild zu sehen?
- Welche Objekte, Personen oder Szenen sind erkennbar?
- Welche Farben, Formen und Stimmungen dominieren?
- Gibt es Text im Bild? Wenn ja, was steht dort?
- Was könnte der Kontext oder Zweck des Bildes sein?

Gib eine strukturierte, ausführliche Analyse auf Deutsch.
```

---

### Kleidung anprobieren

```
Du bist ein professioneller KI-Bildgenerator-Assistent.

Auf diesem Bild ist ein Kleidungsstück zu sehen:
${imageUrl}

Deine Aufgabe:
Erstelle einen präzisen Bild-Generierungs-Prompt (für Imagen, DALL-E oder ähnliche Tools), der dieses exakte Kleidungsstück so darstellt, als würde es von mir getragen werden.

Beschreibe dazu das Kleidungsstück zunächst exakt (Typ, Farbe, Schnitt, Material, Details).

Falls du noch kein Bild von mir hast: Bitte lade jetzt ein Foto von dir hoch, damit ich das Kleidungsstück realistisch auf dich anpassen kann.

Sobald du ein Foto hochgeladen hast, generiere direkt ein Bild, das zeigt, wie dieses Kleidungsstück an dir aussieht – möglichst realistisch, in natürlicher Haltung, mit passendem Hintergrund.
```

---

### 🎨 Stil des Bilds

```
Analysiere ausschließlich den visuellen STIL dieses Bildes:
${imageUrl}

WICHTIG: Beschreibe NUR die künstlerischen und stilistischen Merkmale, NICHT den Inhalt oder die abgebildeten Objekte/Personen/Tiere.

Fokussiere dich auf:
• Kunststil (z.B. Kubismus, Impressionismus, Surrealismus, Pixel-Art, Fotorealismus, minimalistisch, etc.)
• Farbschema (z.B. monochrome Schwarz-Weiß, warme Erdtöne, Neon-Farben, pastellfarben, komplementäre Kontraste, etc.)
• Beleuchtung (z.B. hartes Seitenlicht, weiches Diffuslicht, Gegenlicht, Studio-Beleuchtung, etc.)
• Textur und Oberflächenbeschaffenheit (z.B. grobe Pinselstriche, glatt digital, körnig filmisch, etc.)
• Komposition (z.B. symmetrisch, dynamisch, zentriert, Golden Ratio, etc.)
• Perspektive und Blickwinkel
• Ära/Zeitstil (z.B. 1920er Art Déco, 1980er Synthwave, mittelalterlich, futuristisch, etc.)
• Stimmung/Atmosphäre des Bildes

Am Ende erstelle einen prägnanten, englischen Bild-Generierungs-Prompt (für DALL-E, Midjourney, Imagen oder ähnliche Tools), der ausschließlich diesen STIL beschreibt, aber KEINEN spezifischen Inhalt enthält. Der Prompt soll so formuliert sein, dass man ihn mit einem beliebigen neuen Motiv kombinieren kann, während der Stil des Originalbildes erhalten bleibt.

Beispiel für das Format:
"[Stilbeschreibung], [Farbschema], [Beleuchtung], [Textur], [Komposition], [Stimmung] --ar 16:9"

Antworte auf Deutsch mit einer strukturierten Analyse und dem finalen Prompt am Ende.
```

---

## Text-Kontextmenü

### Frage stellen

```
Du bist ein hilfreicher Assistent.

**Markierter Text:**

> ${selectedText}

**Frage des Nutzers:**
${question}

**Anweisung:**
- Beziehe dich direkt auf den markierten Text
- Antworte präzise und auf Deutsch
- Nutze Markdown-Formatierung für eine klare Struktur
```

---

### Erklären

```
Du bist ein freundlicher Erklär-Experte, der komplexe Konzepte verständlich macht.

**Erkläre folgenden Text auf einfache, verständliche Weise:**

> ${selectedText}

**Deine Aufgabe:**
- Vereinfache technische oder schwierige Begriffe
- Nutze Analogien und Alltagsbeispiele
- Strukturiere die Erklärung mit Überschriften
- Antworte auf Deutsch in Markdown-Format
```

---

### Übersetzen (Text-Auswahl)

```
Du bist ein Übersetzungs-Experte.

**Übersetze folgenden Text:**

> ${selectedText}

**Anweisung:**
- Erkenne die Ausgangssprache automatisch
- Übersetze ins Deutsche (oder Englisch, falls der Text bereits Deutsch ist)
- Behalte Ton, Stil und Struktur bei
- Fachbegriffe oder Code nicht übersetzen, nur mit Erklärung
- Antworte in Markdown-Format
```

---

*Erstellt am 17.03.2026 - CompAInion v1.0*
