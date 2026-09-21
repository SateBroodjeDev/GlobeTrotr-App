# GlobeTrotr beta-testlijst

## Herstelronde na migraties 1310–1320

- [ ] Na migratie 1330 de SQL-test `paddle_discounted_totals.sql` uitvoeren: een volledige 100%-korting moet als voltooide €0-transactie en Agency-recht worden verwerkt; alle testdata wordt teruggedraaid. Migratie 1340 zorgt daarna dat hiervoor geen schijnfactuur verschijnt.
- [ ] De bestaande Paddle-transactie opnieuw herstellen, het Agency-recht en de einddatum controleren en bij een volgende webhookbezorging HTTP 200 in Paddle bevestigen.
- [ ] Na migratie 1340 een abonnementswijziging testen: GlobeTrotr mag pas een lokale factuur tonen als Paddle een voltooide, positief geprijsde transactie met eigen factuurnummer heeft; een €0-verrekening blijft alleen als transactie zichtbaar.
- [ ] Zes losse eenmalige maandbetalingen voor hetzelfde plan testen: zes afzonderlijke transacties en zes achtereenvolgende maanden toegang; dubbele webhookverwerking geeft geen zevende maand.
- [ ] Op `/billing` het aantal nog geldige losse maandbetalingen en de einddatum controleren; een actief vooruitbetaald plan mag niet als 'geen betaald abonnement' worden gepresenteerd.

- [ ] Nieuwe Google- en Discord-accounts krijgen eenmalig het profielscherm; naam, telefoon en foto worden opgeslagen, provider koppelen aan bestaand account blijft werken.
- [ ] Registratie toont Turnstile meteen of een zichtbare herstelactie; een trage aanvraag blijft niet eindeloos op “Bezig”. Controleer na een timeout eerst inbox en Auth Users.
- [ ] Bestaand Google-e-mailadres in registratie geeft veilige uitleg zonder accountbestaan te onthullen.
- [ ] Bedrijfsmail met lange HTML, onderwerp en adressen blijft op telefoon en desktop binnen de pagina.
- [ ] `/updates` en de footerlink tonen de publieke changelog in NL en EN.
- [ ] Nieuwe live ICS-feed geeft GET én HEAD status 200 met `text/calendar`, en GET bevat `BEGIN:VCALENDAR`. Oude 404-link opnieuw maken nadat Paddle-toegang is hersteld.
- [ ] Paddle-transactie met 100%-korting wordt via een geverifieerde webhook aan het juiste account gekoppeld; tot die tijd incident openhouden.
- [ ] Ontbrekende eenmalige transactie in Corporate Admin met Paddle API herstellen; verkeerde prijs, ongeldige accountkoppeling en refund/credit worden geweigerd, en de auditregel verschijnt.
- [ ] Test ook een onbereikbare live ICS-route: de app mag geen nieuwe link uitgeven of een bestaande link intrekken.
- [ ] Controleer dat een verwerkte €0-transactie `completed` blijft, eenmalige toegang niet direct verloopt en een expliciet goedgekeurde refund die toegang wel beëindigt.


> Releasecontrole 21 september 2026: migraties en SQL-tests 1180–1300 en de vorige release zijn volgens de eigenaar uitgerold. Migraties 1310–1320 en de nieuwe herstelronde staan nog open. Zie [de actuele releasehandleiding](IMPLEMENTATION_PENDING.md). Deze lijst vult de Corporate Admin-releasecheck aan; markeer controles daar pas na een echte proef.

## Releases 1180–1300 — actieve beta, bedrijfsmail, betalingen en privacy

- [ ] Betaal Agency voor één maand met een 100%-korting: Paddle mag €0 tonen, maar `transaction.completed` moet door de webhook worden verwerkt en het juiste Agency-recht met vervaldatum opleveren. Controleer in Corporate Admin met het exacte transactie-ID; een ontbrekende transactie blijft een open incident.

