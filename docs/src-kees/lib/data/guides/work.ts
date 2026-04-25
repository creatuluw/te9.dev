export const workGuide = `# Handleiding: Werk

Het werk-overzicht toont alle werkitems van het hele team. In tegenstelling tot je homepage (die alleen jouw werk toont), zie je hier alles. Je kunt uitgebreid filteren en de backlog beheren.

---

## Het werkoverzicht bekijken

1. Ga naar **Werk** via de navigatiebalk
2. Je ziet een Kanban-bord met alle werkitems van het hele team
3. De kolommen zijn: Backlog, Gepland, Mee bezig, In review, Afgerond, Overdue
4. Klik op een werkitem om naar de detailpagina \`/work/[id]\` te gaan

---

## Zoeken en filteren

Het werkoverzicht heeft uitgebreide filtermogelijkheden.

1. Klik op het **zoek-icoon** in de NavCard-header
2. Er opent een filtermenu bovenaan met:
   - **Zoekveld** met bereikkeuze: Alles, Taken, Personen
   - **Datumbereik** — Van/tot datums
   - **Toegewezen personen** — Multi-select van alle gebruikers
   - **Project** — Enkel selectie uit je projecten
   - **Proces** — Multi-select van alle processen
   - **Case** — Multi-select, gefilterd op geselecteerde processen
   - **Tags** — Multi-select van bestaande tags
   - **Prioriteit** — Laag, Normaal, Hoog
3. Klik op **"Tonen"** om filters toe te passen
4. Klik op het **gum-icoon** om alles te wissen

> **Tip:** Alle filters worden opgeslagen in de URL, zodat je filterinstellingen kunt delen met collega's.

---

## Een werkitem bekijken en bewerken

1. Klik op een werkitem in het Kanban-bord
2. Je ziet de detailpagina met zeven tabbladen:

| Tab | Functie |
|-----|---------|
| **Overzicht** | Alle velden van het werkitem bewerken |
| **Bestanden** | Bijlagen beheren |
| **Berichten** | Berichten met @mentions sturen |
| **Notities** | Notities en checklists |
| **Tijdslijn** | Binnenkort beschikbaar |
| **Instellingen** | Publiek delen aan/uitzetten |
| **Help** | Uitleg over het werkitem |

### Overzicht bewerken

1. Open het tabblad **"Overzicht"**
2. Pas de velden aan:
   - **Onderwerp** (max 55 tekens)
   - **Status** — Backlog, Gepland, Ad-hoc
   - **Kanban-status** — Backlog, Gepland, Mee bezig, In review, Afgerond
   - **Toegewezen aan** — Multi-select gebruikers
   - **Deadline** — Einddatum
   - **Uren** — Geschat aantal uren
   - **Prioriteit** — Laag, Normaal, Hoog
   - **Komt van** — E-mailadres van de aanvrager
   - **Project** — Koppel aan een project
   - **Voor wie is het** — Doelgroep
   - **Wat ga je doen** — Beschrijving
   - **Waarom doe je het** — Reden
   - **Tags** — Labels toevoegen
   - **Bijdrage aan resultaten** — 1-5 sterren beoordeling
3. Klik op **"Bijwerken"** onderaan om op te slaan

> **Let op:** Je ziet "Niet-opgeslagen wijzigingen" onderaan als er niet-opgeslagen wijzigingen zijn.

### Een werkitem verwijderen

1. Klik op het **prullenbak-icoon** in de header
2. Bevestig de verwijdering
3. Je wordt teruggestuurd naar het werkoverzicht

---

## Publiek delen van een werkitem

1. Open het tabblad **"Instellingen"**
2. Gebruik de **Publiek delen toggle** om een deel-link te genereren
3. Externe personen kunnen het werkitem bekijken via de link (alleen-lezen)
4. De publieke pagina toont het overzicht, bestanden en notities

---

## De backlog beheren

De backlog-pagina biedt een volledig overzicht van alle achterstallige items met geavanceerde filtering.

1. Navigeer naar \`/work/backlog\` of klik op **"Bekijk backlog"**
2. Je ziet alle backlog-items als kaarten
3. Standaard wordt gefilterd op jouw eigen taken

### Backlog filteren

Je kunt filteren op:
- **Zoekveld** met bereikkeuze
- **Toegewezen personen** — Multi-select
- **Taaktype** — Help, Case, Normaal
- **Komt van** — E-mail van de aanvrager
- **Deadline bereik** — Overdue, Vandaag, Morgen, <7/14/30/60/90 dagen, <1 jaar
- **Datumbereik** — Van/tot
- **Project, Case, Tags, Prioriteit**

### Een item naar planning verplaatsen

1. Klik op **"Gepland"** of **"Ad-hoc"** op een backlog-kaart
2. Het item wordt direct verplaatst (optimistische update)

### Uren-overzicht bekijken

1. Klik op het **uren-overzicht icoon** op de backlog-pagina
2. Er opent een zijmenu met een grafiek
3. Je kunt groeperen op: **persoon, project, bron of week**
4. Dit geeft inzicht in de verdeling van werk

### Een nieuw werkitem aanmaken vanuit de backlog

1. Klik op het **"+" icoon** op de backlog-pagina
2. Er opent de **BacklogDrawer**
3. Vul de gegevens in en sla op

`;

export const workMeta = {
    slug: "work",
    title: "Werk",
    description: "Alle werkitems van het team bekijken, filteren en beheren, inclusief de backlog.",
    icon: "briefcase",
    tasks: [
        "Werkoverzicht bekijken",
        "Zoeken en filteren",
        "Werkitem bewerken",
        "Werkitem publiek delen",
        "Backlog beheren",
        "Uren-overzicht bekijken",
    ],
};
