# GlobeTrotr roadmap

GlobeTrotr is een reisplanner voor vriendengroepen, koppels en families. **Agency** voegt een gedeelde werkomgeving toe voor reisorganisaties.

> **Status:** `[x]` is gebouwd of door de gebruiker als werkend bevestigd. `[ ]` moet nog worden gebouwd, geïmplementeerd of gecontroleerd. Uitgevoerde wijzigingen en praktijktests staan in `CHANGELOG.md`; deze roadmap bevat alleen de actuele productstand en het resterende werk.

## Actuele stand — 11 september 2026

De internationale beta ondersteunt accounts, reizen, routes, planning, boekingen, uitgaven, verrekening, samenwerking, openbare reispagina's, exports, privacyfuncties, feedback en platformmeldingen. Corporate Admin en het grootste deel van Agency Admin zijn gebouwd.

De huidige ontwikkelgrens ligt bij Agency-offertes: intern offertebeheer en een tijdelijke beveiligde klantweergave zijn gebouwd. Accepteren, afwijzen, conversie naar een reis en het intrekken of vernieuwen van actieve deellinks zijn gebouwd. De volgende ontwikkelgrens is volledige notificatiedekking. De nieuwste Agency-migraties staan lokaal klaar en worden pas uitgevoerd wanneer de gebruiker de implementatieronde start.

## Eerstvolgende bouwvolgorde

1. [x] **Offerte beantwoorden:** precies één variant accepteren of de volledige offerte afwijzen; atomair, herhaalveilig en met meldingen aan klant en Agency-team.
2. [x] **Offerte omzetten:** een geaccepteerde variant gecontroleerd naar een nieuwe of gekoppelde reis converteren, zonder bestaande inhoud te overschrijven.
3. [ ] **Volledige notificatiedekking:** onderstaande notificatiematrix bouwen en met ontvanger-, bundel- en autorisatietests bewaken.
4. [ ] **Publieke website vernieuwen:** nieuwe company-homepage, productpagina's, echte demo, navigatie en Engelstalige slugs met permanente redirects.
5. [ ] **Leveranciersbibliotheek:** herbruikbare aanbieders voor accommodatie, vervoer en activiteiten binnen één Agency-workspace.
6. [ ] **Agency-productiepoort:** resterende migraties in volgorde uitvoeren en alle rollen, klanten, documenten, taken, sjablonen en offertes praktisch testen.
7. [ ] **Hostingportabiliteit:** Node/Nitro-doel, VPS-service, stagingdomein, secrets, monitoring en rollback bouwen.
8. [ ] **Communicatie en betaling:** SMTP en Paddle activeren na staging-, domein-, webhook-, privacy-, opzeg- en terugbetalingstests.
9. [ ] **OAuth:** Apple, Google en Microsoft activeren zodra de productie-infrastructuur en providerconfiguratie gereed zijn.
10. [ ] **Finale deep securityscan:** vóór de publieke productieopening de volledige applicatie, infrastructuur en datastromen diepgaand controleren en alle kritieke of hoge bevindingen oplossen.

## P0 — Volledige notificatiedekking

### Uitgangspunten

- [ ] Iedere belangrijke statuswijziging krijgt één persistente in-appmelding voor iedere relevante ontvanger.
- [ ] De uitvoerder ontvangt geen overbodige melding over de eigen actie, behalve bij een noodzakelijke bevestiging of beveiligingsactie.
- [ ] Herhaalde wijzigingen aan hetzelfde onderwerp worden samengevoegd met een stabiele `event_key`; tien reiswijzigingen leveren bijvoorbeeld één actuele melding op.
- [ ] Een afgehandelde uitnodiging, ingetrokken link of opgeloste storing sluit de bijbehorende actie of banner direct.
- [ ] Meldingen bevatten een vertaalde titel, korte uitleg, tijdstip en waar mogelijk een veilige link naar het juiste scherm.
- [ ] Verplichte beveiligings-, toegangs-, betaal- en platformmeldingen kunnen niet worden uitgeschakeld. Informatieve wijzigingen volgen persoonlijke voorkeuren.
- [ ] E-mail gebruikt later dezelfde gebeurtenisbron als in-appmeldingen, met afzonderlijke bezorgstatus en idempotentie; een mislukte e-mail verwijdert nooit de in-appmelding.
- [ ] Geen wachtwoorden, tokens, medische gegevens, volledige documentinhoud of onnodige persoonsgegevens in meldingen of logs bewaren.
- [ ] Notificatiecreatie en de bijbehorende domeinwijziging waar nodig in dezelfde databasetransactie uitvoeren.
- [ ] Regressietests toevoegen voor juiste ontvangers, geen datalek naar buitenstaanders, deduplicatie, voorkeuren, vertaling en afgehandelde status.