- [ ] Ontvang een uitnodiging zonder profieltaal in het Engels en met expliciet Nederlandse profieltaal in het Nederlands.
- [ ] Bekijk een publieke gedeelde reis met meerdaags programma en boekingen: één leesbaar schema, geen privéboekingsgegevens.
- [ ] Open een uitgave en boeking op een smalle telefoon met een lange betalersnaam: geen overlap.
- [ ] Ontvang één reisuitnodiging met juiste huisstijl en werkende link; controleer de in-appmelding.
- [ ] Bouw de productie-images op Node-01 en Node-02 en controleer alle container-healthchecks en logs.
- [x] `npx tsc --noEmit` slaagt met actuele Supabase-schematypen.
- [ ] Voer na uitrol `npm run smoke` uit en controleer homepage, registratie, login, status, contact, roadmap, updates en beide publieke logo's.
- [ ] Verstuur Contact met een geldig Turnstile-token en controleer dat een verlopen token of token met een andere actie wordt geweigerd zonder een bericht op te slaan.
- [ ] Open `/auth?redirect=/dashboard` en controleer de interne terugkeer; probeer daarna `//example.com`, `/\\example.com` en `/%5cexample.com` en controleer dat GlobeTrotr deze negeert.
- [x] `npm run security` vindt geen onbeoordeelde service-role-serverfunctie, browsergeheim, nieuwe ruwe HTML-sink, onveilige externe link, gevoelige logging of nieuwe `SECURITY DEFINER`-functie zonder vastgezet zoekpad.
- [x] `npm audit --omit=dev --audit-level=high` meldt op 21 september 2026 geen bekende kwetsbaarheden in productie-afhankelijkheden; herhaal deze tijdsgebonden controle vlak vóór vrijgave.
- [x] `npm run verify` controleert automatisch dat iedere open migratie in de implementatiehandleiding een bestaande SQL-test heeft en dat actuele bronbestanden geen bekende kapotte UTF-8-patronen bevatten.
- [ ] Controleer NL/EN HTML-opmaak voor planwijziging en kritieke storing.
- [ ] Maak een bedrijfsbeheerder aan, wijzig rol/rechten/mailbox en controleer opslaan plus opnieuw inloggen.
- [ ] Koppel een Agency-klant en open het dashboard met diens eigen account.
- [ ] Download GPX met routepunten, importeer activiteiten uit ICS en open/ververs een live agendalink.
- [ ] Betaal eenmalig en maandelijks via Paddle; controleer entitlement na een herhaalde webhook.
- [ ] Verstuur bedrijfsmail en controleer HTML plus platte-tekstalternatief; lees een inkomend HTML-bericht.
- [ ] Beantwoord een extern bericht en controleer dat ontvangen en verzonden antwoorden chronologisch als één gesprek verschijnen.
- [ ] Verzend en ontvang een PDF en afbeelding; controleer downloaden, de limieten van 5 bestanden/10 MB per bestand/20 MB totaal en weigering zonder postvakrecht.
- [ ] Breek een bijlage-upload af, laat de reservering testmatig verlopen en controleer dat worker-event `corporate_mail.uploads_cleaned` verschijnt en het object weg is.
- [ ] Verstuur een schoon testbestand; controleer daarna dat EICAR en een gestopte ClamAV-container allebei blokkeren zonder bestandsinhoud in logs.

## Release 1170 — betaalvormen, agenda en reparaties

- [ ] Registreer een volledig nieuw e-mailadres, rond Turnstile af en controleer Supabase plus bevestigingsmail.
- [ ] Koop Pro één maand met iDEAL en controleer dat geen automatische verlenging ontstaat.
- [ ] Start een maandelijks Pro-abonnement met kaart of PayPal en controleer Customer Portal.
- [ ] Controleer automatische afloop van een eenmalig recht zonder een actief abonnement te raken.
- [ ] Koppel Discord vanuit Account en controleer dat Discord na terugkeer als gekoppeld staat.
- [ ] Download een geldige GPX en controleer ook de fout bij een reis zonder coördinaten.
- [ ] Download ICS, maak een live agendalink, abonneer, wijzig de reis en controleer verversing.
- [ ] Trek de agendalink in en controleer dat de oude URL niet meer opent.
- [ ] Voeg vanuit Corporate Admin een postvak met IMAP-gegevens toe en controleer synchronisatie.

## Laatste productie-update (na migraties 1130-1160)

- [x] Voer migratie `20260908116000_paddle_billing_runtime.sql` en daarna `paddle_billing_runtime.sql` uit.
- [ ] Open in Sandbox vanuit Free de Pro- en Agency-checkout; controleer product, maandprijs, belasting en accountadres.
- [ ] Annuleer een checkout en controleer dat het Free-plan behouden blijft.
- [ ] Rond een Sandbox-checkout af; controleer webhook HTTP 200, één transactie en het juiste Pro- of Agency-plan na vernieuwen.
- [ ] Stuur hetzelfde Paddle-event opnieuw en controleer dat geen dubbele transactie of melding ontstaat.
- [ ] Stuur een webhook met ongeldige handtekening en controleer HTTP 401 zonder databasewijziging.
- [ ] Open Paddle Customer Portal vanuit Facturatie; controleer betaalmethode, facturen, verlengdatum en opzegging.
- [ ] Open op Facturatie de laatste betalingen en download per voltooide betaling een verse officiële Paddle-factuur.
- [ ] Wijzig Pro naar Agency en terug; controleer de verrekening in Paddle en wacht op de webhook voordat de rechten wijzigen.
- [ ] Test `past_due`, herstel, geplande opzegging en definitieve beëindiging; alleen een actieve/trialstatus mag betaalde rechten geven.
- [ ] Controleer Corporate Admin op werkelijke omzet, abonnement, transactie en webhookstatus.
- [ ] Vraag vanuit Corporate Admin een volledige refund aan; controleer auditreden, adjustmentstatus, bijgewerkte transactie/factuur en Paddle-creditnota.
- [ ] Forceer in Sandbox een gefaald event en verwerk het met reden opnieuw; na succes mag het niet opnieuw uitvoerbaar zijn.
- [ ] Controleer betaling, mislukte betaling, abonnementswijziging, einde en refund als in-appmelding én verzorgde NL/EN HTML-mail met knop naar Facturatie.

