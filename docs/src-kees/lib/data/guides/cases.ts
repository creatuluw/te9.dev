export const casesGuide = `# Handleiding: Cases

Een case is een actieve uitvoering van een proces. Wanneer je een case aanmaakt vanuit een proces, worden alle stappen en taken automatisch gekopieerd met berekende datums.

---

## Cases bekijken en filteren

Op de cases-pagina zie je een overzicht van alle cases als kaarten.

1. Ga naar **Cases** via de navigatiebalk
2. Je ziet een raster met case-kaarten (1, 2 of 4 kolommen)
3. Elke kaart toont:
   - **Casenaam** en **procesnaam**
   - **Projectnaam** (indien gekoppeld)
   - **Startdatum** en **deadline**
   - **Eigenaar** met avatar
   - **Statusbadge**: Gepland, Mee bezig, Afgerond of Te laat
   - Kleurgecodeerde rand op basis van status

### Zoeken en filteren

1. Klik op het **zoek-icoon** in de NavCard-header
2. Er opent een filtermenu bovenaan met:
   - **Zoekveld** — Met autocomplete-suggesties
   - **Zoekbereik** — Alles, Cases, Projecten, Taken, Processen, Personen
   - **Proces** — Filter op een of meerdere processen
   - **Project** — Filter op een of meerdere projecten
   - **Status** — Gepland, Mee bezig, Afgerond, Te laat
   - **Eigenaar** — Filter op een specifieke gebruiker
3. Klik op **"Tonen"** om de filters toe te passen
4. Alle filters worden opgeslagen in de URL, zodat je ze kunt delen

### Takenweergave gebruiken

1. Klik op de **toggle-knop** bovenin om naar de takenweergave te schakelen
2. Je ziet nu alle taken uit alle cases
3. Vink **"Alleen mijn taken"** aan om alleen jouw toegewezen taken te zien
4. Elke taakkaart toont de taaknaam, case, status, toegewezen personen, deadline en uren
5. Klik op een taak om naar de bijbehorende case-detailpagina te gaan

---

## Een nieuwe case aanmaken

### Via het + icoon (drawer)

1. Klik op het **"+" icoon** in de NavCard-header op de cases-pagina
2. Er opent de **CaseDrawer** aan de rechterkant
3. Vul de velden in:
   - **Proces sjabloon** (verplicht) — Doorzoekbare dropdown met alle actieve processen. Na selectie zie je het aantal stappen en taken
   - **Casenaam** (verplicht, max 255 tekens)
   - **Startdatum** (verplicht, standaard vandaag)
   - **Case-eigenaar** (optioneel) — Selecteer een gebruiker
   - **Project** (optioneel) — Doorzoekbare dropdown
   - **Bijlagen** (optioneel) — Drag-and-drop upload
4. Klik op **"Opslaan"** om de case aan te maken
5. Je wordt doorgestuurd naar de detailpagina van de nieuwe case

> **Wat gebeurt er achter de schermen?** Het systeem maakt de case aan (status: Gepland), kopieert alle processtappen naar casestappen met berekende datums, en kopieert alle procestaken naar casetaken met berekende deadlines.

### Via de aparte aanmaakpagina

1. Navigeer naar \`/cases/new\`
2. Selecteer een **proces sjabloon** (of gebruik \`?processId=X\` in de URL)
3. Vul de velden in en klik op **"Case Aanmaken"**
4. Je wordt doorgestuurd naar de detailpagina

---

## Een case bekijken en bewerken

1. Klik op een **casekaart** in het overzicht
2. Je ziet de detailpagina met acht tabbladen:

| Tab | Functie |
|-----|---------|
| **Algemeen** | Naam, eigenaar en project bewerken |
| **Stappen** | Casestappen en taken beheren |
| **Bestanden** | Bijlagen beheren |
| **Berichten** | Berichten sturen en ontvangen |
| **Notities** | Notities toevoegen |
| **Tijdslijn** | Binnenkort beschikbaar |
| **Instellingen** | Publiek delen aan/uitzetten |
| **Help** | Uitleg en FAQ |

### Algemene gegevens bewerken

1. Open het tabblad **"Algemeen"**
2. Pas aan:
   - **Casenaam** — Wijzig de naam
   - **Case-eigenaar** — Wijzig de eigenaar (dit updatet alle taken)
   - **Project** — Koppel aan een ander project (dit updatet alle taken)
3. Klik op **"Wijzigingen Opslaan"**

> **Let op:** De startdatum kan na aanmaken niet meer gewijzigd worden.

---

## Casestappen en taken beheren

Het tabblad **"Stappen"** is het belangrijkste onderdeel van een case.

### Een stap eigenaar toewijzen

1. Open het tabblad **"Stappen"**
2. Klik op de **eigenaar-selector** bij een stap
3. Selecteer een gebruiker uit de dropdown
4. De wijziging wordt direct opgeslagen (optimistische update)

### Taken beheren binnen een stap

Elke stap toont een lijst met taken. Per taak kun je:

- **Taak openen** — Klik op de taaknaam om de CaseTaskDrawer te openen
- **Toegewezen personen wijzigen** — Gebruik de multi-select dropdown
- **Taak voltooien** — Klik op **"Voltooien"** bij een actieve taak
- **Taak archiveren** — Klik op het archief-icoon (markeert als gesloten)
- **Ad-hoc taak verwijderen** — Klik op het prullenbak-icoon (alleen voor ad-hoc taken)
- **Sub-taak toevoegen** — Klik op het **"+" icoon** naast een taak

### Een handmatige taak toevoegen

1. Klik op het **"+" icoon** bij een stap
2. Er opent de **BacklogDrawer**
3. Vul de taakgegevens in
4. De taak wordt toegevoegd als ad-hoc taak aan de stap

### Taken herschikken met drag-and-drop

1. Sleep een taak naar een nieuwe positie binnen dezelfde stap
2. Of sleep een taak naar een **andere stap** om hem te verplaatsen
3. De nieuwe volgorde wordt automatisch opgeslagen

---

## Bestanden beheren

1. Open het tabblad **"Bestanden"**
2. Je kunt:
   - **Bestanden uploaden** via drag-and-drop of bestandskiezer
   - **Bestanden bekijken** en downloaden
   - **Bestanden verwijderen** via het verwijder-icoon
3. Bestanden worden opgeslagen via MinIO object-opslag

---

## Publiek delen van een case

Je kunt een case delen via een publieke link, zodat externe personen (zonder account) de case kunnen bekijken.

1. Open het tabblad **"Instellingen"**
2. Gebruik de **Publiek delen toggle**
3. Zet de toggle aan om een unieke deel-link te genereren
4. Zet de toggle uit om de link ongeldig te maken
5. De publieke pagina toont de stappen, bestanden en notities in een alleen-lezen weergave

---

## Een case verwijderen

1. Klik op het **prullenbak-icoon** in de header van de case-detailpagina
2. Er verschijnt een bevestigingsvenster
3. Klik op **"Verwijderen"** om te bevestigen

> **Waarschuwing:** Het verwijderen van een case verwijdert ook alle stappen en taken. Dit kan niet ongedaan worden gemaakt. Alleen de case-eigenaar, aanmaker of een sysadmin kan een case verwijderen.

`;

export const casesMeta = {
    slug: "cases",
    title: "Cases",
    description: "Cases aanmaken vanuit processen en de voortgang van stappen en taken volgen.",
    icon: "folder",
    tasks: [
        "Cases bekijken en filteren",
        "Nieuwe case aanmaken",
        "Case bewerken",
        "Stappen en taken beheren",
        "Bestanden beheren",
        "Case publiek delen",
        "Case verwijderen",
    ],
};
