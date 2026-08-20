# CompAInion - Vollständige Prompts

**Stand:** 20.08.2026  
**Gesamtzahl:** 91 Prompts (ALLE vollständig implementiert)

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
Du bist ein SEO-Experte. Führe ein umfassendes On-Page- und technisches SEO-Audit für diese Seite durch:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Analysiere folgende Bereiche und gib konkrete Optimierungsvorschläge:
1. **Meta-Tags & Title**: Ist der Titel optimal (Länge, Keyword-Platzierung)? Ist eine Meta-Description vorhanden und ansprechend formuliert?
2. **Überschriften-Struktur**: Ist die H1-H6 Hierarchie logisch aufgebaut? Gibt es mehrere H1?
3. **Content-Tiefe & Keyword-Fokus**: Ist der Inhalt ausreichend detailliert für Suchmaschinen? Welches Haupt-Keyword wird anvisiert und ist die Keyword-Dichte natürlich?
4. **Interne & Externe Verlinkung**: Sind sinnvolle Links und sprechende Ankertexte vorhanden?
5. **Bilder-SEO**: Haben die Bilder (falls im Text beschrieben) sinnvolle Alt-Tags und Dateinamen?
6. **Core Web Vitals & Mobile Friendliness (theoretische Einschätzung)**: Gibt es Anzeichen für Performance-Probleme oder schlechte mobile Lesbarkeit?
7. **SEO Quick Wins**: Nenne die 3 am schnellsten umsetzbaten Maßnahmen mit dem größten Hebel.
```

---

### SEO Content Analyzer (`seoContentAnalyzer`)

```
Analysiere den Inhalt dieser Seite als SEO Content Specialist. 

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Prüfe den Text auf folgende Kriterien:
1. **Lesbarkeitsindex (Flesch-Reading-Ease)**: Wie verständlich ist der Text für die Zielgruppe?
2. **Suchintention (Search Intent)**: Welcher Intent wird bedient (Informational, Transactional, Navigational, Commercial)? Passt der Content dazu?
3. **Semantische Dichte (WDF*IDF)**: Welche verwandten Begriffe und LSI-Keywords fehlen, um das Thema holistisch abzudecken?
4. **Strukturelle Lesbarkeit**: Sind Absätze kurz genug? Werden Bullet Points, Tabellen und fettgedruckte Schlüsselwörter sinnvoll eingesetzt?
5. **Call-To-Action (CTA)**: Gibt es eine klare Handlungsaufforderung? Ist sie psychologisch gut platziert?
6. **Konkrete Text-Optimierung**: Schlage 3 konkrete Textänderungen vor, um das Google-Ranking zu verbessern.
```

---

### SEO Hero Image Ideen (`seoHeroImages`)

```
Entwickle 5 creative Konzepte für das Hauptbild (Hero Image) dieser Webseite, um die CTR und das User-Engagement zu steigern.

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle für jedes der 5 Konzepte:
1. **Konzept-Name**: Ein prägnanter Titel.
2. **Visuelle Idee & Psychologische Wirkung**: Was ist zu sehen und welche Emotion soll es beim Besucher auslösen?
3. **Passender Stil**: (z. B. Minimalistischer 3D-Renders, authentische Business-Fotografie, Flat Illustration).
4. **Prompt für KI-Generatoren**: Ein detaillierter, englischer Prompt (für Midjourney, DALL-E 3 oder Stable Diffusion), um dieses Bild zu generieren.
5. **Technische Details**: Empfohlene Farbpalette (passend zum Thema) und Kontrasthinweise für Text-Overlays.
```

---

### SEO Keyword Cluster (`seoKeywordCluster`)

```
Erstelle ein strategisches Keyword-Clustering basierend auf dem Thema dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle eine Struktur aus Pillar- und Cluster-Seiten:
1. **Pillar Page (Hauptthema)**: Welches allumfassende Haupt-Keyword sollte die zentrale Säule sein?
2. **Keyword Cluster (3-5 Cluster)**:
   Unterteile das Thema in logische Sub-Cluster. Für jedes Cluster:
   - **Sub-Thema (Cluster Page)**
   - **Fokus-Keyword**
   - **Supporting Keywords (Long-Tail & W-Fragen)**
   - **Suchintention**