- [ ] Open `/register` rechtstreeks en maak een account aan; controleer bevestigingslink en juiste terugkeer naar GlobeTrotr.
- [ ] Vraag op `/auth` een herstelmail en magic link aan in NL en EN; controleer opmaak, taal, tokenroute en eenmalig gebruik.
- [ ] Log in met Google, Discord en een passkey; stel daarna TOTP in en controleer een nieuwe wachtwoordlogin met juiste en onjuiste code.
- [ ] Open Status als gast en ingelogde gebruiker in NL en EN; alle componentnamen en statuslabels horen in dezelfde taal te staan.
- [ ] Maak een reis- en Agency-uitnodiging; controleer werkende link, bezorgstatus en Agency-naam/accentkleur.
- [ ] Dien vanuit Account een privacyverzoek in; open, wijzig en beantwoord het in Governance, open de gebruiker en controleer het antwoord in Account.
- [ ] Beantwoord een contactbericht via Bedrijfsmail en controleer afzender, ontvanger, onderwerp, standaardhandtekening en bezorgstatus.
- [ ] Maak een gedeelde en persoonlijke mailbox zonder handtekening; controleer de gegenereerde GlobeTrotr-handtekening en pas hem als beheerder aan.
- [ ] Nodig vanuit Corporate Admin een nieuwe medewerker uit, wijs een persoonlijke mailbox toe en geef toegang tot een gedeelde mailbox.
- [ ] Open de medewerkeruitnodiging uit de Supabase-template `invite.html`; controleer de eigen `/token/...?...type=invite`-route en de eerste login.
- [ ] Laat een bestaand extern adres mail sturen naar een GlobeTrotr-postvak; controleer IMAP-inleesstatus, volledige inhoud en beantwoorden vanuit het portaal.
- [ ] Verstuur vanuit een persoonlijke en gedeelde mailbox een bericht; controleer logo, afzendernaam, tagline, website, contactlink, CTA en de mailboxhandtekening in mobiel, desktop en donkere mailweergave.
- [ ] Beantwoord een privacyverzoek en stuur nieuwe bedrijfsmail en een contactformulier; controleer dat elk direct één melding rechtsboven geeft.
- [ ] Maak één reisuitnodiging en controleer dat exact één verzorgde e-mail met reisnaam, uitleg en actieknop aankomt.
- [ ] Koppel Google en Discord handmatig vanuit Account en controleer de veilige terugkeer.
- [ ] Laat Corporate Admin na identiteitscontrole een TOTP-factor herstellen en controleer auditlog en accountmelding.
- [ ] Download CSV, reisgids, ICS en GPX vanuit de exportbalk bovenaan en open ieder bestand.
- [ ] Voeg in Corporate Admin een ZXCS-postvak met IMAP-server, gebruikersnaam en wachtwoord toe; controleer dat het wachtwoord nooit terug in de browser verschijnt en dat nieuwe mail wordt ingelezen.
- [ ] Verstuur vanuit dat postvak een bericht en controleer HTML-opmaak, logo, CTA en de ingestelde persoonlijke of gedeelde handtekening.
- [ ] Koppel een testdomein met de getoonde CNAME en TXT, verifieer het in Agency Admin en controleer HTTPS; een onbekend domein moet worden geweigerd.
- [ ] Download GPX en reisgids, open beide bestanden en controleer routevolgorde, tekst, omslag en taal.
- [ ] Verstuur een betaalverzoek in een reis met echt gekoppelde accounts; controleer melding bij de ontvanger en duidelijke uitleg wanneer alleen naamdeelnemers bestaan.
- [ ] Controleer de routekaart op telefoon en desktop; de kaart mag niet buiten zijn kaartvak lopen.
- [ ] Controleer beide serverklokken en voer een geldige en ongeldige SMTP-test uit; leg bij 550 de volledige serverrespons vast.

> Alle databasemigraties en SQL-regressietests tot en met migratie 1170 zijn uitgevoerd. Alleen migraties 1180 tot en met 1300 en hun SQL-tests horen nog bij de volgende uitrol. De praktische product- en acceptatiecontroles blijven open totdat ze handmatig zijn getest.

## Nieuwe praktische acceptatiecontroles