### Account en beveiliging

- [x] Accountblokkade en herstel melden aan de betrokken gebruiker.
- [x] Belangrijke platformupdates en actuele storingen als melding of wegklikbare banner tonen.
- [ ] Wijziging van e-mailadres, wachtwoord, herstelmethode en toekomstige OAuth-koppeling bevestigen.
- [ ] Nieuwe of verdachte login en beëindiging van alle sessies melden zodra betrouwbare sessiegegevens beschikbaar zijn.
- [ ] Gegevens-export, accountverwijderingsverzoek en voltooiing bevestigen.
- [ ] Wijziging van abonnement, betaling, mislukte betaling, opzegging en terugbetaling melden zodra Paddle actief is.

### Reizen en samenwerking

- [x] Nieuwe reisuitnodiging aan een bestaand account melden.
- [x] Acceptatie of weigering terugmelden aan de uitnodiger.
- [x] Verwijdering uit een reis melden aan het verwijderde lid.
- [x] Meerdere reiswijzigingen bundelen tot één actuele melding per reis.
- [ ] Intrekken, vernieuwen en verlopen van een uitnodiging consequent aan de juiste betrokkenen melden.
- [ ] Rolwijziging, blokkade of herstel binnen een reis melden aan het betrokken lid.
- [ ] Belangrijke wijzigingen aan datum, bestemming, openbare status, PIN of gedeelde financiële gegevens apart herkenbaar maken.
- [ ] Nieuwe of gewijzigde boeking, vluchtstatus, document en documentvervaldatum volgens persoonlijke voorkeur melden.
- [ ] Betaalverzoek, gewijzigde verdeling en afgeronde verrekening melden aan de betrokken deelnemers.
- [ ] Per reis voorkeuren aanbieden voor planning, boekingen, uitgaven, documenten en vluchtalerts.

### Agency

- [x] Agency-uitnodiging, acceptatie, weigering, blokkade, herstel en verwijdering ondersteunen met blijvende accountmeldingen.
- [x] Nieuwe taak aan de toegewezen medewerker melden.
- [x] Persoonlijke voorkeuren voor reiswijzigingen, uitnodigingsreacties en klantupdates voorbereiden.
- [x] Wijziging van Agency-rol of persoonlijke rechten melden aan het betrokken teamlid.
- [x] Belangrijke wijzigingen aan organisatiegegevens, huisstijl en reisbranding melden aan bevoegde beheerders.
- [x] Klant koppelen, ontkoppelen, archiveren of herstellen gebundeld melden aan bevoegde medewerkers die klantupdates willen ontvangen.
- [x] Taaktoewijzing, wijziging, deadline, status en overdracht gebundeld melden aan de betrokken uitvoerder.
- [ ] Naderende en verstreken taakdeadlines via een geplande controle melden aan uitvoerder en relevante beheerder.
- [x] Offerteacceptatie of -afwijzing als één gebundelde melding aan het actieve Agency-team tonen.
- [x] Offerte delen, link vernieuwen, intrekken, beantwoorden en converteren gericht en gebundeld melden.
- [ ] Bekijken van een offerte alleen registreren als daarvoor een passende grondslag, duidelijke informatie en een concreet productdoel zijn vastgesteld.
- [ ] Verlopen offertelinks via een geplande controle eenmaal melden.
- [x] Document toegevoegd, verwijderd of met gewijzigde vervaldatum melden volgens reisrechten en voorkeur.
- [ ] Bijna verlopen en verlopen documenten via een geplande controle eenmaal melden.
- [ ] Agency-planwijziging, limietwaarschuwing en toekomstige factuurstatus alleen aan gebruikers met facturatierecht melden.

### Feedback, problemen en platformbeheer

