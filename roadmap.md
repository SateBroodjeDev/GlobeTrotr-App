# GlobeTrotr roadmap

**Stand: 22 september 2026**

GlobeTrotr draait als productie-beta. De publieke website staat op `globetrotr.nl`; registratie, login en privéomgevingen staan op `portal.globetrotr.nl`. De domeinscheiding uit commit `5df0590` is uitgerold. SQL-migraties en tests tot en met **1470** zijn uitgevoerd. De navigatiecorrectie en checklistmigratie **1480** staan klaar voor de eerstvolgende kleine uitrol.

## Nu — publicatieacceptatie

- [ ] Migratie en test 1480 uitvoeren en de nieuwe web/Caddy-build uitrollen.
- [ ] Migratie en test 1490 uitvoeren en reisopties vergelijken met echte rollen, valuta en mobiele schermen accepteren.
- [ ] Vanaf portal op desktop en telefoon logo, Website/Home en alle publieke footerlinks testen; deze moeten direct naar `globetrotr.nl` gaan.
- [ ] Op 320, 375 en 430 px controleren dat lange merknamen, horizontale navigatie, meldingen, modals, homepage-CTA's, About en dashboardfilters zichtbaar en bedienbaar blijven.
- [ ] Registratie, e-mailbevestiging, herstel, magic link, Google, Discord, bestaande en nieuwe passkey en TOTP op portal controleren.
- [ ] Free → Pro en Free → Agency testen voor maandabonnement en losse maand, inclusief webhook, factuur, recht en einddatum.
- [ ] Live agenda met GET/HEAD en een echte agenda-app controleren.
- [ ] Bedrijfsmail controleren met lange HTML-mail, bijlagen, inline afbeeldingen, geblokkeerde externe afbeeldingen en opnieuw bezorgen.
- [ ] Een Agency-subdomein en eigen CNAME testen: geldig certificaat, gecontroleerde redirect, correct account, afwijzing van een andere Agency en 404 op overige hostpaden.
- [ ] Corporate Admin-checklist afronden en alle resterende hoge beveiligingsbevindingen sluiten.

De korte vrijgavebeslissing staat in [PRE_RELEASE.md](PRE_RELEASE.md); de actuele uitvoerstappen staan in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md).

Een onderbouwde scheiding tussen gebouwd, gedeeltelijk gebouwd en ontbrekend werk, plus nieuwe concurrentiekansen, staat in [FEATURE_GAP_AND_EXPANSION.md](FEATURE_GAP_AND_EXPANSION.md). De gekozen releasevolgorde en definities van klaar staan in [BUILD_PLAN.md](BUILD_PLAN.md).

## Daarna — productverbeteringen

- [ ] Agency-klantportaal verder laten aansluiten op de eigen huisstijl.
- [ ] Boekingsmails naar een controleerbaar reisconcept omzetten, zonder volledige persoonlijke mailbox te scannen.
- [ ] Veilige klantformulieren bouwen en de bestaande Agency-sjablonen uitbreiden met herbruikbare accommodaties, activiteiten, media en bestemmingsblokken.
- [ ] Alleen bij duidelijke vraag een volledig dashboard op de Agency-host ontwerpen; hiervoor zijn aparte sessie-, passkey- en tenanttests nodig.
- [ ] Uitnodigingen en rolwissels voor grotere groepen vereenvoudigen.
- [ ] Bedrijfsmailgesprekken en gezamenlijk antwoorden verder verfijnen.
- [ ] Vertaalconcepten sneller laten beoordelen, met juridische tekst altijd handmatig gecontroleerd.
- [ ] Notificatiebereik en bezorgdiagnose verder uitbreiden.
- [ ] Performance en mobiele toegankelijkheid op echte apparaten blijven meten.

## Later — grotere functies

- Echte offline modus.
- Volledige mailboximport voor boekingen, alleen na afzonderlijke toestemming.
- Automatische routeoptimalisatie met handmatige bevestiging.
- Plaatsaanbevelingen en openingstijden.
- Periodieke vluchtcontrole.
- GPX-import.
- Uitgebreide mailboxintegraties en Agency-automatiseringen.
- Optionele AI-reisplanning met expliciete controle.
- Reisdagboek met foto's en bewuste zichtbaarheid.
- Daarna één goedgekeurde accommodatieprovider koppelen voor live zoeken, transparant vergelijken en doorsturen; pas na bewezen gebruik meerdere aanbieders toevoegen.
- Activiteiten rond een stop zoeken op datum, afstand, openingstijd en prijs, met bronvermelding en handmatige bevestiging.

## Gebouwd fundament

Reisplanning, boekingen, kaart, uitgaven, verrekening, taken, documenten, dagoverzicht, statistieken, budgettempo, GPX/PDF/JSON/CSV/ICS-export, live agenda, openbare reizen, Agency Admin, klantportaal, Corporate Admin, privacyverzoeken, Paddle, bedrijfsmail en NL/EN-communicatie zijn aanwezig. Provider-onafhankelijke reisopties en vergelijking zijn lokaal gebouwd en wachten op migratie/test 1490 en productieacceptatie. De primaire Supabase-opslag staat bevestigd in Central EU (Frankfurt, `eu-central-1`).

Nieuwe onderdelen worden pas als afgerond aangemerkt nadat codecontrole, SQL-test én een praktijktest op productie zijn geslaagd.