- [x] Voer `20260908108000_production_privacy_acceptance.sql` en daarna `production_privacy_acceptance.sql` uit.
- [ ] Controleer `/privacy` in Nederlands en Engels op de actuele rollen van Hetzner, Supabase, ZXCS, Cloudflare Turnstile, Google en Discord.
- [ ] Controleer na migratie 1240 ook de bedrijfsmailvelden, versleutelde IMAP-wachtwoorden, private bijlagen, ClamAV, LibreTranslate en de feitelijke bewaartermijnen in beide talen; vinken in Corporate Admin pas af na uitrol en controle.
- [ ] Schakel ClamAV kort uit tijdens een inkomend testbericht met bijlage; bevestig dat IMAP later het volledige bericht opnieuw verwerkt. Een besmette bijlage moet geblokkeerd worden en als zodanig herkenbaar zijn in de berichtpreview.
- [ ] Test na migratie 1250 twee postvakken: laat één IMAP-authenticatie mislukken, controleer dat alleen dat postvak een foutcode toont, vraag opnieuw synchroniseren aan en bevestig herstel in de volgende worker-ronde. Herhaald klikken mag geen tweede verzoek maken.
- [ ] Zoek na migratie 1260 in Corporate Admin een geslaagde eenmalige én een terugkerende Paddle-transactie op ID. Controleer klant, account, workspace, plan, entitlement/abonnement en eventstatus. Een vreemde workspacekoppeling mag geen herverwerking aanbieden; een toegestaan mislukt event mag na reden wel worden herverwerkt.
- [ ] Controleer dat de cookie- en opslaginventaris de Supabase-sessie, lokale reiscache, privacykeuze, thema, taal, `sidebar_state` en Turnstile-beveiliging correct vermeldt.
- [ ] Open Privacykeuzes als gast en ingelogde gebruiker; weiger en accepteer de taalvoorkeur en controleer dat noodzakelijke sessie- en beveiligingsopslag beschikbaar blijft.
- [x] Voer `20260908105000_identity_and_mail_delivery_management.sql` en daarna `identity_and_mail_delivery_management.sql` uit.
- [x] Voer `20260908106000_mail_delivery_mode_acceptance.sql` en daarna `mail_delivery_mode_acceptance.sql` uit.
- [x] Voer `20260908107000_worker_claim_recovery.sql` en daarna `worker_claim_recovery.sql` uit.
- [ ] Controleer op Node-02 herstel van een claim ouder dan tien minuten, begrenzing na tien pogingen en een herkenbare maar privacyveilige SMTP-foutcode.
- [ ] Pauzeer en hervat servicemail vanuit Corporate Admin met een reden; controleer auditlog en het gecontroleerd vrijgeven van vastgehouden mail.
- [ ] Koppel in Account Google en Discord en controleer dat de laatste inlogmethode nooit kan worden verwijderd.
- [ ] Open Corporate Admin → Bedrijfsmail; controleer status, pogingen en foutcode en bied één mislukt testbericht opnieuw aan.
- [ ] Maak en verleng een reis- en Agency-uitnodiging; controleer de actuele bezorgstatus bij de uitnodiging en in het centrale overzicht.
- [ ] Registreer via iedere OAuth-provider en controleer één netjes gevuld profiel en één workspace.
- [x] Voer `20260908100000_account_communication_preferences.sql` en daarna `account_communication_preferences.sql` uit.
- [x] Voer `20260908101000_direct_invitation_email.sql` en daarna `direct_invitation_email.sql` uit.
- [x] Voer `20260908102000_email_template_acceptance.sql` en daarna `email_template_acceptance.sql` uit.
- [x] Voer `20260908103000_social_login_acceptance.sql` en daarna `social_login_acceptance.sql` uit.
- [x] Voer `20260908104000_passwordless_auth_acceptance.sql` en daarna `passwordless_auth_acceptance.sql` uit.
- [ ] Registreer via `/register`; controleer aflevering, de eigen `/token/...`-bevestigingsroute en daarna inloggen.
- [ ] Vraag op `/auth` wachtwoordherstel aan, open de mail en stel vanuit Account daadwerkelijk een nieuw wachtwoord in.
- [ ] Vraag op `/auth` een magic link aan; controleer eenmalig gebruik, verlopen link en veilige terugkeer naar een uitnodiging.
- [x] Google en Discord zijn geactiveerd en werkend bevestigd.
- [ ] Start OAuth vanaf een reis- en Agency-uitnodiging en controleer dat de veilige `redirect` na terugkeer behouden blijft.
- [ ] Controleer in Supabase dat een bestaand e-mailadres geen dubbel profiel of lege workspace veroorzaakt.
- [ ] Voeg in Account een passkey toe, log uit, log met die passkey in en verwijder hem daarna weer.
- [ ] Schakel uitnodigingsmail uit en controleer dat geen mail wordt klaargezet; account- en beveiligingsmail blijft actief.
- [ ] Controleer `/assets/brand/logo.png` in de header en `/assets/email/logo.png` zonder sessie.
- [ ] Open alle paden uit `public/assets/brand/README.md` zonder sessie en controleer transparantie, lichte en donkere variant.
- [ ] Nodig een nieuw en bestaand account uit voor een reis en Agency; controleer ontvangst, taal, acceptatielink en opnieuw verzenden na verlengen.
- [ ] Plak de vijf bestanden uit `supabase/templates` in Supabase Auth, gebruik de conditionele onderwerpen uit `subjects.md` en test registratie, herstel, e-mailwijziging, magic link en uitnodiging afzonderlijk met een Nederlands en Engels profiel.
- [ ] Controleer Auth-, uitnodigings- en servicemail in een telefoonclient, desktopclient en donkere weergave op logo, leesbaarheid, knop en contactlink.
- [ ] Zet uitnodigingsmail uit bij een bestaand account en controleer dat de uitnodiging bruikbaar blijft zonder mail in de outbox.
- [ ] Bouw en start de app zonder Lovable-package, preview-authbroker of Lovable-runtimevariabelen.
- [ ] Open een openbare reis met tien stops en meerdere boekingen op desktop en telefoon.