3. **Interne Verlinkungs-Strategie**: Wie sollten die Cluster-Seiten mit der Pillar-Seite verlinkt werden (Ankertexte, Linkfluss).
```

---

### SEO Keywords (`seoKeywords`)

```
Führe eine Keyword-Recherche und -Analyse für die folgende Seite durch:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Liefer folgende Keyword-Listen:
1. **Hauptkeyword (Focus Keyword)**: Das wichtigste Keyword, auf das diese Seite optimiert sein sollte.
2. **Sekundäre Keywords (5-8 Stück)**: Relevante Neben-Keywords, die im Text vorkommen sollten.
3. **Long-Tail Keywords (5-10 Stück)**: Spezifische, mehrteilige Suchphrasen mit geringerem Wettbewerb.
4. **W-Fragen (W-Questions)**: 5 konkrete Fragen, nach denen Nutzer suchen und die diese Seite beantworten sollte.
5. **Suchvolumen & SEO-Difficulty (Schätzung)**: Eine relative Einschätzung (Hoch/Mittel/Niedrig) für jedes Keyword.
```

---

### SEO Strategie (`seoStrategy`)

```
Entwirf eine langfristige, strategische SEO-Roadmap (6-12 Monate) für diese Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Struktur der SEO-Strategie:
1. **Wettbewerber-Identifikation**: Welche Arten von Websites sind die direkten organischen Konkurrenten für dieses Thema?
2. **Content-Lücken (Content Gap Analysis)**: Welche Aspekte des Themas fehlen auf der aktuellen Seite noch komplett?
3. **Technische SEO-Prioritäten**: Welche technischen Fundamente müssen gelegt werden (z. B. Schema.org Markup, Ladezeit)?
4. **Backlink- & Outreach-Strategie**: Welche Partner-Websites oder Branchenportale eignen sich für Linkaufbau? Welche Content-Assets könnten als "Linkmagneten" dienen?
5. **Monatlicher Meilenstein-Plan**: Konkrete To-Dos für Monat 1-3 (Quick Wins), Monat 4-6 (Content-Ausbau) und Monat 7-12 (Autoritätsaufbau).
```

---

### SEO Themenideen (`seoTopicIdeas`)

```
Generiere 15 hochrelevante, SEO-optimierte Content- und Themenideen, die perfekt zum Portfolio dieser Website passen:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Strukturiere die Ideen in folgende Kategorien (je 3-5 Ideen):
1. **Evergreen Content**: Zeitlose Ratgeber und Anleitungen.
2. **Trendthemen / News-Jack**: Aktuelle Themen mit schnellem Traffic-Potenzial.
3. **Vergleichs- & Testberichte**: Entscheidungshelfer für kaufbereite Nutzer.
4. **Interaktiver Content / Tools**: Ideen für Rechner, Checklisten oder Infografiken.

Für jedes Idee angeben:
- Arbeitstitel (Catchy & SEO-freundlich)
- Ziel-Keyword (Fokus)
- Suchintention
- Kurze Inhaltsgliederung (3 Sätze)
```

---

### SEO Website zu Artikel (`seoWebsiteToArticle`)

```
Schreibe den vorliegenden Werbe- oder Website-Text in einen SEO-optimierten, redaktionellen Fachartikel um:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Vorgaben für den Artikel:
- **Tonalität**: Fachlich fundiert, objektiv, informativ (nicht werblich!).
- **Struktur**:
  - Aufmerksamkeitsstarke Überschrift (H1) mit dem Hauptkeyword.
  - Einleitung (Teaser), die das Problem beschreibt und die Leselust weckt.
  - Hauptteil gegliedert in logische Zwischenüberschriften (H2, H3).
  - Fazit mit zusammenfassendem Schlusssatz.
- **SEO-Optimierung**: Integriere das Hauptthema organisch in den Text. Nutze Listen und Hervorhebungen für eine gute Scanbarkeit.
- **Umfang**: Mindestens 600 Wörter, detailreich und flüssig zu lesen.
```

---

## Social Media

### SOCIAL Bio erstellen (`socialBio`)

```
Erstelle professionelle und optimierte Biografien (Bios) für verschiedene Social-Media-Kanäle basierend auf dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Erstelle jeweils 2 Varianten (seriös/professionell & kreativ/locker) für folgende Plattformen:
1. **LinkedIn Profil-Slogan & Info-Text**: Fokus auf Value Proposition, Expertise und B2B-Klarheit.
2. **Twitter/X (Max. 160 Zeichen)**: Prägnanter Pitch mit einem relevanten Hashtag.
3. **Instagram (Max. 150 Zeichen)**: Strukturiert mit Zeilenumbrüchen, passenden Emojis und einem Call-To-Action (CTA) zum Link.
4. **TikTok (Max. 80 Zeichen)**: Extrem komprimierter, aufmerksamkeitsstarker Hook.
```

---

### SOCIAL Clickbait-Artikel (`socialClickbait`)

```
Generiere 10 ethische, aber klickstarke Headline-Ideen (Clickbait) basierend auf diesem Webseiteninhalt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Nutze bewährte psychologische Trigger für die Headlines:
1. **Die Neugier-Lücke (Curiosity Gap)**: Verrate fast alles, aber behalte das wichtigste Detail vor.
2. **Die Zahlen-Formel**: Nutze ungerade Zahlen ("Warum 7 von 10...")
3. **Der überraschende Fakt**: Stelle eine gängige Meinung in Frage.
4. **Die Angst, etwas zu verpassen (FOMO)**: Betone die Dringlichkeit oder Exklusivität.
5. **Der persönliche Benefit**: Direktes Versprechen an den Leser.

