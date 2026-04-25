export const helpGuide = `# Handleiding: Help & Ondersteuning

Via de help-pagina kun je ondersteuningsverzoeken indienen en de status van je bestaande tickets volgen. Je hebt geen account nodig om deze pagina te gebruiken.

---

## Een hulpverzoek indienen

1. Ga naar de **Help** pagina
2. Je ziet standaard het tabblad **"Indienen"**
3. Vul het formulier in:
   - **Onderwerp** (verplicht) — Korte beschrijving van je vraag
   - **Je vraag of verzoek** — Uitgebreide beschrijving
   - **E-mailadres** (verplicht) — Je e-mailadres voor communicatie
   - **Bijlagen** (optioneel) — Voeg bestanden toe via drag-and-drop
4. Klik op **"Verzoek indienen"**
5. Je ontvangt een bevestiging met een link naar het **"Bekijken"** tabblad

> **Wat gebeurt er achter de schermen?** Je verzoek wordt aangemaakt als een werkitem met type "help", status "backlog" en kanban-status "gepland". Het team ontvangt je verzoek en kan ermee aan de slag.

---

## Je tickets bekijken

Om je ingediende verzoeken te bekijken, moet je je identificeren via een magische link.

### Stap 1: Magische link aanvragen

1. Ga naar het tabblad **"Bekijken"**
2. Voer je **e-mailadres** in
3. Klik op **"Link versturen"**
4. Je ontvangt een e-mail met een magische link (24 uur geldig)

### Stap 2: Tickets inzien

1. Klik op de magische link in je e-mail
2. Je wordt doorgestuurd naar de help-pagina met al je tickets
3. Je ziet per ticket:
   - **Onderwerp** en **beschrijving**
   - **Statusbadge** — Nog op te pakken, Gepland, Mee bezig, In review, Afgerond
   - **Deadline**
   - **Toegewezen persoon** met avatar
   - **Bijlagen** (uitvouwbaar)
4. Klik op **"Taak details bekijken"** voor meer informatie

### Ticket details bekijken

1. Klik op **"Taak details bekijken"** bij een ticket
2. Er opent een zijmenu met twee tabbladen:
   - **Details** — Alle informatie over het ticket (onderwerp, status, prioriteit, toegewezen persoon, project, datums, beschrijving, tags, bestanden)
   - **Berichten** — Stuur berichten over het ticket. Je e-mailadres wordt gebruikt als afzender

> **Tip:** Als je magische link is verlopen, kun je een nieuwe aanvragen via hetzelfde e-mailadres.

`;

export const helpMeta = {
    slug: "help",
    title: "Help & Ondersteuning",
    description: "Ondersteuningsverzoeken indienen en de voortgang van je tickets volgen.",
    icon: "life-buoy",
    tasks: [
        "Hulpverzoek indienen",
        "Magische link aanvragen",
        "Tickets bekijken",
        "Berichten sturen over een ticket",
    ],
};