- [ ] Start Node-01 met `deploy/web.compose.yml`; controleer containerhealth, HTTPS, HTTP-redirect en het TLS-certificaat.
- [ ] Controleer dat de Node-01-webcontainer na minimaal twee minuten nog draait en niet met exitcode 0 blijft herstarten.
- [ ] Controleer dat `globetrotr.nl` website en app bedient en dat `www.globetrotr.nl` en `dashboard.globetrotr.nl` met behoud van het pad doorsturen.
- [ ] Start Node-02 met `deploy/worker.compose.yml`; controleer een succesvolle pollcyclus en `http://127.0.0.1:9091/health` zonder poort 9091 publiek open te stellen.
- [ ] Controleer op Node-02 dat de mailrelay SMTP kan verifiëren, poort 9092 niet publiek bereikbaar is, een verkeerd token wordt geweigerd en een testbericht exact eenmaal aankomt.
- [ ] Controleer dat uitsluitend Node-01 poorten 80/443 aanbiedt, SSH op beide nodes met sleutels werkt en `.env.production` rechten `600` heeft.
- [ ] Voer één nieuwe release uit en herstel daarna proefmatig de vorige commit volgens `VPS_DEPLOYMENT.md`.
- [ ] Controleer dat onbekende Host-headers en niet-geverifieerde Agency-domeinen nooit Agency-branding of tenantdata tonen.
- [ ] Koppel een testdomein via CNAME en TXT-verificatie; controleer TLS, juiste Agency-branding, onbekende hosts en automatische intrekking na blokkade of abonnementswijziging.
- [ ] Maak een nieuw Supabase-productieproject in een EU-regio en controleer dat lokale en VPS-productieconfiguratie naar de juiste projectreferentie wijzen.
- [ ] Controleer vóór registratie dat `auth.users`, `public.profiles` en `public.workspaces` leeg zijn; registreer via GlobeTrotr en controleer daarna dezelfde gebruikers-UUID in Auth, profiel en workspace.
- [ ] Voer `npx supabase db push` uit en controleer dat alle migraties tot en met 990 geregistreerd en zonder fout toegepast zijn.
- [ ] Configureer en test Auth Site URL, redirects, e-mail, Storage-buckets, policies en alle vereiste serversecrets zonder geheimen in Git.
- [ ] Maak het eerste productieaccount, activeer Corporate Admin en controleer na volledig opnieuw inloggen de nieuwe claim en rechten.
- [ ] Controleer dat een eventuele niet-productieomgeving geen productieaccounts, productiesleutels of echte productiegegevens gebruikt.
- [ ] Onderhoud aanzetten met Nederlandse en Engelse reden en eindtijd; controleer de countdown als gewone gebruiker.
- [ ] Controleer dat `/auth` tijdens onderhoud bereikbaar blijft en dat een Corporate Admin na inloggen toegang houdt.
- [ ] Dien vanuit Account → Privacy een verzoek in, controleer direct de statusgeschiedenis en behandel het in Governance → Privacy.
- [ ] Voeg een recensie van minimaal 20 tekens toe, publiceer, wijzig en archiveer haar.
- [ ] Controleer vierkante en staande profielfoto's; de afbeelding moet uitsnijden zonder uitrekken.
- [ ] Controleer Contact en Status in de hoofdnavigatie op telefoon en desktop.
- [ ] Log in en controleer dat Contact en Status ook vanuit het reisplatform direct in de hoofdnavigatie staan.
- [ ] Controleer dat bij een Corporate Admin eerst Bedrijfsmail en Corporate Admin staan, daarna Status en als laatste Contact.
- [ ] Controleer op Contact dat Bekende problemen, Platformstatus en Supportmogelijkheden ieder een passend icoon hebben.
- [ ] Zoek een bestemming en controleer dat de browser uitsluitend de GlobeTrotr-serverfunctie aanspreekt.
- [ ] Controleer homepage, demo, mogelijkheden en Over op een duidelijke eigen taak en zonder zichtbare regeleindemarkeringen.
- [ ] Doorloop de demo zonder account: wissel alle vier onderdelen, kies meerdere dagen, vink de paklijst af en verreken de voorbeeldbetaling; controleer dat nergens eigen reis- of persoonsdata verschijnt.
- [ ] Lees Over volledig in NL/EN en controleer dat het verhaal rustig doorloopt zonder een stapeling van losse kaarten.
- [ ] Controleer de onderhoudspagina op telefoon en desktop: compacte kop, onderhoudsreden, countdown, gegevensuitleg en beheerderslogin.
- [ ] Dien feedback in; controleer de Corporate Admin-melding, stuur een aanvullende vraag en controleer de gebruikersmelding.
- [ ] Publiceer een hoog of kritiek bekend probleem; controleer de beheermelding en dat deze na oplossen wordt gesloten.
- [ ] Depubliceer en archiveer een openbare reis vanuit Corporate Admin; controleer eigenaarsmelding, auditlog en herstel als privé-reis.
- [ ] Open het bezorgoverzicht in Corporate Admin en controleer aantallen per meldingstype na openen en wegklikken.
- [ ] Controleer canonical-URL, social preview en structured data op Home, Demo, Prijzen, Over, Contact en Status.
      Gebruik bij voorkeur vier testaccounts: een gewone reiziger, een Agency-eigenaar, een Agency-medewerker en een klant. Test belangrijke schermen eenmaal op telefoon en eenmaal op desktop.

