# GlobeTrotr roadmap

## In ontwikkeling

- [ ] **Eigen GlobeTrotr-mailserver:** Stalwart, mailboxprovisioning, statusdiagnose, gecontroleerd opnieuw proberen en automatische reisadressen zijn lokaal gebouwd en de SQL is uitgevoerd. Nog uitvoeren: Node-02-initialisatie, PTR/SPF/DKIM/DMARC, mailboxmigratie, reputatiecontrole, back-up/hersteltest en gecontroleerde MX-cutover.

**Stand: 23 september 2026**

GlobeTrotr draait als productie-beta. De publieke website staat op `globetrotr.nl`; registratie, login en privéomgevingen staan op `portal.globetrotr.nl`. De domeinscheiding uit commit `5df0590` is uitgerold. SQL-migraties/tests tot en met **1630** zijn volgens de laatste bevestiging uitgevoerd. De web-, worker-, mailserver- en productieacceptatie van update 1.1 staan nog open.

## Nu — publicatieacceptatie

- [x] Migraties en tests tot en met 1630 uitgevoerd; nieuwe web- en workerbuild nog uitrollen.
- [ ] Klantformulieren, Stalwart-provisioning, maildiagnose, boekingsmail, Agency-content, webpush, vluchtcontrole en offline dagoverzicht met echte rollen en mobiele schermen accepteren.
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

De exacte mailstatus en grens tussen ZXCS-productie en de nog uit te rollen Stalwart-server staat in [MAIL_STATUS.md](MAIL_STATUS.md).

## Daarna — productverbeteringen

- [ ] Agency-klantportaal verder laten aansluiten op de eigen huisstijl.
- [ ] Boekingsmails naar een controleerbaar reisconcept omzetten, zonder volledige persoonlijke mailbox te scannen. SQL is uitgevoerd; de productieacceptatie met uniek reisadres, afzenderfilter, deduplicatie, bewaartermijn en expliciete omzetting staat open.
- [ ] Veilige Agency-klantformulieren in productie accepteren; SQL, mail, review, audit, export en bewaarbeheer zijn gebouwd. Herbruikbare accommodaties, activiteiten, media en bestemmingsblokken volgen daarna.
- [ ] De Agency-contentbibliotheek in productie accepteren, inclusief preview, versievaste toepassing op offertes/reizen en bescherming tegen dubbel toevoegen; SQL 1590–1600 is uitgevoerd.
- [ ] Alleen bij duidelijke vraag een volledig dashboard op de Agency-host ontwerpen; hiervoor zijn aparte sessie-, passkey- en tenanttests nodig.
- [ ] Uitnodigingen en rolwissels voor grotere groepen vereenvoudigen.
- [ ] Peilingen, stemmen en definitieve groepsbesluiten bij reisvergelijkerkandidaten in productie accepteren; SQL is uitgevoerd en de praktijktest staat open.
- [ ] Bedrijfsmailgesprekken en gezamenlijk antwoorden verder verfijnen.
- [ ] Vertaalconcepten sneller laten beoordelen, met juridische tekst altijd handmatig gecontroleerd.
- [ ] Notificatiebereik en bezorgdiagnose verder uitbreiden.
- [ ] Performance en mobiele toegankelijkheid op echte apparaten blijven meten.

## Later — grotere functies

- Veilige offline basis is lokaal gebouwd: route, dagplanning, praktische boekingsinformatie en een begrensde uitgavenwachtrij na expliciet opslaan. Documentsynchronisatie en uitgebreidere conflictafhandeling volgen later.
- Volledige mailboximport voor boekingen, alleen na afzonderlijke toestemming.
- Automatische routeoptimalisatie met handmatige bevestiging.
- Plaatsaanbevelingen en openingstijden.
- Vluchtcontrole na de productieproef uitbreiden met meer providers en persoonlijke regels.
- GPX-import.
- Uitgebreide mailboxintegraties en Agency-automatiseringen.
- Optionele AI-reisplanning met expliciete controle.
- Reisdagboek met foto's en bewuste zichtbaarheid.
- Daarna één goedgekeurde accommodatieprovider koppelen voor live zoeken, transparant vergelijken en doorsturen; pas na bewezen gebruik meerdere aanbieders toevoegen.
- Activiteiten rond een stop zoeken op datum, afstand, openingstijd en prijs, met bronvermelding en handmatige bevestiging.

## Gebouwd fundament

Reisplanning, boekingen, kaart, uitgaven, verrekening, taken, documenten, dagoverzicht, statistieken, budgettempo, GPX/PDF/JSON/CSV/ICS-export, live agenda, openbare reizen, Agency Admin, klantportaal, Corporate Admin, privacyverzoeken, Paddle, bedrijfsmail en NL/EN-communicatie zijn aanwezig. Provider-onafhankelijke reisopties, groepsbesluiten, webpush, vluchtcontrole en offline gebruik zijn gebouwd; de SQL is uitgevoerd en productieacceptatie staat open. De primaire Supabase-opslag staat bevestigd in Central EU (Frankfurt, `eu-central-1`).

Nieuwe onderdelen worden pas als afgerond aangemerkt nadat codecontrole, SQL-test én een praktijktest op productie zijn geslaagd.