- [x] Feedbackindiener bij een statuswijziging informeren.
- [x] Platformstatus publiceren, bijwerken en opgelost melden; actieve storing via een banner tonen.
- [ ] Nieuwe feedback en urgente bekende problemen aan de juiste Corporate Admin-ontvangers melden.
- [ ] Reactie of aanvullende vraag op feedback ondersteunen zonder privégegevens openbaar te maken.
- [ ] Publicatie, wijziging, oplossing en archivering van een bekend probleem consistent verwerken.
- [ ] Notificatiebeheer in Corporate Admin toevoegen: gebeurtenistype, doelgroep, kanaal, status, laatste fout en opnieuw proberen.
- [ ] Alle beheeracties rond meldingen in de append-only auditlog vastleggen.

## P0 — Agency-offertes afronden

- [x] Relationele offertes met meerdere geordende prijsvarianten, klant, optionele reis, geldigheid en status.
- [x] Atomaire interne opslag en beheer vanuit Agency Admin.
- [x] Tijdelijke klantlink met cryptografisch token; alleen de hash wordt opgeslagen.
- [x] Openbare offertepagina met uitsluitend deelbare offerte- en merkgegevens.
- [x] Eenmalige, atomaire acceptatie van precies één geldige variant.
- [x] Atomaire afwijzing van de volledige offerte, met optionele begrensde klantreactie.
- [x] Heldere bevestigingspagina na antwoord en herhaalveilig resultaat bij dubbel klikken of vernieuwen.
- [x] Het actieve Agency-team met één gebundelde, vertaalde melding informeren.
- [x] Gedeelde link kunnen intrekken of veilig roteren en de deelstatus in Agency Admin tonen.
- [x] Geaccepteerde variant omzetten naar een nieuwe reis of expliciet koppelen aan een bestaande reis.
- [x] Conversie-preview tonen en nooit bestaande reisinhoud stilzwijgend overschrijven.
- [x] Volledige offertecyclus van aanmaak en wijziging tot delen, antwoord, intrekken en conversie in de Agency-auditlog vastleggen.

## P0 — Publieke website en homepage

- [ ] Nieuwe company-homepage met duidelijke waardepropositie, doelgroep en primaire actie binnen de eerste schermhoogte.
- [ ] Publieke navigatie voor product, oplossingen, demo, prijzen, updates, roadmap, support en juridische informatie.
- [ ] Interactieve demo met veilige voorbeelddata voor kaart, planning, boekingen, uitgaven, verrekening en delen.
- [ ] Afzonderlijke pagina's voor reizigers, groepen en Agencies.
- [ ] Agency-productpagina voor teams, rollen, klanten, offertes, taken, sjablonen, documenten, branding en klantportaal.
- [ ] Productbeelden, realistische scenario's, privacyvertrouwen, transparante betastatus en duidelijke ondersteuning.
- [ ] Volledig responsive en toegankelijk in NL/EN, met metadata, social previews, canonical-URL's, sitemap en gestructureerde data.
- [ ] Engelstalige slugs: `/features`, `/demo`, `/for-travelers`, `/for-groups`, `/for-agencies`, `/pricing`, `/updates`, `/roadmap`, `/known-issues`, `/beta`, `/privacy`, `/terms` en `/refund-policy`.
- [ ] Functionele slugs migreren naar `/trip/:token/:tripId`, `/invite/:token` en `/agency-invite/:token`.
- [ ] Bestaande Nederlandse routes permanent doorsturen, zodat bookmarks, gedeelde reizen en uitnodigingen blijven werken.
- [ ] Taalkeuze los van de URL houden: één stabiele slug toont NL of EN volgens account- of browservoorkeur.
- [ ] Volledige kliktest op telefoon en desktop voor beide talen.

## P0 — Agency implementeren en controleren

De gebruiker heeft aangegeven de migraties later gezamenlijk te implementeren. Voer niets automatisch op de productieomgeving uit.

- [ ] `20260908037000_fix_agency_clients_and_operations.sql`
- [ ] `20260908038000_agency_notification_preferences.sql`
- [ ] `20260908039000_secure_trip_documents.sql`
- [ ] `20260908040000_trip_document_expiry.sql`
- [ ] `20260908041000_agency_tasks.sql`
- [ ] `20260908042000_agency_templates.sql`
- [ ] `20260908043000_agency_quotes.sql`
- [ ] `20260908044000_agency_quote_management.sql`
- [ ] `20260908045000_secure_agency_quote_sharing.sql`
- [ ] `20260908046000_agency_quote_responses.sql`
- [ ] `20260908047000_convert_agency_quotes.sql`
- [ ] `20260908048000_manage_agency_quote_shares.sql`
- [ ] `20260908049000_agency_access_notifications.sql`
- [ ] `20260908050000_agency_branding_notifications.sql`
- [ ] `20260908051000_agency_task_notifications.sql`
- [ ] `20260908052000_trip_document_notifications.sql`
- [ ] `20260908053000_agency_client_notifications.sql`
- [ ] `20260908054000_agency_quote_lifecycle.sql`
- [ ] Bijbehorende SQL-tests daarna in dezelfde volgorde uitvoeren.
- [ ] Praktisch controleren met eigenaar, adviseur, finance, klant en buitenstaander.
- [ ] Agency-downgrade, blokkade, vertrek en herstel controleren op toegang én directe terugkeer naar GlobeTrotr-branding.