Gib für jede Headline an, für welches Social Network (Facebook, LinkedIn, Twitter, Pinterest) sie sich am besten eignet.
```

---

### SOCIAL Facebook Post (`socialFacebook`)

```
Schreibe einen ansprechenden Facebook-Post basierend auf dem Inhalt dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Anforderungen an den Post:
- **Einleitung (Hook)**: Ein packender erster Satz (z.B. eine Frage oder ein überraschender Fakt), der den Nutzer beim Scrollen stoppt.
- **Hauptteil (Body)**: 3-4 leicht verdauliche, strukturierte Absätze mit den Kernvorteilen oder Kernaussagen. Nutze Emojis, um den Text visuell aufzulockern.
- **Call-to-Action (CTA)**: Eine klare Aufforderung am Ende (z.B. "Besuche die Website für alle Details:", "Teile deine Meinung in den Kommentaren!").
- **Link-Platzhalter**: Füge den Link ${context.url} am Ende ein.
- **Hashtags**: 3-5 relevante Hashtags am Ende des Posts.
- **Tonalität**: Nahbar, freundlich, informativ und community-orientiert.
```

---

### SOCIAL Hashtags (`socialHashtags`)

```
Entwirf eine maßgeschneiderte Hashtag-Strategie für Social-Media-Posts zu diesem Thema:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Strukturiere die Hashtags in folgende Kategorien:
1. **Breite Nischen-Hashtags (Sehr populär)**: Große Reichweite, hoher Wettbewerb.
2. **Spezifische Themen-Hashtags (Mittlere Größe)**: Hohe Relevanz für die Zielgruppe.
3. **Long-Tail & Trend-Hashtags (Klein)**: Geringer Wettbewerb, hohe Conversion.
4. **Brand-Hashtags (Vorschläge)**: Eigene Hashtags für die Marke/Website.

Erstelle fertige Kopier-Sets für:
- Instagram (ca. 10-15 Hashtags)
- LinkedIn (3-5 Hashtags)
- Twitter/X (1-2 Hashtags)
- TikTok (4-6 Hashtags)
```

---

### SOCIAL Instagram Ideen (`socialInstagram`)

```
Erstelle 5 kreative Konzepte für Instagram-Posts basierend auf dem Inhalt dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Die Konzepte sollen verschiedene Formate abdecken:
1. **Karussell-Post (Infografik)**: Gliederung von Folie 1 bis 10 mit Textvorschlägen für die Slides.
2. **Reel-Konzept (Kurzvideo)**: Visuelle Szene, Text auf dem Screen, Audio-Vorschlag und Sprecher-Skript.
3. **Story-Sequenz (3 Stories)**: Interaktive Sticker-Ideen (Umfragen, Quiz, Regler) zur Aktivierung der Follower.
4. **Statischer Post**: Bildbeschreibung und vollständige Bildunterschrift (Caption) mit starkem Hook und CTA.
```

---

### SOCIAL Post generieren (`socialPost`)

```
Generiere gebrauchsfertige Social-Media-Posts zu dieser Website für verschiedene Plattformen:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle jeweils einen Post optimiert für:
1. **LinkedIn**: Professioneller Ton, Fokus auf Learnings, strukturiert mit Bullet Points, Einladung zur Diskussion, 3 relevante Hashtags.
2. **Twitter/X**: Maximal 280 Zeichen, starker Hook, kurze Kernaussage, Link-Platzhalter, 2 Hashtags.
3. **Instagram (Caption)**: Emotionaler oder inspirierender Einstieg, Emojis, klarer CTA zur Bio, Hashtag-Block.
4. **Facebook**: Längerer, erzählender Text (Storytelling), der Community-Interaktion fördert.
```

---

### SOCIAL Social Media Ideen generell (`socialGeneral`)

```
Entwirf eine ganzheitliche Social-Media-Content-Strategie für diese Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Die Strategie soll folgende Punkte abdecken:
1. **3 Content-Säulen (Content Pillars)**: Welche Hauptthemen sollten dauerhaft bespielt werden?
2. **Zielgruppen-Persona**: Für welchen fiktiven Nutzertyp ist dieser Content auf Social Media am relevantesten?
3. **Content-Mix-Verhältnis**: Verteilung von Information, Unterhaltung, Promotion und Interaktion.
4. **Kanal-Empfehlung**: Auf welchen Plattformen (LinkedIn, TikTok, Insta etc.) lohnt sich der Fokus am meisten und warum?
5. **Redaktionsplan (Vorschlag)**: Ein beispielhafter Wochenplan (Montag bis Sonntag) mit Posting-Ideen.
```

---

### SOCIAL TikTok Ideen (`socialTikTok`)

```
Entwickle 3 virale TikTok-Videokonzepte basierend auf diesem Inhalt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Jedes Konzept muss folgende Struktur haben:
1. **Der Hook (Erste 3 Sekunden)**: Visueller und verbaler Hook, der das Weiterscrollen verhindert.
2. **Das Videoskript**: Genaue Beschreibung der Szenen und gesprochener Text (Voiceover).
3. **Trend- & Audio-Empfehlung**: Welcher Musikstil oder Sound-Effekt passt dazu?
4. **Text-Overlay-Ideen**: Kurze Texteinblendungen für das Video.
5. **Caption & Hashtags**: Optimierter Begleittext für den TikTok-Algorithmus.
```

---

### SOCIAL Twitter Ideen (`socialTwitter`)

```
Erstelle Content für Twitter/X basierend auf dieser Seite:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Liefere:
1. **3 Einzel-Tweets**: Verschiedene Einstiegspunkte (Zahlen/Fakten, Zitat, kontroverse Frage). Jeweils unter 280 Zeichen inklusive Link-Platzhalter.
2. **1 Twitter-Thread (5-8 Tweets)**:
   - Tweet 1: Extrem starker Hook, der zum Klicken auf den Thread anregt.
   - Tweets 2-6: Stückweise Aufbereitung der Kernpunkte der Website (je ein Learning/Fakt pro Tweet).
   - Letzter Tweet: Zusammenfassung, Call-To-Action (Link zur Seite) und Frage an die Leser.
