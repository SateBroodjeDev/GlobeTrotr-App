# Publieke opening: vrijgavecontrole

**Stand: 22 september 2026.** Dit is de korte beslislijst voor de grote publicatie. De beta is al in gebruik; een geslaagde lokale build is nog geen productieacceptatie. [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md) bevat de uitvoercommando's en migratievolgorde. Zet een controle pas op afgerond na een proef op het echte domein.

**Portalverhuizing voorbereid:** website op `globetrotr.nl`, accountomgeving op `portal.globetrotr.nl`. Volg de precieze volgorde in [PORTAL_DOMAIN_MIGRATION.md](PORTAL_DOMAIN_MIGRATION.md). Agency-hosts worden gecontroleerd en verwijzen naar het centrale dashboard; test de tenantcontrole met twee verschillende Agency-accounts.

## Wat nu al in de code zit

| Onderdeel | Beoordeling voor publicatie |
| --- | --- |
| Homepage | Route, boekingen, groepskosten, doelgroep, privacy en publieke reizen zijn zichtbaar. Het dashboard in de hero is nu als **voorbeeld** gelabeld. Controleer echte testimonials en openbare reizen voor publicatie. |
| Demo | Klikbare route, boekingen, planning, paklijst en verrekening met fictieve data; de startknop gaat voor gasten naar registratie. Test op telefoon met toetsenbord en touch. |
| Prijzen en betaalvoorwaarden | Free, Pro en Agency, terugkerende en losse maanden, Paddle als verkoper en terugbetaling staan beschreven. Controleer weergegeven prijs, belasting, looptijd en juiste accountrechten tegen een echte checkout. |
| Privacy en browseropslag | NL/EN-verklaring benoemt EU-opslag, externe leveranciers, optionele sociale login, Paddle, mail, kaart, externe afbeeldingen, rechten en bewaartermijnen. Controleer de feitelijke productieregio, leveranciersovereenkomsten, toestemming en bewaartermijnen vóór vrijgave. |
| About, contact en status | Pagina's en links zijn aanwezig. Controleer eigenaarstekst, adres, contactontvangst, statusfeed en taal op echte domeinen. |
| Publieke roadmap en updates | Roadmap beschrijft toekomstig werk; updates tonen alleen eerder uitgerolde wijzigingen. Nieuwe code uit deze ronde verschijnt pas na productiebevestiging in de publieke changelog. |
| Agency DNS | De verificatie controleert TXT en CNAME of hetzelfde IPv4-doel. De TLS-toelating accepteert alleen geregistreerde Agency-subdomeinen of geverifieerde eigen domeinen met een actief Agency-plan. **Hostnaam-naar-workspacebinding en branding op iedere route zijn nog niet end-to-end bewezen.** |

## Vrijgavevoorwaarden

1. **Uitrol en data:** controleer welke migraties 1390–1440 al zijn uitgevoerd; voer alleen ontbrekende in volgorde uit. Voer daarna `20260908145000_public_launch_and_agency_dns_acceptance.sql` en de bijbehorende SQL-test uit. Bouw Node-02 `worker` opnieuw voor de TLS-controle en Node-01 `web` voor de publieke tekst en DNS-controle. Gebruik hiervoor de bestaande commando's in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md); herhaal toegepaste migraties niet.
2. **Publieke pagina's:** doorloop `/`, `/demo`, `/register`, `/prijzen`, `/about`, `/contact`, `/status`, `/privacy`, de voorwaarden, `/roadmap`, `/updates` en een openbare reis in NL en EN op een smalle telefoon en desktop. Controleer alle primaire knoppen, geen horizontale overflow, leesbare tekst en juiste meta/social-preview.
3. **Kernstroom:** registreer een nieuw account, bevestig e-mail, log in met e-mail en Google/Discord, maak een reis en boeking, nodig iemand uit, deel de reis, voeg een uitgave toe, download GPX/ICS/PDF en test een live ICS-link. Controleer geen dubbele mail en juiste taal.
4. **Betaling:** test Free → Pro, Free → Agency, terugkerend en eenmalig, kortingsbetaling, opzegging en een mislukte webhook. Controleer Paddle-transactie, één factuur volgens Paddle, lokaal recht, correcte einddatum en Corporate Admin-diagnose.
5. **Agency-domein:** test een echt `naam.globetrotr.nl` en een eigen domein. DNS en HTTPS moeten kloppen; de hoofdroute moet na een servercontrole naar de juiste Agency-workspace op het centrale portal sturen. Andere paden op de Agency-host geven 404. Een account van Agency B mag via de ingang van Agency A nooit diens dashboard zien. **Zonder deze praktijkproef geen publieke belofte over eigen Agency-domeinen.**
6. **Beveiliging en privacy:** voer `npm run verify`, `npm run build`, de productie-smokecheck en de Corporate Admin-checklist uit. Controleer echte Supabase-regio, Storage-rechten, toegangsrollen, het wissen/exporteren van data, consent, externe afbeeldingen en status-/incidentcommunicatie. Sluit hoge beveiligingsbevindingen vóór vrijgave.