## Account

- [ ] Account maken, inloggen, uitloggen en wachtwoord herstellen.
- [ ] E-mailadres wijzigen; controleer de bevestigingsmail van Auth en de blijvende beveiligingsmelding in GlobeTrotr.
- [ ] Wachtwoord wijzigen; controleer de bevestiging en dat de beveiligingsmelding na vernieuwen blijft bestaan.
- [ ] Taal NL/EN en licht/donker wijzigen; vernieuwen geeft geen lichtflits.
- [ ] Profiel wijzigen en controleren dat de wijziging direct zichtbaar is.
- [ ] Volledige gegevens-export downloaden en veilig opnieuw importeren.
- [ ] Testaccount verwijderen en controleren dat opnieuw inloggen niet meer kan.

## Reizen

- [ ] Reis maken, wijzigen, archiveren, herstellen en verwijderen.
- [ ] Reisnaam stopt bij 30 tekens en omschrijving bij 375 tekens.
- [ ] Bestemmingen, route, planning en paklijst toevoegen en wijzigen.
- [ ] Vlucht, accommodatie, huurauto, vervoer en activiteit toevoegen en wijzigen.
- [ ] Auto, openbaar vervoer, fiets en lopen kiezen; brandstofprognose klopt alleen waar passend.
- [ ] Reisback-up vanuit reisinstellingen downloaden en via accountinstellingen importeren.
- [ ] Reisagenda als `.ics` downloaden; controleer dagplanning, boekingstijden, locaties en meerdaagse onderdelen in minimaal één agenda-app.
- [ ] Open Reisinstellingen → Algemeen op telefoon en desktop; de omslag staat in een eigen blok naast of onder de velden en vermeldt 1600 × 900 px als aanbevolen formaat.
- [ ] Controleer reisduur, landen, overnachtingen, categorie-uitgaven, daggemiddelde en budgetprognose voor een toekomstige en een lopende reis.
- [ ] Dupliceer een reis en controleer dat route, planning en paklijst meegaan, terwijl deelnemers, uitgaven, boekingsreferenties, PIN en openbare status leeg of uitgeschakeld blijven.
- [ ] Exporteer minimaal twee bestemmingen als GPX, open het bestand in een kaartapp en controleer namen, coördinaten en volgorde.
- [ ] Keer een route met meerdere bestemmingen tweemaal om; controleer na iedere opslag de kaart en dat geen bestemming verdwijnt.
- [ ] Vergelijk twee reizen op het dashboard en controleer periode, routevolgorde, boekingen, budget en omgerekende uitgaven op desktop en telefoon.

## Uitgaven en verrekening

- [ ] Uitgave toevoegen, wijzigen en verwijderen.
- [ ] Bon toevoegen en alleen met het juiste abonnement en recht openen.
- [ ] Betaler en deelnemers wijzigen; totalen en slimme verrekening blijven correct.
- [ ] Lange namen en het saldo blijven volledig binnen het telefoonscherm.
- [ ] CSV/PDF-export opent correct en tekst die met `=`, `+`, `-` of `@` begint wordt geen formule.
- [ ] Zoek en filter een lange uitgavenlijst op tekst, categorie en betaler, ook op telefoon.

## Samenwerken

- [ ] Bestaand account uitnodigen via melding en accepteren of weigeren.
- [ ] Nieuw account uitnodigen via link, account maken en deelnemen.
- [ ] Uitnodiging wijzigen, vernieuwen en intrekken.
- [ ] Na acceptatie verschijnt één reisgenoot en de reis direct op het andere dashboard.
- [ ] Reisgenoot verwijderen; toegang verdwijnt en het verwijderde lid krijgt een melding.
- [ ] Reisrol wijzigen en controleren wat die gebruiker kan bekijken en aanpassen.

## Openbare reis

- [ ] Openbare reis zonder PIN openen terwijl je uitgelogd bent.
- [ ] PIN-reis weigert een onjuiste PIN en accepteert de juiste PIN.
- [ ] Kaart, reisomschrijving, gedeelde boekingen, weer en afteller tonen goed in NL/EN.
- [ ] Niet-gedeelde financiën, boekingsreferenties, notities en documenten zijn nergens zichtbaar.
- [ ] Agency-reis toont bedrijfsnaam, logo en reisbranding; gewone reis toont GlobeTrotr-branding.

## Agency-team en rechten

- [ ] Eigenaar nodigt adviseur en finance uit; accepteren en weigeren werken.
- [ ] Standaardrol en persoonlijke rechten beperken elk scherm en iedere schrijfhandeling correct.
- [ ] Teamlid blokkeren, herstellen en verwijderen; toegang en branding veranderen direct.
- [ ] Organisatienaam, tagline, kleuren en logo wijzigen; lege waarden vallen veilig terug.
- [ ] Per-reisbranding instellen, uitschakelen en terug laten vallen op de Agency-huisstijl.
- [ ] Beschikbaar Agency-subdomein opslaan; gereserveerde of reeds gebruikte naam wordt geweigerd.
- [ ] Eigen domein en mailafzender opslaan zonder dat een SMTP-wachtwoord in browser- of databasegegevens verschijnt.