```

---

### SOCIAL Vor- und Nachteile Post (`socialProsCons`)

```
Erstelle Vor- und Nachteile-Posts zum Thema dieser Website für LinkedIn, Instagram und das YouTube Community Tab:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Generiere folgende Varianten:

1. **LinkedIn-Variante**:
   - Professionell-sachlicher Ton.
   - Kurze Einleitung zum Thema.
   - Gegenüberstellung mit Emojis (👍 Vorteile / 👎 Nachteile), maximal 3 prägnante Punkte je Seite.
   - Einbindung der Community durch eine offene Abschlussfrage.
   - 3 relevante Hashtags.

2. **Instagram-Variante (Karussell- & Caption-Konzept)**:
   - **Bildbeschreibung für Karussell-Folien**:
     * Folie 1 (Titel): Aufmerksamkeitsstarke Überschrift ("Die nackte Wahrheit über...")
     * Folie 2-3 (Vorteile): Visuelle Beschreibung + je 1-2 Key-Vorteile.
     * Folie 4-5 (Nachteile): Visuelle Beschreibung + je 1-2 Key-Nachteile.
     * Folie 6 (Fazit/CTA): "Schreib deine Meinung in die Kommentare!"
   - **Caption (Bildunterschrift)**: Kurzer Hook, Zusammenfassung der Pro/Contra-Punkte, Emojis, CTA zur Bio, Hashtag-Block.

3. **YouTube Community Tab-Variante**:
   - Kurzer, direkt ansprechender Post für Abonnenten.
   - Fokussierte Pro/Contra-Gegenüberstellung (sehr kompakt).
   - Umfrage-Vorschlag (Poll), die unter dem Post erstellt werden kann (z.B. "Wie steht ihr zu diesem Thema? Option A: ..., Option B: ..., Option C: ...").
```

---

### SOCIAL YouTube Beschreibung (`socialYouTubeDesc`)

```
Schreibe eine SEO-optimierte YouTube-Videobeschreibung für ein Video über das Thema dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Die Videobeschreibung soll folgende Abschnitte enthalten:
1. **Die ersten 2 Zeilen (wichtig für die Suche)**: Einladender Text mit den Haupt-Keywords, der die Kernaussage des Videos zusammenfasst.
2. **Ausführliche Zusammenfassung**: Detaillierter Text über den Videoinhalt (ca. 100-150 Wörter).
3. **Kapitelmarker (Timestamps - geschätzt)**: Video in Abschnitte strukturieren (z. B. 00:00 Intro, 02:30 Hauptteil...).
4. **Call-To-Actions & Links**: Verweis auf diese Website und Social Channels.
5. **Hashtags & Such-Tags**: 3 relevante Hashtags und eine Liste von 10 passenden Video-Tags (Keywords).
```

---

### SOCIAL YouTube Ideen (`socialYouTube`)

```
Entwickle 3 YouTube-Video-Konzepte basierend auf diesem Webseiteninhalt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Jedes Konzept muss enthalten:
1. **Video-Titel**: 3 Varianten (SEO-optimiert, Neugier-erweckend, Kurz & Prägnant).
2. **Thumbnail-Konzept**: Beschreibung des Bildes, Text auf dem Thumbnail, Farbschema.
3. **Hook (Erste 30 Sekunden)**: Wie wird der Zuschauer sofort gefesselt, um die Watchtime zu maximieren?
4. **Grob-Gliederung**: Gliederung der Video-Sektionen (Intro, Hauptteil 1-3, Outro).
5. **Idee für YouTube Shorts**: Ein Ableger-Konzept für ein 60-sekündiges Hochkantvideo.
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
Du bist ein investigativer Journalist und Forensiker ("Sherlock"). Analysiere diese Website auf Herz und Nieren:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Führe eine gründliche Detektiv-Analyse in folgenden Abschnitten durch:
1. **Seriosität & Trust-Faktoren**: Wirkt die Seite seriös? Gibt es rechtliche Hinweise (Impressumspflicht, Datenschutzerklärung)? Wer steckt dahinter (Unternehmen, Privatperson, Organisation)?
2. **Red Flags & Alarmzeichen**: Findest du Widersprüche, übertriebene Versprechungen, künstliche Verknappung ("Nur noch heute!"), manipulatives Wording (Dark Patterns) oder verdächtige Behauptungen?
3. **Geschäftsmodell & Monetarisierung**: Wie verdient diese Seite Geld? (z.B. Affiliate-Links, Werbung, Abos, Direktverkauf, Datensammlung, Spenden).
4. **Zielgruppe & Manipulationstechniken**: Wer soll hier angesprochen werden? Welche psychologischen Trigger (Social Proof, Authority, Scarcity) werden genutzt, um den Besucher zu beeinflussen?
5. **Detektivisches Fazit & Urteil**: Eine klare Einschätzung auf einer Skala von 1-10 (1 = hochgradig dubios/Scam, 10 = absolut vertrauenswürdig).
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
2. **Aktientrends** – Wahrscheinliche Gewinner und Verlierer. Nenne hier konkrete Werte mit ISIN und Bezeichnung
3. **Anlageklassen** – Greife auf die untenstehende Liste an Anlageklassen zurück und ordne das Thema den relevanten Klassen zu
4. **Zeithorizont** – Kurzfristig vs. langfristige Auswirkungen. Nenne den voraussichtlichen Horizont konkret in Zeit (z.B. "3-6 Monate", "1-2 Jahre")
5. **Risiken** – Was könnte schiefgehen?

