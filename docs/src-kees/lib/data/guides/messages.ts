export const messagesGuide = `# Handleiding: Berichten

De berichten-pagina is je postvak voor @mentions en abonnementsupdates. Je kunt berichten lezen, markeren als gelezen en filteren.

---

## Je @mentions bekijken

Wanneer iemand je noemt met @mention in een bericht bij een proces, case, werkitem of project, verschijnt dit op je berichten-pagina.

1. Ga naar **Berichten** via de navigatiebalk (of klik op het badge-aantal in de header)
2. Je ziet standaard het tabblad **"Mijn berichten"**
3. Elk bericht toont:
   - **Afzender** met avatar en naam
   - **Entiteit-link** — Klikbaar, opent het item met het berichtentabblad
   - **Berichttekst**
   - **Tijdstip** met tooltip voor volledige datum/tijd
   - **Ongelezen indicator** — Blauwe stip + blauwe achtergrond
   - **@mentions** — Uitvouwbaar, klikbaar naar de entiteit
   - **Bijlagen** — Afbeeldingen met viewer, bestanden met downloadlinks
   - **Entiteit-type kleur** — Blauw=proces, Groen=case, Oranje=werk, Paars=project

### Een bericht openen

1. Klik op de **entiteit-link** in een bericht
2. Je wordt doorgestuurd naar het item met het berichtentabblad geopend

### Een bericht markeren als gelezen/ongelezen

1. Hover over een bericht
2. Klik op het **vinkje/mail-icoon** dat verschijnt
3. De status wisselt tussen gelezen en ongelezen

### Alles als gelezen markeren

1. Klik op **"Alles Als Gelezen Markeren"** bovenaan het berichtenoverzicht
2. Alle berichten (zowel mentions als updates) worden als gelezen gemarkeerd

> **Tip:** Het aantal ongelezen berichten wordt weergegeven in de header en als badge op het tabblad.

---

## Abonnementsupdates bekijken

Wanneer je geabonneerd bent op processen, cases, werkitems of projecten, ontvang je updates over wijzigingen.

1. Open het tabblad **"Updates"**
2. Je ziet alle update-berichten van je abonnementen
3. Elk bericht toont:
   - **Afzender** met avatar en naam
   - **Entiteit-type badge** met kleur
   - **Entiteit-naam** — Klikbare link
   - **Berichttekst**
   - **Bijlagen**
   - **Tijdstip**
   - **Entiteit-type kleur**

### Filteren op entiteit-type

1. Gebruik de **dropdown** bovenaan de updates-feed
2. Kies uit: Processen, Cases, Werkitems, Projecten
3. De lijst wordt direct gefilterd

### Een update markeren als gelezen

1. Klik op het **vinkje** bij een update-bericht
2. Of klik op **"Alles als gelezen markeren"** bovenaan

---

## Afbeeldingen bekijken

1. Klik op een **afbeelding-bijlage** in een bericht
2. Er opent een beeldviewer-modal
3. Klik buiten de afbeelding of op het sluit-icoon om te sluiten

`;

export const messagesMeta = {
    slug: "messages",
    title: "Berichten",
    description: "Je @mentions en abonnementsupdates bekijken en beheren.",
    icon: "mail",
    tasks: [
        "@mentions bekijken",
        "Berichten markeren als gelezen",
        "Updates-feed bekijken",
        "Filteren op entiteit-type",
        "Alles als gelezen markeren",
    ],
};