## Agency-klanten en operatie

- [ ] Klant maken, wijzigen, aan reis koppelen en ontkoppelen.
- [ ] Bestaand klantaccount ziet een gekoppelde reis direct in het klantportaal.
- [ ] Klant archiveren trekt automatische reistoegang in; herstellen geeft die terug.
- [ ] Werkvoorraad laadt en toont aankomende reizen, documenten en declarabele kosten.
- [ ] Taak maken, toewijzen, overdragen, afronden en verwijderen.
- [ ] Sjabloon maken en toepassen zonder bestaande reisinhoud onverwacht te overschrijven.
- [ ] Reisdocument uploaden, categoriseren, vervaldatum wijzigen, openen en verwijderen.
- [ ] Leverancier voor accommodatie, vervoer en activiteit maken, zoeken, wijzigen, archiveren en herstellen.
- [ ] Leverancier aan meerdere eigen reizen koppelen; een gebruiker zonder planningsrecht kan niets opslaan.

## Agency-offertes

- [ ] Offerte met meerdere varianten maken en wijzigen.
- [ ] Klantlink maken, vernieuwen en intrekken; oude links werken daarna niet meer.
- [ ] Klant accepteert precies één variant of wijst de offerte af.
- [ ] Geaccepteerde offerte koppelen aan een bestaande reis of omzetten naar één nieuwe reis.
- [ ] Dubbel klikken of vernieuwen maakt geen tweede reis of tweede antwoord.
- [ ] Auditlog toont aanmaak, wijziging, delen, antwoord, intrekken en conversie met de juiste uitvoerder.
- [ ] Een ingelogde gebruiker uit een andere Agency kan geen prijsvarianten uitlezen.

## Publieke website en communicatie

- [ ] Homepage toont actuele openbare reizen en links openen de juiste veilige reispagina.
- [ ] Hoofdnavigatie bevat Contact en blijft op telefoon overzichtelijk.
- [ ] Over GlobeTrotr toont het oprichtersverhaal, feiten en eerlijke productstatussen in NL en EN.
- [ ] Privacy legt Europese primaire opslag, Duitse applicatieservers en optionele externe koppelingen correct uit.
- [ ] Corporate Admin maakt vanuit Nederlandse issue- en platformtekst een Engels concept; controle en wijzig dit voor opslaan of publiceren.
- [ ] Reisinstellingen en reisschema tonen slechts één gekozen onderwerp tegelijk op desktop en telefoon.

## Meldingen

- [ ] Uitnodigingen, reacties, verwijdering, rollen en blokkades geven de juiste melding.
- [ ] Agency-klanten, taken, huisstijl, documenten en offertelinks geven de juiste NL/EN-melding.
- [ ] Reisdata, bestemmingen, boekingen, vluchtstatus en uitgaven geven één gerichte NL/EN-melding aan de juiste rollen.
- [ ] Profiel-, abonnements-, export- en Corporate blokkade/herstelmeldingen zijn in beide talen begrijpelijk.
- [ ] De uitvoerder krijgt geen overbodige eigen melding.
- [ ] Meerdere wijzigingen aan hetzelfde onderwerp blijven één actuele melding.
- [ ] Uitgeschakelde informatieve voorkeuren worden gerespecteerd; beveiligingsmeldingen blijven actief.
- [ ] Melding wegklikken blijft na vernieuwen bewaard.

## Corporate Admin