Liste der Anlageklassen:
Aktien, Anleihen, Geldmarktanlagen, Fonds, börsengehandelte Fonds (ETF, ETC, ETN), Zertifikate, Optionen, Futures, Swaps, strukturierte Produkte, Versicherungsanlageprodukte, Immobilienanlagen, Rohstoffe, Devisen, alternative Anlagen, Beteiligungen, Kredite, Kryptowährungen und Token, Sachwerte und Sammlerstücke.

Detaillierte Unterteilung:
Aktienarten: Stammaktie, Vorzugsaktie, Namensaktie, Inhaberaktie, vinkulierte Namensaktie, Genussaktie, Belegschaftsaktie, Depotaktie, Penny Stock, Blue Chip, Growth-Aktie, Value-Aktie, Dividendenaktie, Zykliker, defensiver Wert, Small Cap, Mid Cap, Large Cap, REIT-Aktie.

Anleihen: Unternehmensanleihe, Staatsanleihe, Bundesanleihe, Länderanleihe, Kommunalanleihe, Pfandbrief, Covered Bond, Nachranganleihe, Hybridanleihe, Wandelanleihe, Pflichtwandelanleihe, Optionsanleihe, Nullkuponanleihe, Hochzinsanleihe, Inflationsindexierte Anleihe, Floating-Rate-Note, Schuldscheindarlehen, Green Bond, Social Bond, Sustainable Bond, High-Yield-Bond, Investment-Grade-Bond.

Fonds: Offener Aktienfonds, offener Rentenfonds, offener Mischfonds, Geldmarktfonds, Dachfonds, Branchenfonds, Themenfonds, Länderfonds, Regionenfonds, Faktor-Fonds, Absolute-Return-Fonds, Long-Only-Fonds, Long-Short-Fonds, Wertsicherungsfonds, nachhaltiger Fonds, Ethikfonds, Impact-Fonds, geschlossener Fonds, geschlossener Immobilienfonds, Infrastrukturfonds, Private-Equity-Fonds, Private-Debt-Fonds, Erneuerbare-Energien-Fonds.

ETF/ETC/ETN: Indexfonds, physisch replizierender ETF, synthetischer ETF, Aktien-ETF, Renten-ETF, Rohstoff-ETF, Immobilien-ETF, Sektor-ETF, Faktor-ETF, Smart-Beta-ETF, ESG-ETF, Themen-ETF, Hebel-ETF, inverse ETF, ETC, Gold-ETC, Silber-ETC, ETN.

Zertifikate: Indexzertifikat, Bonuszertifikat, Discountzertifikat, Expresszertifikat, Garantie-Zertifikat, Airbag-Zertifikat, Outperformance-Zertifikat, Sprint-Zertifikat, Kapitalschutz-Zertifikat, Reverse-Zertifikat, Quanto-Zertifikat, Twin-Win-Zertifikat, Barrier-Zertifikat, Knock-out-Zertifikat, Turbo-Zertifikat.

Derivate: Option, Call-Option, Put-Option, amerikanische Option, europäische Option, Future, Index-Future, Zinsfuture, Rohstoff-Future, Währungs-Future, Swap, Zinsswap, Währungsswap, Equity-Swap, Total-Return-Swap, Credit-Default-Swap.

Rohstoffe: Physisches Gold, Goldbarren, Goldmünze, Silber, Platin, Palladium, Industriemetall, Öl, Agrarrohstoff, Rohstoff-Future, Gold-ETF, Minenaktie.