## DNS en certificaten: concrete proef

Zet bij de DNS-provider van `globetrotr.nl` een expliciet `portal`-record en een wildcard **A**-record `*` naar het publieke IPv4-adres van Node-01. Laat bestaande expliciete `mail`, `smtp`, `www` en `dashboard`-records ongemoeid. De Node-01-firewall moet TCP 80/443 toestaan; Node-02 blijft alleen via het privénetwerk bereikbaar. Gebruik voor een eigen Agency-subdomein bijvoorbeeld `reizen.bedrijf.nl CNAME portal.globetrotr.nl` plus `TXT _globetrotr.reizen.bedrijf.nl = globetrotr-verification=<token>` uit Agency-instellingen. Bij een DNS-provider die geen CNAME op het hoofddomein toestaat, kan een ALIAS/ANAME of een A-record naar hetzelfde IPv4-adres werken; de TXT-verificatie blijft vereist. Een geproxied CNAME kan de controle verbergen; test eerst met directe DNS.

Na de code-uitrol op Node-02 en Node-01, vanaf een **ander netwerk**:

```bash
# Node-02, vanuit /opt/globetrotr na git pull --ff-only
docker compose --env-file .env.production -f deploy/worker.compose.yml --profile translation up -d --build --force-recreate worker

# Node-01, vanuit /opt/globetrotr na git pull --ff-only
docker compose --env-file .env.production -f deploy/web.compose.yml up -d --build --force-recreate web
```

Controleer eerst dat beide nodes dezelfde commit hebben. Sla de Node-02-stap niet over: zonder de nieuwe worker blijft de `tls/ask`-controle voor Agency-subdomeinen verouderd. Test daarna vanaf een **ander netwerk**:

```bash
dig +short testnaam.globetrotr.nl A
dig +short reizen.bedrijf.nl CNAME
dig +short _globetrotr.reizen.bedrijf.nl TXT
curl -I https://testnaam.globetrotr.nl/
curl -I https://reizen.bedrijf.nl/
```

Gebruik voor `testnaam` een subdomein dat in een actieve Agency-workspace is opgeslagen. Verwacht een geldig certificaat, geen TLS-fout en de juiste site. Controleer daarnaast in de Caddy-log of certificaatuitgifte slaagt en op Node-02 of `/tls/ask` de juiste host toeliet. Een DNS-record alleen is **geen** bewijs dat het Agency-dashboard aan de juiste workspace is gekoppeld. De domeinprovider kan niet door GlobeTrotr worden aangepast zonder afzonderlijke toegang; de eigenaar moet de getoonde records zelf publiceren.

## Besluit

Publiceer breed als alle zes voorwaarden met echte accounts en domeinen zijn afgevinkt en open incidenten opnieuw zijn beoordeeld. De huidige codecontrole kan DNS-propagatie, mailboxbezorging, Supabase-productieconfiguratie, Paddle-webhooks of alle schermgroottes niet bewijzen. Houd die punten tot hun praktijktest open in Corporate Admin.