- [ ] Publiceer een teststoring voor een Nederlands en Engels testaccount. Controleer in beide mailboxen dat de opgemaakte mail precies één taal toont, een statuslink heeft en bij een kritieke storing een duidelijk label toont. Controleer ook dat de pop-up rechtsboven titel en omschrijving in de juiste taal toont, zonder `status|`-code.
- [ ] Controleer met twee testworkspaces dat een nieuwe Paddle-checkout alleen het aangemelde account activeert. Een gewijzigde `workspace_uuid` in browserdata mag geen andere workspace activeren; verifieer webhookstatus en recht in Corporate Admin.
- [ ] Download een GPX voor een reis met geldige bestemmingen en open het bestand op het apparaat waarop de knop eerder niet reageerde. Controleer dat een bestemming zonder locatie niet als punt `(0,0)` verschijnt.
- [ ] Sla een vooraf gekoppeld Agency-klantprofiel opnieuw op terwijl het nieuwe klantaccount nog niet is bevestigd: geen reistoegang vóór bevestiging, wel de bedoelde reis erna.
- [ ] Abonneer met een agenda-app op een live reisfeed met een activiteit mét tijd en een hotelboeking zonder tijd. Controleer uurafspraak en hele-dagafspraak, wijzig de activiteitstijd en laat de app verversen.
- [ ] Maak in Agency een klantprofiel met één gekoppelde reis voordat het klantaccount bestaat. Registreer daarna met dat e-mailadres: vóór bevestiging geen toegang, erna alleen die reis in het klantportaal. Wijzig het adres en archiveer het profiel; de automatisch verleende toegang moet verdwijnen. Controleer deze nieuwe releasecheck ook in Corporate Admin.
- [ ] Begin een bedrijfsmail, wacht op “Concept opgeslagen”, sluit de editor en open hetzelfde concept opnieuw; onderwerp, ontvangers, HTML en tekst moeten gelijk blijven.
- [ ] Controleer Inbox, Verzonden, Concepten, Wachtrij en Archief, zoek op onderwerp en adres en verwijder daarna een testconcept.
- [ ] Beantwoord een ontvangen mail vanuit het portaal, antwoord opnieuw vanuit de externe mailclient en controleer dat alle berichten in dezelfde chronologische thread staan.
- [ ] Koppel een bestaand persoonlijk en gedeeld postvak en verstuur vanuit beide een bericht met vet, cursief, lijst en veilige link.
- [ ] Controleer in een echte mailclient dat HTML, handtekening en platte-tekstalternatief aanwezig zijn en dat scripts en `javascript:`-links zijn verwijderd.
- [ ] Maak via LibreTranslate een Engels concept voor een bekend probleem en platformbericht; corrigeer het concept handmatig vóór opslaan of publiceren.
- [ ] Alleen Corporate Admin kan gebruikers, Agencies, auditlog en platformbeheer openen.
- [ ] Gebruiker bekijken, plan wijzigen, blokkeren en herstellen met verplichte reden.
- [ ] Agency-instellingen bekijken en gecontroleerd aanpassen.
- [ ] Feedback bijwerken, archiveren en verwijderen; gebruiker ontvangt statusupdates.
- [ ] Bekend probleem maken, wijzigen, oplossen, archiveren en met GitHub synchroniseren.
- [ ] Platformstoring publiceren, bijwerken en oplossen; banner verschijnt en verdwijnt correct.
- [ ] Auditlog vermeldt wie iedere beheeractie uitvoerde.
- [ ] Medewerker zonder financieel of operationeel recht ziet die navigatie niet en kan de bijbehorende serveractie evenmin uitvoeren.
- [ ] Deactiveren, promoveren tot eigenaar en quota resetten vragen een tweede bevestiging.
- [ ] Zoeken en resultaatfilter in de auditlog werken; audit, omzet en facturen downloaden als leesbare CSV zonder formule-uitvoering.
- [ ] Medewerkerdetail toont de recente wijzigingen aan rol en rechten.

## Publieke en juridische pagina's

- [ ] Homepage, mogelijkheden, demo, prijzen, updates, roadmap en bekende problemen openen op telefoon en desktop.
- [ ] Privacyverklaring, voorwaarden, betavoorwaarden en terugbetalingsbeleid openen in NL/EN.
- [ ] Cookiekeuze werkt, wordt onthouden en kan later worden gewijzigd.
- [ ] Feedbackknop blijft bereikbaar zonder inhoud te bedekken.

## Technische eindcontrole

- [ ] Test de publieke site, reisomgeving, Agency en Corporate Admin op 320, 375, 768 en 1440 pixels zonder overlap of onbereikbare bediening.
- [ ] Controleer alle icoonknoppen op voldoende aanraakruimte, focusweergave en een begrijpelijk toegankelijk label.
- [ ] Doorloop Nederlands en Engels op prijzen, betaling, juridische pagina's en alle zichtbare laad-, fout- en lege statussen.
- [x] Migraties 870–960, alle gelijknamige SQL-tests en afsluitend `pre_vps_release_gate.sql` zijn uitgevoerd.
- [ ] Open Corporate Admin → Releasecheck, doorloop iedere open productcontrole en registreer iedere afwijking als feedback of bekend probleem.
- [ ] Maak als eigenaar een reistaak met verantwoordelijke en deadline, rond hem af en verwijder hem.
- [ ] Controleer dat een actieve reisgenoot de taak ziet en dat een gebruiker buiten de reis geen taken kan uitlezen.
- [ ] Open Vandaag op een lopende reis en controleer planning, boekingen, bestemming, weer, documentenverwijzing en taken op telefoon.
- [ ] Controleer blauwe boekingsmarkers en oranje gekoppelde-uitgavemarkers op de routekaart en open hun pop-ups.
- [ ] Upload, vervang en verwijder een reisomslag en controleer de verhouding op de reis en dashboardkaart.
- [ ] Controleer als reisgenoot dat de private omslag zichtbaar is en als buitenstaander dat het opslagbestand niet toegankelijk is.
- [ ] Maak de reis bewust openbaar en controleer dat de omslag via een kortlevende URL op de openbare reispagina verschijnt; schakel delen daarna weer uit.

- [ ] `npm test` slaagt.
- [ ] `npm run build` slaagt.
- [ ] Alle SQL-tests eindigen zonder fout en rollen hun testdata terug.
- [ ] `agency_release_gate.sql` meldt geen ontbrekende tabel, functie, RLS of onveilige browsergrant.
- [ ] Browserconsole en serverlogs bevatten tijdens de praktijktest geen onverwachte fouten.