Immobilien: Wohnimmobilie, Gewerbeimmobilie, Büroimmobilie, Hotelimmobilie, Pflegeimmobilie, REIT, Immobilienfonds, Immobilien-ETF, Immobilien-Crowdinvesting.

Kryptowährungen: Bitcoin, Ethereum, Stablecoin, Altcoin, Layer-1-Token, Layer-2-Token, Governance-Token, Utility-Token, Security-Token, tokenisierte Aktie, tokenisierte Anleihe, Krypto-Derivat, Perpetual-Future.

Alternative Anlagen: Private Equity, Venture Capital, Hedgefonds, Sachwert, Kunst, Oldtimer, Luxusuhren, NFT, Musikrechtebeteiligung, P2P-Kredit, Crowdinvesting.

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

### FINANCE Aktien Analyse (`financeStockAnalysis`)

```
Du bist ein renommierter Finanzanalyst und Chartered Financial Analyst (CFA). Führe eine tiefgehende, professionelle Aktien- und Unternehmensanalyse durch, basierend auf dem Inhalt dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Strukturiere deine Analyse in folgende detaillierte Abschnitte:

1. **Unternehmensprofil & Geschäftsmodell**:
   - Was ist das Kerngeschäft? Welche Produkte/Dienstleistungen generieren den meisten Umsatz?
   - In welchen geographischen Märkten ist das Unternehmen active?
   - Identifikation von Ticker, WKN/ISIN (falls aus dem Kontext ersichtlich).

2. **Fundamentalanalyse & Kennzahlen (soweit im Text vorhanden oder schätzbar)**:
   - Umsatz- und Gewinnentwicklung, Margen (Brutto-, EBITDA-, Netto-Marge).
   - Verschuldungsgrad, Cashflow-Generierung (Free Cashflow) und Dividendenpolitik.
   - Wichtige Wachstumtreiber.

3. **Wettbewerbsanalyse & Marktposition (Moat/Burggraben)**:
   - Wer sind die Hauptkonkurrenten?
   - Besitzt das Unternehmen einen nachhaltigen Wettbewerbsvorteil (z.B. starke Marke, hohe Wechselkosten, Netzwerkeffekte, Kostenvorteile)?
   - Porter's Five Forces (Branchenstrukturanalyse im Schnelldurchlauf).

4. **Chancen (Bull-Case) & Risiken (Bear-Case)**:
   - **Chancen**: Neue Märkte, technologische Trends, Synergien, Übernahmen.
   - **Risiken**: Regulatorische Hürden, makroökonomische Risiken (Zinsen, Inflation), Reputationsrisiken, technologische Disruption.

5. **Zukunftsausblick & Bewertung**:
   - Wo steht das Unternehmen in 3–5 Jahren?
   - Relative Bewertung (z.B. KGV, KBV, EV/EBITDA im Branchenvergleich - falls Schätzungen möglich).

6. **Analysten-Fazit & Investment-Thesis**:
   - Klares Urteil: **Kauf (Buy) / Halten (Hold) / Verkauf (Sell)**.
   - Ausführliche Begründung deines Urteils mit Kernargumenten.
   - Risikohinweis (Disclaimer).
```

---

### FINANCE Investitionsrechner (`financeInvestment`)

```
Erstelle ein umfassendes und flexibles Berechnungsmodell für ein Investitionsvorhaben basierend auf den Daten dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Liefere das Modell in drei verschiedenen interaktiven Formaten (wähle die passendsten aus):

1. **Tabellenkalkulation (Excel/Google Sheets)**:
   - Strukturierung von Eingabeparametern (Anschaffungskosten, jährliche Einnahmen/Ausgaben, Nutzungsdauer, Diskontsatz).
   - Formel-Vorschläge (z. B. `=IKV()`, `=KAPITALWERT()`, `=AMORTISATION`).

2. **Python-Skript (für Datenanalysten)**:
   - Ein sauberes, ausführbares Python-Skript (unter Verwendung von Standardbibliotheken oder `numpy`/`pandas`), das die Cashflows berechnet, den Kapitalwert (NPV), die interne Rendite (IRR) und die Amortisationszeit ermittelt und die Ergebnisse in der Konsole formatiert ausgibt.

3. **Interaktives HTML/JavaScript-Widget**:
   - Ein vollständiger, kopierbarer HTML/CSS/JS-Codeblock, der als lokales Mini-Tool oder Widget im Browser geöffnet werden kann. Dieses Widget soll Schieberegler (Slider) oder Eingabefelder für die wichtigsten Investitionsparameter enthalten und die Rentabilitätskennzahlen live im Browser berechnen.

4. **Szenarioanalyse (Best/Real/Worst Case)**:
   - Eine mathematische Übersicht der Auswirkungen von Zinsänderungen oder Abweichungen im Cashflow auf die Rentabilität.
```

---

### FINANCE Portfolio Bewertung (`financePortfolio`)

