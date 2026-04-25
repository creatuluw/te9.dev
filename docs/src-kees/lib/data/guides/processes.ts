export const processesGuide = `# Handleiding: Processen

Processen zijn sjablonen (templates) voor terugkerende werkstromen. Elk proces bestaat uit **stappen** en **taken** die automatisch worden gekopieerd wanneer je een nieuwe case aanmaakt vanuit een proces.

---

## Processen bekijken en filteren

Op de processen-pagina zie je een overzicht van alle processen als kaarten.

1. Ga naar **Processen** via de navigatiebalk
2. Je ziet een raster met proceskaarten (1, 2 of 3 kolommen afhankelijk van je scherm)
3. Elke kaart toont de naam, beschrijving, aantal dagen, stappen, taken en totale uren

### Zoeken en filteren

1. Klik op het **zoek-icoon** in de NavCard-header
2. Er opent een filtermenu bovenaan met:
   - **Zoekveld** — Zoek op naam en beschrijving
   - **Status** — Filter op Actief of Gearchiveerd
   - **Voltooiingsdagen** — Min/max bereik
   - **Aanmaakdatum** — Van/tot datumbereik
3. Klik op **"Tonen"** om de filters toe te passen
4. Klik op het **gum-icoon** om alle filters te wissen
5. Het aantal actieve filters wordt weergegeven als een badge op de zoekknop

---

## Een nieuw proces aanmaken

Er zijn twee manieren om een proces aan te maken.

### Via het + icoon (drawer)

1. Klik op het **"+" icoon** in de NavCard-header op de processen-pagina
2. Er opent een zijmenu aan de rechterkant met de titel "Nieuw Proces Aanmaken"
3. Vul de velden in:
   - **Sjabloonnaam** (verplicht) — Naam van het proces
   - **Beschrijving** — Uitleg van het proces
   - **Voltooiingsdagen** (verplicht) — Berekent automatische start- en einddatums
   - **Bijlagen** — Upload bestanden via drag-and-drop
4. Klik op **"Wijzigingen Opslaan"**
5. Je wordt automatisch doorgestuurd naar de detailpagina van het nieuwe proces

### Via de aparte aanmaakpagina

1. Navigeer naar \`/processes/new\`
2. Vul het formulier in:
   - **Procesnaam** (verplicht) — Bijv. "Verjaardag medewerker"
   - **Beschrijving** — Wat houdt dit proces in?
   - **Maximale duur in dagen** (verplicht, standaard 30)
3. Klik op **"Proces Aanmaken"**
4. Je wordt doorgestuurd naar de detailpagina

---

## Een proces bekijken en bewerken

1. Klik op een **proceskaart** in het overzicht om naar de detailpagina te gaan
2. Je ziet de detailpagina met zeven tabbladen:

| Tab | Functie |
|-----|---------|
| **Algemeen** | Naam, beschrijving en voltooiingsdagen bewerken |
| **Stappen** | Stappen en taken beheren (volledige CRUD + drag-and-drop) |
| **Bestanden** | Bijlagen beheren |
| **Berichten** | Berichten sturen en ontvangen |
| **Notities** | Notities toevoegen en bewerken |
| **Tijdslijn** | Binnenkort beschikbaar |
| **Help** | Uitleg over stappen, taken en afhankelijkheden |

### Algemene gegevens bewerken

1. Open het tabblad **"Algemeen"**
2. Pas de velden aan:
   - **Naam** — Wijzig de procesnaam
   - **Beschrijving** — Pas de beschrijving aan
   - **Voltooiingsdagen** — Wijzig de doorlooptijd
3. Klik op **"Wijzigingen Opslaan"**

> **Let op:** Als een taak de voltooiingsdagen overschrijdt, verschijnt er een waarschuwing.

---

## Stappen en taken beheren

Het tabblad **"Stappen"** is waar je de structuur van je proces opbouwt.

### Een stap toevoegen

1. Open het tabblad **"Stappen"** op de procesdetailpagina
2. Klik op **"Stap Toevoegen"** onderaan of tussen bestaande stappen
3. Vul in:
   - **Stapnaam** (verplicht)
   - **Beschrijving** (optioneel)
   - **Start na (dagen)** — Na hoeveel dagen deze stap begint (standaard 0)
   - **Voltooiing (dagen)** — Duur van de stap in dagen (standaard 7)
4. Klik op **"Stap Toevoegen"** om op te slaan

### Een stap bewerken

1. Klik op het **potlood-icoon** op een stapkaart
2. Pas de velden aan
3. Klik op **"Opslaan"**

### Een stap verwijderen

1. Klik op het **prullenbak-icoon** op een stapkaart
2. Er verschijnt een bevestigingsvenster: "Weet u zeker dat u deze stap wilt verwijderen?"
3. Klik op **"Verwijderen"** om te bevestigen

> **Waarschuwing:** Het verwijderen van een stap verwijdert ook alle taken binnen die stap, plus alle gekoppelde case-taken.

### Een taak toevoegen

1. Klik op **"+ Taak Toevoegen"** onderaan de takenlijst van een stap
2. Vul in:
   - **Taaknaam** (verplicht)
   - **Beschrijving** (optioneel)
   - **Rol** (optioneel) — Bijv. "Manager", "HR"
   - **Start offset (dagen)** — Relatief aan stapstart (standaard 0)
   - **Deadline (dagen)** — Absoluut vanaf stapstart (standaard 3)
   - **Uren** — Geschat aantal uren
   - **Criteria** — Wanneer is de taak af?
3. Klik op **"Taak Toevoegen"** om op te slaan

### Een afhankelijke taak toevoegen

1. Klik op **"+ Taak vanaf: [Taaknaam]"** onder een bestaande taak
2. De nieuwe taak start automatisch na de deadline van de bovenliggende taak
3. Vul dezelfde velden in als bij een normale taak
4. Afhankelijke taken worden visueel ingesprongen weergegeven met een pijl-indicator

### Taken herschikken met drag-and-drop

1. Sleep een taakkaart naar een nieuwe positie
2. Een oranje placeholder toont de nieuwe locatie
3. Laat los om de volgorde op te slaan
4. Je kunt taken ook **tussen stappen** slepen

> **Tip:** Na het slepen verschijnt een toast-melding als bevestiging.

---

## Een proces archiveren

1. Ga terug naar het procesoverzicht
2. Klik op het **archief-icoon** op de proceskaart
3. Er verschijnt een bevestigingsvenster
4. Klik op **"Archiveren"** om te bevestigen

> **Let op:** Gearchiveerde processen worden verborgen maar blijven beschikbaar voor bestaande cases. Je kunt ze terugzien door te filteren op status "Gearchiveerd".

---

## Een case aanmaken vanuit een proces

1. Ga naar het procesoverzicht
2. Klik op het **document-icoon** ("Case Aanmaken") op de proceskaart
3. Er opent de **CaseDrawer** aan de rechterkant
4. Vul de case-gegevens in (zie de [Cases handleiding](/guides/cases) voor details)
5. Na het aanmaken word je doorgestuurd naar de nieuwe case

`;

export const processesMeta = {
    slug: "processes",
    title: "Processen",
    description: "Sjablonen maken en beheren voor terugkerende werkstromen met stappen en taken.",
    icon: "workflow",
    tasks: [
        "Processen bekijken en filteren",
        "Nieuw proces aanmaken",
        "Proces bewerken",
        "Stappen en taken beheren",
        "Proces archiveren",
        "Case aanmaken vanuit proces",
    ],
};
