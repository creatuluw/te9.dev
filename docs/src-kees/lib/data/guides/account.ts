export const accountGuide = `# Handleiding: Account

Op je account-pagina beheer je je wachtwoord, notificatievoorkeuren, abonnementen en MCP-servertokens.

---

## Je wachtwoord wijzigen

1. Ga naar **Account** via het profiel-icoon in de navigatiebalk
2. Je ziet standaard het tabblad **"Account"**
3. Vul het wachtwoord-formulier in:
   - **Huidig wachtwoord** — Je huidige wachtwoord (met tonen/verbergen toggle)
   - **Nieuw wachtwoord** — Minimaal 8 tekens (met tonen/verbergen toggle)
   - **Bevestig wachtwoord** — Herhaal het nieuwe wachtwoord
4. Klik op **"Wachtwoord wijzigen"**

> **Let op:** Als het huidige wachtwoord niet klopt, krijg je een foutmelding.

---

## Notificatievoorkeuren beheren

1. Op het tabblad **"Account"**, onder het wachtwoord-formulier
2. Je ziet een lijst met opties:
   - **In-app berichten** — Ontvang notificaties in de app
   - **E-mail notificaties** — Ontvang notificaties via e-mail
3. Vink de gewenste opties aan of uit
4. Klik op **"Voorkeuren opslaan"**

---

## Abonnementen beheren

Abonnementen houden je op de hoogte van wijzigingen bij processen, cases, werkitems en projecten.

1. Open het tabblad **"Abonnementen"**
2. Je ziet al je abonnementen, gegroepeerd per type:
   - **Processen** — Abonnementen op processen
   - **Cases** — Abonnementen op cases
   - **Werk** — Abonnementen op werkitems
   - **Projecten** — Abonnementen op projecten
3. Elk abonnement toont een gekleurde badge met het type

### Een abonnement opzeggen

1. Zoek het abonnement dat je wilt opzeggen
2. Klik op het **prullenbak-icoon**
3. Bevestig de opzegging
4. Je ontvangt geen updates meer voor dit item

### Naar het item navigeren

1. Klik op het **externe link-icoon** naast een abonnement
2. Je wordt doorgestuurd naar de pagina van het geabonneerde item

---

## MCP-servertokens beheren

Met MCP-servertokens kun je externe applicaties koppelen via de API.

1. Open het tabblad **"MCP Server"**
2. Je ziet een overzicht van al je API-tokens

### Een nieuw token aanmaken

1. Klik op het **"+" icoon**
2. Er wordt een nieuw token gegenereerd
3. **Kopieer het token direct** — Het wordt maar een keer getoond
4. Gebruik het kopieer-icoon om het token te kopiëren

### Een token vernieuwen

1. Klik op het **vernieuw-icoon** bij een token
2. Er wordt een nieuwe waarde gegenereerd
3. **Kopieer de nieuwe waarde** — Deze wordt ook maar een keer getoond

### Een token inzien

1. Klik op het **oog-icoon** bij een token
2. De tokenwaarde wordt tijdelijk weergegeven

### Een token intrekken

1. Klik op het **prullenbak-icoon** bij een token
2. Bevestig de intrekking
3. Het token wordt permanent verwijderd en kan niet meer gebruikt worden

### De MCP-server URL gebruiken

Op het tabblad zie je ook:
- **Server URL** — Het adres van de MCP-server (met kopieer-knop)
- **Configuratie snippet** — JSON-configuratie voor je MCP-client (met kopieer-knop)

`;

export const accountMeta = {
    slug: "account",
    title: "Account",
    description: "Je wachtwoord, notificaties, abonnementen en API-tokens beheren.",
    icon: "user",
    tasks: [
        "Wachtwoord wijzigen",
        "Notificatievoorkeuren instellen",
        "Abonnementen beheren",
        "MCP-servertokens beheren",
    ],
};