```
Analysiere, wie sich das Thema oder die Anlageklasse dieser Website in ein bestehendes Anlageportfolio integrieren lässt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Führe eine Portfolio-Bewertung durch:
1. **Asset-Allokation**: Zu welcher Anlageklasse gehört dieses Thema? (Nutze die offizielle Klassifizierung: Aktien, Immobilien, Rohstoffe, Krypto etc.)
2. **Korrelation**: Wie korreliert diese Anlageklasse typischerweise mit dem breiten Aktienmarkt (Gering, Mittel, Hoch)? Bietet sie Diversifikationsvorteile?
3. **Risiko-Rendite-Profil**: Wie hoch ist das geschätzte Risiko (Volatilität) im Vergleich zur erwarteten Rendite?
4. **Gewichtungsempfehlung**: Welcher Prozentsatz eines Gesamtportfolios (z. B. konservativ, ausgewogen, offensiv) sollte maximal in diese Anlageklasse investiert werden?
5. **Eignung**: Für welchen Anlegertyp (langfristig, kurzfristig, risikoavers, risikofreudig) ist dieses Investment geeignet?
```

---

### FINANCE Wie kann ich damit Geld machen? (`financeMakeMoney`)

```
Du bist ein erfahrener, kreativer Finanzstratege, Monetarisierungs-Experte und Startup-Mentor. Analysiere den Inhalt dieser Website bzw. dieses Thema tiefgehend und entwickle konkrete, realistische und hochgradig innovative Ansätze, wie man daraus finanziellen Nutzen ziehen (Geld verdienen oder Kosten/Steuern sparen) kann:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Strukturiere deine Analyse übersichtlich in folgende Abschnitte:

1. 💡 **Sofortige Spar- & Steuerspartipps (Geld behalten)**:
   - **Konkrete Einsparpotenziale**: Wo und wie lässt sich bei diesem Thema sofort bares Geld sparen oder Kosten optimieren?
   - **Steuerliche Hebel & Absetzbarkeit**: Welche Möglichkeiten zur steuerlichen Geltendmachung (Betriebsausgaben, Werbungskosten, Sonderausgaben, Abschreibungen, Förderungen/Subventionen) gibt es?

2. 🚀 **Geschäftsideen & Micro-Startups (Eigenes Business)**:
   - Entwickle **2-3 konkrete Business- und Gründungsideen**, die auf den Erkenntnissen, Problemen oder Trends dieser Website aufbauen.
   - **Voraussetzungen**: Was wird jeweils benötigt? (Startkapital-Schätzung, Kern-Skills, Tools/Technologien/Lizenzen).
   - **Risiko & Time-to-Money**: Risikobewertung (Gering/Mittel/Hoch) mit Begründung sowie realistischer Zeithorizont bis zu den ersten Einnahmen.

3. 💼 **Freelancer-, Service- & Beratungs-Opportunitäten**:
   - Welche konkreten Dienstleistungen, Consulting-Angebote oder Agentur-Services lassen sich daraus ableiten?
   - **Zielgruppe & Nachfrage**: Wer sind die zahlungsbereiten Kunden (B2B vs. B2C)?
   - **Preismodell**: Realistische Stundensätze oder Pauschal-Preispakete.

4. 🌐 **Digitale Produkte & Skalierbarer Content**:
   - Welche skalierbaren Produkte (z. B. Templates, E-Books/Guides, Checklisten, Mini-Kurse, spezialisierter Newsletter, Affiliate-Websites/Vergleichsportale) bieten sich an?
   - Wie lässt sich das Geschäftsmodell automatisieren?

5. ⚡ **Arbitrage & Marktlücken (Schnelle Hebel)**:
   - Gibt es Arbitrage-Potenziale (z. B. Informationsvorsprung nutzen, Preisdifferenzen zwischen Plattformen/Märkten, Vermittlungsprovisionen)?

6. 🎯 **Die "Low-Hanging-Fruit"-Empfehlung (Action Plan)**:
   - Was ist die einfachste, risikoärmste und schnellste Maßnahme, um innerhalb von 48–72 Stunden den ersten Euro zu verdienen oder einzusparen?
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

### 🍳 Rezept - Rezept prüfen / Rezept-TÜV (`recipeCheck`)

```
Prüfe das folgende Rezept auf Fehler, Unstimmigkeiten und Optimierungspotenzial.

URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 5000)}
"""

WICHTIG: Die folgenden Prüfungen sollen im Chat optisch klar strukturiert und abgehoben dargestellt werden (z.B. durch Trennlinien, Fettdruck oder Rahmen).

========================================

PRÜFUNG 1: ZEITANGABE
Ist die angegebene Gesamtzeit realistisch?
- Prüfe jeden Zubereitungsschritt und dessen Zeitbedarf
- Berücksichtige alle impliziten Vorbereitungszeiten aus der Zutatenliste (z.B. "4 large cloves garlic, minced", "500g Zwiebeln gewürfelt", "geriebener Käse", "gehackte Kräuter" – das Schälen, Hacken, Schneiden oder Reiben erfordert reale Arbeitszeit, die zwingend in die Vorbereitungszeit eingerechnet werden muss!)
- Berücksichtige Garzeiten, Aufheizzeiten
- NICHT berücksichtigen: Ruhezeiten / Wartezeiten

Format:
- Vorbereitungszeit: [XX Min] (inkl. aller impliziten Schneide-/Hack-/Schälarbeiten aus der Zutatenliste)
- Garzeit: [XX Min]
- Mischen/Zusammenfügen: [XX Min]
- Tatsächlich benötigte Zeit: [XX Min]

========================================

PRÜFUNG 2: SKALIERBARKEIT
Kann das Rezept sinnvoll vervielfacht werden?
(Hinweis zur Notation: Verwende ✓ für Ja/Erfüllt/Kein Problem [insbesondere: "Garzeit identisch" = ✓, wenn die Garzeit gleich bleibt und das Rezept somit skalierbar ist], und ✗ für Nein/Problem/Garzeit ändert sich).

2x Menge:
- [✓/✗] Topf/Pfanne groß genug
- [✓/✗] Backform geeignet
- [✓/✗] Garzeit identisch (✓ = bleibt identisch / skalierbar, ✗ = Garzeit weicht ab)
- [✓/✗] Sonstige Probleme: [...]

3x Menge:
- [✓/✗] Topf/Pfanne groß genug
- [✓/✗] Backform geeignet
- [✓/✗] Garzeit identisch (✓ = bleibt identisch / skalierbar, ✗ = Garzeit weicht ab)
- [✓/✗] Sonstige Probleme: [...]

4x Menge:
- [✓/✗] Topf/Pfanne groß genug
- [✓/✗] Backform geeignet
- [✓/✗] Garzeit identisch (✓ = bleibt identisch / skalierbar, ✗ = Garzeit weicht ab)
- [✓/✗] Sonstige Probleme: [...]

========================================

PRÜFUNG 3: LOGISCHE FEHLER
- Zutaten in der Liste, die im Rezept nicht verwendet werden: [auflisten oder "keine"]
- Zutaten im Rezept, die nicht in der Liste stehen: [auflisten oder "keine"]
- Fehlende Vorbereitungsschritte / implizite Schritte: Prüfe, ob in der Zutatenliste bereits vorverarbeitete Zutaten stehen (z.B. "4 large cloves garlic, minced", "gehackte Petersilie", "Zwiebeln gewürfelt"), deren Vorbereitungsschritt (Schälen, Hacken, Schneiden) in der Rezeptanleitung komplett fehlt und somit die reale Kochzeit unbemerkt erweitert: [auflisten oder "keine"]
- Widersprüchliche Anweisungen: [auflisten oder "keine"]
- Unmögliche/unlogische Schritte: [auflisten oder "keine"]

========================================

PRÜFUNG 4: FEHLER & EMPFEHLUNGEN
WICHTIG: Liste HIER NUR tatsächliche Fehler, unausgewogene Mengen oder konkrete Empfehlungen/Verbesserungen auf! Dinge, Zutaten oder Parameter, die in Ordnung (OK) sind, dürfen HIER NICHT aufgeführt werden.
Falls alles perfekt ist und keinerlei Fehler oder Empfehlungen vorliegen: Schreibe "Keine Fehler oder Korrekturbedarfe gefunden."

Format für gefundene Fehler & Empfehlungen:
- [Betroffene Zutat / Garzeit / Temperatur / Technik]: [Problem / Zu viel / Zu wenig / Bessere Alternative] – [Begründung und konkreter Korrekturvorschlag]

========================================

PRÜFUNG 5: NÄHRWERTE (gesamte Menge)
Kalorien: ... kcal
Protein: ...g
Kohlenhydrate: ...g
Fett: ...g
Ballaststoffe: ...g

========================================

PRÜFUNG 6: SAISONALITÄT
NUR ausgeben, wenn aktuell NICHT saisonale Zutaten verwendet werden.
Falls alle Zutaten saisonal sind: Diesen Abschnitt komplett entfallen lassen.

Falls nicht saisonal:
- Nicht saisonale Zutaten: [auflisten]
- Alternative saisonale Zutaten: [Vorschläge]

========================================

PRÜFUNG 7: GESCHIRRSPÜL-AUFWAND
NICHT mitzählen (gehen in Spülmaschine): Kleine Schüsseln, Reiben, Teigschaber, Messlöffel, Kochlöffel, Schneebesen, Tassen, Zangen

- Benötigte Töpfe/Pfannen: [Anzahl]
- Benötigte Formen/Bleche: [Anzahl]
- Benötigte Schüsseln: [Anzahl]
- Sonstiges Geschirr (nicht spülmaschinenfähig): [auflisten]
- Bewertung: [Gering / Mittel / Hoch]

========================================

FAZIT
[Maximal 3 Sätze mit den wichtigsten Erkenntnissen]
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