## P0 — Finale deep securityscan vóór productie

- [ ] Volledige aanvalsoppervlakte inventariseren: browser, serverfuncties, Supabase, Storage, SMTP, Paddle, OAuth, GitHub-koppeling, VPS en DNS.
- [ ] RLS-beleid, databasefuncties, `SECURITY DEFINER`, grants, zoekpaden, triggers en RPC-autorisatie handmatig en geautomatiseerd controleren.
- [ ] Publieke routes, deel- en uitnodigingslinks, tokens, PIN's, uploads, exports en importbestanden testen op toegang buiten de bedoelde workspace of reis.
- [ ] Authenticatie, sessies, blokkades, rollen, persoonlijke rechten, Agency-scheiding en Corporate Admin-toegang met negatieve praktijktests controleren.
- [ ] OWASP-risico's controleren, waaronder injectie, XSS, CSRF, SSRF, IDOR, open redirects, rate-limitomzeiling, brute force en spreadsheetformules.
- [ ] Secrets, logging, foutmeldingen, bronkaarten, buildartefacten, Git-geschiedenis en configuratie controleren op onbedoelde openbaarmaking.
- [ ] Dependencies, lockfile, GitHub Actions, container- of VPS-image en productieheaders scannen op kwetsbaarheden en verkeerde configuratie.
- [ ] Privacy- en dataminimalisatiecontrole uitvoeren op persoonsgegevens, financiële gegevens, documenten, auditlogs, bewaartermijnen, exports en accountverwijdering.
- [ ] Back-upherstel, incidentrespons, monitoring, alarmen en rollback in staging daadwerkelijk uitvoeren.
- [ ] Bevindingen voorzien van ernst, bewijs, eigenaar en herstelstatus; alle kritieke en hoge bevindingen oplossen en opnieuw testen vóór livegang.
- [ ] Finale securityrapportage bewaren zonder secrets of persoonsgegevens en de productieopening expliciet blokkeren zolang de scan niet is goedgekeurd.

## P1 — Agency verder uitbouwen

- [ ] Leveranciersbibliotheek voor accommodaties, vervoer en activiteiten.
- [ ] Leverancierscontacten, boekingsvoorwaarden, commissie en interne notities workspacegebonden opslaan.
- [ ] Operationele dashboards uitbreiden met echte documentopslag, klantreizen, declarabele kosten en later facturen.
- [ ] Herinneringen en configureerbare automatiseringen voor taken en deadlines.
- [ ] Klantportaal uitbreiden met offertes, antwoorden en later echte factuur- en betaalstatus.
- [ ] Rapportages voor offerteconversie, omzet, marge, commissie en klanttevredenheid zodra betrouwbare events bestaan.

## P1 — Corporate Admin verder uitbouwen

- [x] Afzonderlijke beheershell voor overzicht, gebruikers, Agencies, status, berichten, problemen, feedback en auditlog.
- [x] Gebruikersdetails, reisstatistieken, planwijziging, blokkeren/herstellen en verplichte reden met auditregistratie.
- [x] Agency-instellingen bekijken en gecontroleerd corrigeren.
- [x] Platformstatus, feedback, bekende problemen en GitHub Issues-synchronisatie.
- [ ] Compacte salesweergave bouwen zodra abonnementsevents en Paddle-data bestaan.
- [ ] Moderatie van openbare reizen met reden en auditlog.
- [ ] Featureflags, gefaseerde beta-uitrol en noodstop per externe integratie.
- [ ] Privacyverzoeken en wettelijke afhandelingstermijnen volgen.
- [ ] Beperkte incidentenmodule en vierogenbevestiging voor definitieve risicovolle acties.
- [ ] Minimale aggregatie-RPC's gebruiken waar dashboards nu nog brede service-role-queries doen.

## P1 — Hosting, e-mail en betalingen

