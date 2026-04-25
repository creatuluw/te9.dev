export const homepageGuide = `# Handleiding: Homepage (Dashboard)

Je homepage is je persoonlijke dashboard. Hier zie je al het werk dat aan jou is toegewezen, je backlog, en heb je toegang tot de chat-assistent en je instellingen.

---

## Je Kanban-bord bekijken

Op je homepage zie je een Kanban-bord met al je toegewezen werk. Het bord heeft de volgende kolommen:

- **Backlog** — Taken die nog niet zijn ingepland
- **Gepland** — Taken die zijn ingepland maar nog niet gestart
- **Mee bezig** — Taken waar je nu aan werkt
- **In review** — Taken die ter beoordeling zijn
- **Afgerond** — Voltooide taken
- **Overdue** — Taken die voorbij de deadline zijn

Elke taakkaart toont het aantal uren, de deadline, de toegewezen personen en tags.

1. Ga naar de homepage via het **Huis-icoon** in de navigatiebalk
2. Je ziet direct je Kanban-bord met alle taken gefilterd op jouw naam
3. Klik op een taakkaart om naar het detail \`/work/[id]\` te gaan

> **Tip:** Het aantal taken en totaal uren worden bovenin weergegeven in de NavCard.

---

## Je Backlog bekijken

Je persoonlijke backlog bevat alle achterstallige taken die aan jou zijn toegewezen.

1. Klik op **"Mijn Backlog"** in de NavCard op je homepage
2. Er opent een zijmenu met al je backlog-items, gesorteerd op deadline
3. Je kunt filteren op **week** met de BacklogWeeklyStats bovenaan
4. Gebruik de paginering onderaan om door alle items te bladeren (15 per pagina)

### Een backlog-item naar planning verplaatsen

1. Open je backlog via het zijmenu
2. Klik op een backlog-item
3. Klik op **"Gepland"** of **"Ad-hoc"** om het item naar planning te verplaatsen
4. Het item verdwijnt uit je backlog en verschijnt in het Kanban-bord

---

## Een nieuw werkitem aanmaken

1. Klik op het **"+" icoon** in de NavCard op je homepage
2. Er opent de **BacklogDrawer** aan de rechterkant
3. Vul de velden in:
   - **Onderwerp** (verplicht) — Wat ga je doen?
   - **Status** — Kies Backlog, Gepland of Ad-hoc
   - **Kanban-status** — Kies de gewenste kolom
   - **Toegewezen aan** — Selecteer een of meerdere personen
   - **Deadline** — Kies een einddatum
   - **Uren** — Geschat aantal uren
   - **Prioriteit** — Laag, Normaal of Hoog
   - **Project** — Koppel aan een project (optioneel)
4. Klik op **"Opslaan"** om het item aan te maken

---

## De Chat-assistent gebruiken

De chat-assistent helpt je met vragen en kan nieuwe taken aanmaken.

1. Klik op het **chat-icoon** in de NavCard op je homepage
2. Er opent een zijmenu aan de linkerkant
3. Je hebt twee modussen:
   - **Chat** — Stel algemene vragen aan de AI-assistent
   - **Taak** — Laat de AI helpen met het aanmaken van een nieuwe taak. Er verschijnt een voorbeeldweergave van de taak voordat je deze opslaat

---

## Je instellingen beheren

1. Klik op het **instellingen-icoon** in de NavCard op je homepage
2. Er opent een zijmenu met je beschikbaarheidsinstellingen
3. Stel je **uren per week** in
4. Stel je **startdatum** in
5. Klik op **"Opslaan"** om je instellingen bij te werken

---

## Snelkoppelingen gebruiken

Snelkoppelingen zijn persoonlijke bladwijzers naar vaak gebruikte pagina's.

### Een snelkoppeling openen

1. Klik op het **bladwijzer-icoon** in de NavCard op je homepage
2. Er opent een zijmenu met al je opgeslagen snelkoppelingen
3. Klik op een snelkoppeling om ernaartoe te navigeren

### Een snelkoppeling verwijderen

1. Open het snelkoppelingen-menu
2. Klik op de snelkoppeling die je wilt verwijderen
3. Er verschijnt een bevestigings-overlay
4. Klik opnieuw om te bevestigen

---

## Naar de volledige backlog navigeren

1. Klik op **"Bekijk backlog"** in de NavCard op je homepage
2. Je wordt doorgestuurd naar \`/work/backlog\` voor de volledige backlog-pagina

---

## Naar je weekplanning navigeren

1. Klik op **"Weekplanning"** in de NavCard op je homepage
2. Je wordt doorgestuurd naar \`/mijn-werk\` voor je weekplanning

`;

export const homepageMeta = {
    slug: "homepage",
    title: "Homepage (Dashboard)",
    description: "Je persoonlijke Kanban-bord, backlog, chat-assistent en instellingen beheren.",
    icon: "home",
    tasks: [
        "Kanban-bord bekijken",
        "Backlog beheren",
        "Nieuw werkitem aanmaken",
        "Chat-assistent gebruiken",
        "Instellingen beheren",
        "Snelkoppelingen gebruiken",
    ],
};