### Ubuntu-VPS

- [ ] Lovable-afhankelijkheden inventariseren.
- [ ] Afzonderlijke Node/Nitro-productiebuild en expliciet startscript bouwen.
- [ ] Docker of systemd-service onder een niet-root gebruiker, healthcheck, herstart en begrensde logs.
- [ ] Nginx of Caddy voor TLS, proxyheaders, uploads en WebSockets.
- [ ] Stagingdomein, Supabase Site URL en exacte redirect-URL's configureren.
- [ ] Monitoring, uptimecontrole, firewall, updates, configuratieback-up en rollback naar Lovable.
- [ ] DNS pas na een volledige stagingproef omschakelen.

### SMTP

- [ ] Provider en verwerkingsregio kiezen en privacyverklaring concretiseren.
- [ ] SPF, DKIM en DMARC voor `globetrotr.nl` configureren.
- [ ] Provider-onafhankelijke mailmodule met time-outs, idempotentie, rate limiting en veilige foutregistratie.
- [ ] NL/EN-templates voor uitnodigingen, antwoorden, beveiliging, betalingen en belangrijke updates.
- [ ] Bezorgstatus registreren zonder volledige berichtinhoud of secrets te loggen.

### Paddle

- [ ] Producten, prijzen en belastingweergave definitief instellen.
- [ ] Checkout of Payment Links met correcte consumenteninstemming.
- [ ] Ondertekende webhooks als enige bron voor betaalstatus.
- [ ] Abonnement, verlenging, upgrade, downgrade, opzegging, mislukte betaling en terugbetaling verwerken.
- [ ] Facturen en transacties uitsluitend aan bevoegde gebruikers tonen.
- [ ] Juridische pagina's aanvullen met de uiteindelijke VPS-, SMTP- en Paddle-productiegegevens vóór livegang.

## P1 — Reizen onderweg en productkwaliteit

- [ ] Offline of beperkte-connectiviteitsmodus voor essentiële reisgegevens.
- [ ] Kalenderexport en latere agenda-integratie.
- [ ] Periodieke vluchtupdates en optionele vluchtalerts zonder API-quota te verspillen.
- [ ] Routeoptimalisatie met handmatige bevestiging.
- [ ] Verdere mobiele, toegankelijkheids- en performancecontrole.
- [ ] Grote bundles splitsen waar dit de gemeten laadtijd werkelijk verbetert.
- [ ] Automatische vertaling van feedback en bekende problemen pas na keuze van een veilige provider en bewaarbeleid.

## P2 — Latere groei

- [ ] Referral- en kortingsprogramma met fraudebeperking en Paddle-koppeling.
- [ ] Boekingsbevestigingen uit e-mail omzetten naar controleerbare concepten.
- [ ] CRM- en boekhoudexport via afgeschermde integraties.
- [ ] Geplande Agency-automatiseringen en uitgebreidere rapportages.
- [ ] Aanvullende talen na volledige dekking en kwaliteitscontrole van Nederlands en Engels.

## Gebouwd fundament

- Accounts met e-mail/wachtwoord, profiel, taal, thema, export en verwijdering.
- Relationele reizen met versiecontrole, rollen, uitnodigingen en financiële privacy.
- Route, kaart, planning, boekingen, vluchtdata, vervoer, brandstofinschatting, uitgaven en slimme verrekening.
- Openbare reispagina met kaart, PIN, begrensde velden en selectieve publieke API.
- Private documenten, exports en veilige spreadsheetuitvoer.
- Persistente meldingen, platformbanner, feedback en bekende problemen.
- Corporate Admin met auditlog en Agency Admin met team, rechten, branding, klanten, operatie, taken, sjablonen, documenten, abonnementsoverzicht en offertes.
- Privacyverklaring, beta-voorwaarden, algemene voorwaarden, terugbetalingsbeleid, prijzen, publieke roadmap en publieke changelog in NL/EN.

## Actuele beta-beperkingen

- Automatische app-e-mails zijn nog niet actief; accountmeldingen en deelbare links werken wel.
- Apple-, Google- en Microsoft-login zijn nog niet actief.
- Paddle-checkout, facturen en betaalstatus zijn nog niet actief; de beta schrijft niets af.
- Automatische vertaling van feedback en bekende problemen is nog niet actief.
- De lokale Agency-migraties vanaf `20260908037000` moeten nog als één gecontroleerde implementatieronde worden uitgevoerd.
