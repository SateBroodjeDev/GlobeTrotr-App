# GlobeTrotr changelog

## 2026-09-21 — Bedrijfsmail opnieuw bezorgen (voorbereid)

- Medewerkers met antwoord- of beheerrecht kunnen een tijdelijk mislukte uitgaande bedrijfsmail opnieuw in de beveiligde wachtrij plaatsen.
- De bestaande wachtrijregel wordt hergebruikt, waardoor onderwerp, veilige HTML, platte-tekstalternatief, handtekening en bijlagen behouden blijven en geen tweede concept ontstaat.
- Permanente SMTP-afwijzingen blijven geannuleerd; de actie verschijnt uitsluitend bij tijdelijk mislukte bezorging en wordt in het auditlog vastgelegd.
- Migratie 1380 voegt de praktische Corporate Admin-releasecontrole toe en controleert dat de workerwachtrij niet rechtstreeks aan ingelogde gebruikers is blootgesteld.

## 2026-09-21 — Professionele HTML-handtekening (voorbereid)

- Persoonlijke en gedeelde bedrijfspostvakken krijgen bij verzending een vaste, mobielvriendelijke HTML-handtekening met GlobeTrotr-logo, afzendernaam, vrije functieregels, postvakadres, tagline, website, contactlink en CTA.
- De opgeslagen handtekening blijft gewone bewerkbare tekst. Oude GlobeTrotr-boilerplate wordt bij rendering ontdubbeld en alle persoonlijke waarden worden als tekst ontsnapt.
- Mailclients zonder HTML ontvangen een volledige tekstfallback. Corporate Admin en de eigenaar van een persoonlijk postvak zien vóór opslaan een veilig voorbeeld.
- Migratie 1370 actualiseert de praktische releasecontrole voor een persoonlijk en gedeeld postvak in gangbare mailclients.

## 2026-09-21 — Vertaalconcepten op meer beheerplekken (voorbereid)

- Platformmeldingen en bekende problemen kunnen nu zowel van Nederlands naar Engels als van Engels naar Nederlands worden vertaald.
- Corporate Admin kan dezelfde gecontroleerde vertaalactie gebruiken voor onderhoudsteksten en recensies, inclusief de auteurscontext.
- Ontvangen feedback kan als aparte Nederlandse of Engelse leesweergave worden vertaald. Ook een conceptantwoord kan beide kanten op worden vertaald zonder de oorspronkelijke inzending te wijzigen of automatisch te verzenden.
- Ontvangen bedrijfsmail heeft nu eveneens een losse Nederlandse of Engelse leesweergave. De opgeslagen tekst en veilige HTML-weergave blijven intact.
- Vertalen vervangt alleen het doelveld door een concept. Opslaan en publiceren blijven aparte handmatige acties; de interface vraagt expliciet om namen, bedragen en betekenis te controleren.
- Migratie 1360 werkt de bestaande Corporate Admin-releasecheck bij voor alle ondersteunde vertaalplekken.

## 2026-09-21 — Betaalmeldingen, MRR en bewuste herhaalaankopen (voorbereid)

- De actief-plan-knop voor losse maanden heet voortaan **Voeg één maand toe** en toont vóór de Paddle-checkout de huidige einddatum en een expliciete bevestiging. Zo blijven meerdere maanden vooruitbetalen mogelijk zonder dat de misleidende knoptekst iedere klik als gewone plankeuze presenteert.
- Een terugkerende planwijziging vergelijkt de actuele Paddle-prijs vóór de wijziging. Staat het abonnement al op die prijs, dan wordt geen factureerbare PATCH verstuurd; een echte Pro/Agency-wissel blijft direct evenredig afgerekend.
- Paddle-meldingen worden in de profieltaal opgeslagen; bestaande open tweetalige betaalmeldingen worden bijgewerkt. De meldingweergave lokaliseert oudere tweetalige accountmeldingen bovendien defensief.
- Corporate Admin legt uit dat MRR alleen doorlopende abonnementen telt. Losse maanden staan bij omzet en krijgen een eigen teller voor actieve vooruitbetaalde rechten.
- Alleen webhookevents die door de inmiddels opgeloste kortingsconstraint vastliepen worden opnieuw klaargezet. Payloads en auditgeschiedenis blijven behouden.
- Live agenda toont de aanmaakdatum van de actieve geheime link, legt uit waarom een bestaande URL niet opnieuw zichtbaar wordt en biedt bij een nieuwe link direct **Open in agenda-app** via `webcal://`.

## 2026-09-21 — Paddle-facturen en vooruitbetaalde maanden (voorbereid)

- Bij een abonnementswijziging kan Paddle een onmiddellijke verrekening van €0 afronden zonder downloadbare factuur-PDF. GlobeTrotr hield daar toch een interne factuur voor bij. Migratie 1340 bewaart de transactie, maar maakt alleen een factuurspiegel bij een positief bedrag met officieel Paddle-factuurnummer. Eerdere lokale schijnfacturen worden verwijderd; webhook- en transactiegeschiedenis blijven bewaard.
- Zes losse maandbetalingen stapelen al zes maanden toegang op. Een nieuwe SQL-test bewijst dit en controleert dat herhaalde verwerking geen extra maand toekent. De facturatiepagina toont nu de einddatum en het aantal nog geldige losse maandbetalingen, en legt bij een €0-transactie uit waarom er geen PDF beschikbaar is.

## 2026-09-21 — Correctie voor volledig afgeprijsde Paddle-betalingen (voorbereid)

- Bij de eerste echte herstelpoging bleek dat Paddle het subtotaal vóór korting levert. Onze betaal- en factuurtabellen vereisen een nettosubtotaal; een betaling met 100% korting werd daardoor door de database geweigerd (`billing_transactions_check1`). Migratie 1330 normaliseert alleen Paddle-rijen en laat de oorspronkelijke bedragen in het webhookevent intact.
- De nieuwe SQL-test verwerkt een volledige €0-transactie en Agency-recht binnen een rollback. Migratie 1340 voorkomt daarna een lokale factuur zonder beschikbare Paddle-PDF. De bestaande betaling en automatische webhookbezorging blijven open totdat ze na de migraties in productie zijn bevestigd.

## 2026-09-21 — Registratie, agenda en bedrijfsmail (nog niet uitgerold)

- Migratie 1320 herstelt de concrete fout waarbij een volledig afgeprijsde Paddle-transactie (`0 credit >= 0 totaal`) als terugbetaald werd beschouwd. Alleen aantoonbaar verwerkte bestaande eenmalige aankopen worden veilig hersteld; ontbrekende webhooks vergen nog bezorgcontrole.
- De Node-02-worker verstuurt nieuwe Supabase `sb_secret_`-sleutels niet meer als Bearer-JWT. Paddle- en ICS-RPC's werken daardoor met zowel de nieuwe sleutel als een legacy service-role JWT. Een eenmalige checkout zonder verifieerbare workspacekoppeling krijgt nu een zichtbare fout en retry in plaats van een stilzwijgende 200.
- Corporate Admin kan een ontbrekende eenmalige Paddle-transactie gericht herstellen via Paddle's API. Alleen een voltooide transactie met exact toegestaan prijs-ID, ondertekende workspacekoppeling en zonder refund/credit/chargeback kan worden verwerkt; de actie wordt geaudit.
- Een nieuwe live ICS-link wordt via de publieke URL als echte agenda opgehaald vóór uitgifte. Bij een defecte worker- of Caddy-route blijft een bestaande link actief en wordt geen nieuwe kapotte link getoond.
- De registratie toont een herstelactie als de spamcontrole niet laadt en houdt de knop bij een trage Supabase-aanvraag maximaal 25 seconden in wachtstand. De UI meldt dan dat de aanvraag mogelijk alsnog is verwerkt; de oorzaak van HTTP 504 moet in Auth/SMTP-logs worden vastgesteld.
- Een al gebruikt sociaal e-mailadres leidt tot uitleg over inloggen via Google of Discord. De registratie geeft geen accountbestaan aan derden prijs.
- Nieuwe sociale accounts krijgen een eenmalige profielstap met naam, optionele telefoon en foto; hiervoor is migratie 1310 nodig.
- De bedrijfsmail-layout begrenst lange adressen, onderwerpregels, HTML-weergave en tekst op kleine schermen.
- De publieke changelog is direct in de footer zichtbaar. De live ICS-worker ondersteunt ook HEAD; bij het maken van een feed wordt de database-uitvoer eerst gecontroleerd. Bestaande 404-links en de Paddle-koppeling zijn pas opgelost wanneer de productiecontrole slaagt.


## 2026-09-21 — Diagnose voor ontbrekende Paddle-transactie (niet uitgerold)

- Corporate Admin toont geen verzonnen terugkerende betaalwijze meer als er geen webhook of lokale transactie bestaat.
- Het release-draaiboek bevat nu een aparte, leesbare controle voor een voltooide Agency-transactie van €0 na 100%-korting. Paddle kan zo'n transactie als voltooid registreren; lokale toegang volgt pas na geverifieerde webhook en juiste workspacekoppeling.
- Dit productie-incident blijft open totdat de webhookbezorging en het Agency-recht voor de concrete transactie zijn bevestigd.

## 2026-09-21 — Auth-mail per gekozen taal (niet uitgerold)

- Registratie en nieuwe magic-linkaccounts bewaren Nederlands of Engels in Auth-metadata; een profieltaalwijziging houdt deze voorkeur voortaan gelijk.
- Migratie 1300 vult de taal voor bestaande accounts en voegt een Corporate Admin-acceptatiecontrole toe.
- De vijf Supabase Auth-templates en hun onderwerpen tonen voortaan één taal per bericht. Zonder Nederlandse voorkeur is Engels de veilige standaard.
- Nieuwe en vernieuwde reis- en Agency-uitnodigingen gebruiken dezelfde veilige taalkeuze. Agency-rechten, betaalverzoeken en overige servicemail zetten interne berichtcodes om in leesbare NL/EN-tekst met een passende actieknop.
- Privacy- en cookietekst maakt nu expliciet onderscheid tussen noodzakelijke opslag, taaltoestemming en door de gebruiker ingestelde thema- en zijbalkvoorkeuren.

## 2026-09-21 — Uitgebreide automatische securitypoort (niet uitgerold)

- De releasecontrole scant nu alle TypeScript-bronnen op onbeveiligde service-role-serverfuncties, servergeheimen in browsercode, nieuwe niet-beoordeelde HTML-sinks, externe links zonder openerbescherming en mogelijk gevoelige logging.
- Nieuwe migraties na de bevestigde 1170-baseline worden gecontroleerd op een vastgezet `search_path` voor iedere `SECURITY DEFINER`-functie en op risicovolle uitvoerrechten.
- Vijf regressietests bewaken de scanner zelf. Een gevonden externe privacy-link is direct voorzien van expliciete `noopener`-bescherming.
- De productie-afhankelijkheden zijn aanvullend tegen de actuele npm-advisories gecontroleerd; op 21 september 2026 zijn geen bekende kwetsbaarheden gemeld.
- De handmatige aanvalstests, infrastructuurscan en finale vrijgavebeoordeling blijven open; deze automatische poort claimt geen afgeronde productie-audit.

## 2026-09-21 — Storingsmail in de juiste taal (niet uitgerold)

- De mailwachtrij haalt bij platformmeldingen de Nederlandse of Engelse tekst uit de oorspronkelijke aankondiging. Intern opgemaakte notificatiecodes worden niet meer als mailtekst verzonden.
- De SMTP-relay leest ook eerder opgebouwde wachtrijregels en toont kritieke storingen met een herkenbare kop en link naar de statuspagina. Plan- en enkele toegangsberichten krijgen begrijpelijke zinnen; de pop-up rechtsboven toont geen interne codes meer.
- Migratie 1290 voegt een openstaande Corporate Admin-controle toe; mail in twee echte postvakken blijft nog te testen.
- De SQL-test voor 1290 bewijst nu met teruggedraaide Nederlandse en Engelse testaccounts dat onderwerp, tekst, ernst en meldingstype werkelijk worden gelokaliseerd en geen interne scheidingstekens lekken.
- Een vaste release-preflight blokkeert ontbrekende migratietests, verouderde implementatieverwijzingen en bekende kapotte UTF-8-patronen vóór een commit.

## 2026-09-21 — Betaling aan het juiste account koppelen (niet uitgerold)

- De checkout ontvangt een door de ingelogde server ondertekende workspacekoppeling. De Paddle-worker accepteert de workspace-ID uit de webhook alleen als die handtekening bij plan en betaalwijze past.
- Een losse of gewijzigde workspace-ID uit browserdata verleent geen toegang. Bestaande abonnementsgebeurtenissen kunnen via hun opgeslagen Paddle-klantkoppeling blijven doorlopen.
- Migratie 1280 voegt een nieuwe openstaande Corporate Admin-controle toe. Beide nodes hebben vóór de uitrol hetzelfde nieuwe private geheim nodig.

## 2026-09-21 — Betrouwbare GPX-routepunten en bevestigde klanttoegang (niet uitgerold)

- GPX neemt geen ontbrekende of buitenbereik-coördinaten meer op als routepunt. Geldige nulcoördinaten blijven ondersteund.
- De Agency-koppeling wordt ook bij opnieuw opslaan van een klantprofiel pas actief nadat het klantadres is bevestigd.
- De praktijkmeldingen over de GPX-knop en Agency-koppeling blijven open tot een test op de getroffen accounts en apparaten slaagt.

## 2026-09-21 — Activiteitstijden in live agenda (niet uitgerold)

- De live ICS-feed op Node-02 behoudt nu begin- en eindtijden van boekingen en activiteiten. Zonder tijd blijft een boeking een hele-dagafspraak.
- Ongeldige datums worden overgeslagen en tekst wordt veilig voor ICS ontsnapt en gevouwen. De bestaande agenda-download en linkrotatie blijven ongewijzigd.
- Twee automatische regressietests controleren getimede en hele-dagafspraken; de praktische import in Apple, Google of Outlook blijft open.

## 2026-09-21 — Agency-klanttoegang na registratie (niet uitgerold)

- Een Agency kan een klantprofiel en reis vooraf koppelen. Zodra die klant een account registreert en het e-mailadres bevestigt, krijgt het account automatisch alleen de gekoppelde reis in het klantportaal.
- Bij een wijziging naar een ander e-mailadres worden uitsluitend de door het Agency-klantprofiel verleende reisrechten ingetrokken. Een bestaande handmatige reisdeelname blijft intact.
- Migratie 1270 herstelt bestaande bevestigde accounts en voegt een afzonderlijke, nog openstaande Corporate Admin-controle toe.

## 2026-09-21 — Paddle-transactie koppelen aan account (niet uitgerold)

- Corporate Admin kan met een exact Paddle-transactie-ID de lokale betaalstatus, klant, accounteigenaar, workspaceplan, abonnement of eenmalig recht en bijbehorende webhookstatus vergelijken.
- Ruwe webhooks en betaalgegevens worden niet in de browserdiagnose getoond. Bij een afwijkende workspacekoppeling wordt herverwerking geblokkeerd; alleen reeds toegestane mislukte events of een gemist eenmalig recht gebruiken de bestaande gecontroleerde herstelroute.
- Migratie 1260 voegt hiervoor een afzonderlijke, nog openstaande acceptatiecontrole toe.

## 2026-09-21 — Postvakdiagnose voor Corporate Admin (niet uitgerold)

- Postvakken tonen voortaan afzonderlijk de laatste succesvolle synchronisatie, laatste poging en een foutcode zonder mailinhoud of wachtwoord.
- Een beheerder kan precies één extra synchronisatieverzoek per postvak klaarzetten; de IMAP-worker handelt dit in de volgende ronde af en registreert succes of fout per verbinding.
- Bij een fout in één persoonlijk postvak blijft de synchronisatie van andere postvakken doorgaan. Migratie 1250 voegt de benodigde velden en een nog openstaande Corp Admin-controle toe.

## 2026-09-21 — Privacy- en tekstcontrole (niet uitgerold)

- De privacyverklaring benoemt in beide talen welke bedrijfsmailgegevens, concepten, bijlagen en vertaalteksten worden verwerkt, wie toegang heeft en hoe lang afgebroken uploads blijven staan.
- De tekst over SMTP- en IMAP-geheimen is gecorrigeerd: centrale relayconfiguratie blijft op de server, gekoppelde postvakwachtwoorden staan versleuteld in de database.
- De kaarttegels en mogelijke directe valutacalls zijn expliciet uitgezonderd van de serverproxyclaim, zodat de privacytekst geen onjuiste afscherming van het klant-IP belooft.
- Een extra Corporate Admin-controle voor de privacyinformatie is toegevoegd als migratie 1240; een SQL-test verifieert dat deze nog niet ten onrechte is afgevinkt.
- Zichtbare kapotte leestekens in Corporate Admin en Agency Admin zijn gecorrigeerd.
- De scanner accepteert alleen nog een exact schoon ClamAV-antwoord. Bij tijdelijk scannerfalen slaat de IMAP-sync het bericht nog niet op en probeert de volgende ronde opnieuw; een herkende besmette bijlage wordt geblokkeerd en zichtbaar gemarkeerd.

## 2026-09-21 — HTML-bedrijfsmail en gratis vertaalconcepten (niet uitgerold)

- Bedrijfsmail heeft nu Inbox, Verzonden, Concepten, Wachtrij en Archief, met zoeken binnen het gekozen postvak.
- Nieuwe berichten worden automatisch als persoonlijk concept opgeslagen, kunnen opnieuw worden geopend en verdwijnen na succesvol klaarzetten.
- Onderwerp en berichttekst kunnen als controleerbaar NL/EN-concept worden vertaald en vóór verzending in een afgeschermd HTML-voorbeeld worden bekeken.
- Antwoorden gebruiken geldige mailheaders en worden in het portaal als één chronologisch gesprek gegroepeerd.
- Medewerkers kunnen maximaal vijf gecontroleerde bijlagen toevoegen; bestanden blijven in een privébucket, worden voor verzending op omvang en SHA-256 gecontroleerd en zijn alleen via een kortlevende downloadlink bereikbaar.
- De IMAP-worker bewaart ondersteunde ontvangen bijlagen naast het bericht en toont ze in hetzelfde gesprek.
- Uploads zijn vooraf aan gebruiker en postvak gereserveerd; niet-afgemaakte uploads verlopen na twee uur en worden door de worker uit Storage en de database verwijderd.
- Een private ClamAV-service scant alle inkomende en uitgaande bijlagen; malware, scanneruitval en onduidelijke resultaten worden fail-closed geweigerd en zonder bestandsinhoud gelogd.
- Bedrijfsmail heeft een WYSIWYG-editor voor vet, cursief, onderstrepen, lijsten en veilige links; de server verwijdert onveilige HTML en bewaart altijd een platte-tekstalternatief.
- De persoonlijke of gedeelde handtekening wordt ook in de HTML-versie geplaatst en de worker bewaart de verzonden HTML in het postvak.
- Een optionele LibreTranslate-container voor Nederlandse en Engelse vertaalconcepten is aan Node-02 toegevoegd. Publicatie blijft een bewuste handmatige actie.

## 2026-09-20 — Release-audit (niet uitgerold)

- De volledige Supabase-schematypen zijn vanuit productie gegenereerd; de TypeScript-controle is teruggebracht van 267 fouten naar nul en draait voortaan in de vaste CI-releasepoort.
- Ontbrekende UUID-validatie in Corporate Admin en veilige bestandsnamen voor GPX- en reisgidsdownloads zijn hersteld.
- Alle actuele release-, incident-, implementatie- en teststappen staan nu in één bestand: `IMPLEMENTATION_PENDING.md`; drie overlappende implementatiehandleidingen zijn verwijderd.
- De publieke websitechangelog is teruggebracht tot zes gegroepeerde productupdates en bevat geen onbewezen herstelclaims meer.
- De openbare roadmap vat afgeronde mogelijkheden voortaan samen in tien herkenbare productgroepen in plaats van een lange technische inventaris.
- De lokale functie- en releasecontrole, open incidenten, uitrol en praktijktests zijn samengevoegd in `IMPLEMENTATION_PENDING.md`; onbewezen productieproeven zijn niet als geslaagd gemarkeerd.
- De agenda-abonnementslink blijft zichtbaar en handmatig kopieerbaar als de browser de klembordactie weigert.
- Bestaande agendafeeds blijven geldig wanneer het opslaan van een vervangende link mislukt.
- Reis- en Agency-uitnodigingen tonen nu een waarschuwing als de mailwachtrij faalt en houden de persoonlijke link beschikbaar om zelf te delen.
- De formatter accepteert Windows-regelafbrekingen, zodat echte lintproblemen niet langer verdwijnen tussen duizenden CRLF-meldingen.
- Een nieuwe productiesmoketest controleert na uitrol de belangrijkste publieke pagina's, registratie, status en publieke merkbestanden; deze controle staat ook in Corporate Admin.
- Turnstile-controle op Contact heeft nu een vaste timeout en accepteert uitsluitend tokens die voor de contactactie zijn uitgegeven.
- Terugkeerlinks voor login, OAuth, magic links en herstelmail worden centraal genormaliseerd; externe en dubbelzinnige slash/backslash-URL's worden geweigerd.
- `npm run verify` bundelt lint, momenteel 78 regressietests, TypeScript, de beveiligingsaudit en syntaxiscontrole van worker, mailrelay en IMAP-sync; CI bouwt daarna aanvullend de productie-image.
- De releasepoort weigert nieuwe serverfuncties die `supabaseAdmin` zonder authenticatiemiddleware gebruiken, tenzij het publieke token- of CAPTCHA-pad expliciet is beoordeeld.
- De openbare reizenlijst gebruikt uitsluitend de begrensde publieke RPC; de oude brede service-role-fallback naar workspaces en profielen is verwijderd.

## 2026-09-20 — Betabetrouwbaarheid (uitrol en praktijktest open)

- Paddle herhaalt na een geregistreerd webhookevent alsnog de idempotente stap voor eenmalige toegang en refunds. Node-02 moet dezelfde price-ID's krijgen als Node-01.
- Rechtstreekse uitnodigingen veroorzaken geen tweede generieke uitnodigingsmail meer.
- Inkomende HTML-bedrijfsmail krijgt een aparte opslagkolom en een afgeschermde weergave. Uitgaande bedrijfsmail blijft HTML en platte tekst als normaal MIME-alternatief sturen.
- ICS-downloads gebruiken een gekoppeld DOM-element; activiteiten zonder eindtijd krijgen een uur en lange regels worden gevouwen. Serverfouten op live-agendafeeds worden gelogd en als 503 gemeld.
- Corporate Admin controleert mailboxconflicten vooraf en toont concretere medewerkerfouten.
- De publieke reispagina groepeert dagplanning en gedeelde boekingen per dag; keuzelijsten voor betalers passen ook met lange namen in smalle formulieren.
- Directe uitnodigingen zonder bekende profieltaal gebruiken Engels als standaard. HTML-servicemail toont losse alinea's; een expliciete Nederlandse voorkeur blijft geldig.
- GPX en Agency-klantkoppeling blijven open voor gerichte reproductie; de bijbehorende praktijkscenario's, inclusief Linux-build en typecontrole, staan in de Corporate Admin-releasechecklist.

## 2026-09-15 — Betaalkeuze, live agenda en gerichte reparaties

- Pro en Agency bieden nu een maandelijks abonnement en een eenmalige maand zonder automatische verlenging; Paddle bepaalt welke betaalmethoden in de checkout beschikbaar zijn.
- Eenmalige aankopen krijgen een controleerbare einddatum en verlopen automatisch, zonder de bestaande abonnementen te beïnvloeden.
- Reizigers kunnen naast een losse ICS-export een intrekbare, alleen-lezen agenda-abonnementslink maken.
- Discord-koppeling keert via een vaste OAuth-callback terug en vernieuwt de accountidentiteiten.
- GPX-export weigert lege routes duidelijk en downloadt geldige routepunten als echt bestand.
- De knop voor een nieuw bedrijfspostvak opent nu werkelijk een leeg formulier.
- Registratie voert zichtbaar de Turnstile-controle uit, geeft Supabase Auth de CAPTCHA-token en toont een blijvende foutmelding wanneer aanmaken of mailbezorging wordt geweigerd.

## 2026-09-15 — Paddle Billing technisch aangesloten

- Pro en Agency openen een echte Paddle Checkout met vaste, servergeleverde price-ID's.
- Paddle-webhooks worden op Node-02 tegen de ongewijzigde body en `Paddle-Signature` gecontroleerd en idempotent verwerkt.
- Alleen een geldige actieve of trialstatus kan betaalde workspace-rechten activeren; browsergestuurde planwijzigingen zijn afgesloten.
- De abonnements­pagina toont de werkelijke betaalperiode en opent Paddle Customer Portal voor facturen, betaalmethode en opzegging.
- Klanten zien hun laatste transacties en halen per klik een verse officiële Paddle-factuur op; tijdelijke factuurlinks worden niet als blijvende download gebruikt.
- Betaling, mislukte betaling, planwijziging, beëindiging en refund sturen een tweetalige HTML-servicemail en in-appmelding met een directe facturatieknop.
- Corporate Admin kan een volledige refund aanvragen, de reden auditen, creditstatus volgen en een gefaald webhookevent gecontroleerd opnieuw verwerken.
- De Sandbox- en productievariabelen, SQL-volgorde en acceptatiescenario's staan in een afzonderlijke Paddle-handleiding.

## 2026-09-15 — Postvakken en Agency-domeinen

- Corporate Admin koppelt een IMAP-postvak aan een persoonlijke gebruiker of gedeelde groep; wachtwoorden worden met AES-256-GCM versleuteld en nooit teruggestuurd naar de browser.
- De IMAP-worker gebruikt per postvak de gekoppelde inloggegevens en blijft voor bestaande adressen de centrale catch-all ondersteunen.
- Bedrijfsmail wordt als HTML en platte tekst verzonden met logo, actieknop en persoonlijke of gedeelde handtekening.
- Agency Admin toont de exacte CNAME- en TXT-records, controleert DNS en activeert pas daarna het eigen domein.
- Caddy vraagt een snelle, geïndexeerde toestemmingscontrole voordat voor een eigen domein een certificaat mag worden uitgegeven; herhaalde aanvragen worden begrensd.

## 2026-09-15 — Meldingen, uitnodigingen en accountherstel

- Nieuwe in-appmeldingen verschijnen direct rechtsboven; privacyantwoorden, contactverzoeken en binnenkomende bedrijfsmail gebruiken dit kanaal.
- Dezelfde reis- of Agency-uitnodigingslink kan nog maar één e-mailbezorging opleveren.
- Google en Discord kunnen weer handmatig vanuit Account worden gekoppeld.
- Corporate Admin kan na identiteitscontrole en met auditreden een verloren TOTP-factor herstellen.
- CSV, reisgids, ICS en GPX staan samen in de exportbalk en download-URL's blijven lang genoeg geldig.
- Overbodige secretvelden zijn uit mailboxbeheer verwijderd; een nieuw postvak is direct selecteerbaar voor rechtenbeheer.

## 2026-09-15 — Volwaardige bedrijfsmail

- Alle migraties en SQL-tests tot en met 1120 zijn door de eigenaar uitgevoerd en als voltooid vastgelegd.
- Persoonlijke en gedeelde mailboxen krijgen standaard een herkenbare handtekening met naam, GlobeTrotr, tagline, website en contactlink.
- Uitgaande bedrijfsmail gebruikt een responsieve HTML-opmaak met het GlobeTrotr-logo, een duidelijke CTA en een veilige platte-tekstvariant.
- Volledige uitgaande berichten worden voortaan ook in de verzonden conversatie opgeslagen.
- De losse OAuth-installatiehandleiding is verwijderd omdat Google en Discord volledig zijn ingesteld en werkend bevestigd.

## 2026-09-15 — Bedrijfsmail en productieacceptatie

- Bedrijfsmail leest ontvangen berichten via een afzonderlijke IMAP-worker op Node-02 en toont de volledige berichttekst in het portaal.
- Corporate Admin kan een medewerker per e-mail uitnodigen, een persoonlijke mailbox aanmaken en toegang tot gedeelde mailboxen beheren.
- Nieuwe mailboxen krijgen automatisch een GlobeTrotr-handtekening; bestaande aangepaste handtekeningen blijven behouden bij latere rechtenwijzigingen.
- De implementatiehandleiding is na uitvoering van migraties 1090–1120 doorgeschoven naar de eerstvolgende wijziging.

## 2026-09-14 23:55 CEST — Productietoegang, mail en privacy

- Google en Discord zijn de enige externe inlogproviders; passkeys en TOTP zijn vanuit Account te beheren.
- `/register` en beide uitnodigingslinks werken rechtstreeks door route-onafhankelijke parameters.
- De statuspagina werkt voor gasten en ingelogde gebruikers en toont Engelse componentnamen bij regionale Engelse taalinstellingen.
- Corporate Admin kan privacyverzoeken openen, bijwerken, beantwoorden en het gekoppelde gebruikersaccount openen; het antwoord verschijnt veilig in Account.
- Contactantwoorden openen de interne bedrijfsmailcomposer. Nieuwe gedeelde en persoonlijke mailboxen krijgen een standaardhandtekening.
- GPX-download, reisgidsdownload en kaartbegrenzing zijn robuuster; betaalverzoeken zijn gericht op gekoppelde reisaccounts.
- Agency-uitnodigingen nemen organisatienaam en accentkleur mee binnen de GlobeTrotr-mailstijl.
- De privacy- en cookie-informatie beschrijft de actieve Europese infrastructuur, ZXCS-mail, Turnstile, Google Search Console en browseropslag.
- Migraties 1090–1110 voegen de bijbehorende Corporate Admin-acceptatiecontroles toe.

## 2026-09-15 00:40 CEST — Privacy- en cookie-informatie voor productie

- De privacyverklaring beschrijft de actieve productieomgeving bij Hetzner, Europese Supabase-opslag en de mailbox- en SMTP-infrastructuur van ZXCS.
- Cloudflare Turnstile, Google en Discord zijn met hun minimale gegevensverwerking en mogelijke externe browseropslag opgenomen.
- De browseropslaginventaris vermeldt nu ook de functionele `sidebar_state`-cookie van zeven dagen en noodzakelijke Turnstile-beveiligingsgegevens.
- Verouderde tekst over een toekomstige hosting- en SMTP-omschakeling is vervangen door de huidige live situatie.
- Een afzonderlijke Corporate Admin-controle en SQL-acceptatietest dekken de uiteindelijke juridische productiecontrole.

## 2026-09-15 00:25 CEST — Accountkoppelingen en betrouwbare mailbezorging

- Account beheert de ondersteunde Google- en Discord-identiteiten; Facebook is uit het product en de actuele documentatie verwijderd.
- Reis- en Agency-uitnodigingen worden aan hun actuele mailbezorgstatus gekoppeld zonder geheime uitnodigingslinks op te slaan.
- Corporate Admin toont de laatste servicemails en kan een mislukte verzending gecontroleerd opnieuw aanbieden.
- OAuth-profielnamen worden uit meerdere veilige providergegevens genormaliseerd.
- Corporate Admin kan servicemail met een verplichte reden pauzeren of activeren; vastgehouden berichten worden daarbij atomair verwerkt en de wijziging wordt geaudit.
- Verlopen claims uit de service-, bedrijfs- en algemene workerwachtrij herstellen automatisch en stoppen na tien mislukte pogingen.
- SMTP-antwoorden leveren een bruikbare, begrensde foutcode op zonder ontvanger, inhoud of geheimen in de foutcode te verwerken.
- Migraties 1050–1070, regressietests, Corporate Admin-checks en een volledige implementatiehandleiding zijn toegevoegd.

## 2026-09-14 23:45 CEST — Herstel en inloggen zonder wachtwoord

- Het inlogscherm kan nu rechtstreeks een wachtwoordherstelmail of een eenmalige magic link aanvragen.
- Herstel toont geen informatie waarmee het bestaan van een account kan worden afgeleid en gebruikt de eigen GlobeTrotr-tokenroute.
- Een actuele implementatielijst groepeert resterend werk voor database, Supabase Auth, beide VPS'en en productacceptatie.
- Twee nieuwe Corporate Admin-controles dekken herstel en wachtwoordloos inloggen.

## 2026-09-14 23:30 CEST — Inloggen met Google en Discord

- Inloggen en registreren bieden nu Google en Discord naast e-mail, wachtwoord en passkey.
- OAuth bewaart een veilige interne terugkeerroute, zodat aanmelden vanuit een uitnodiging de gebruiker terugbrengt naar die uitnodiging.
- De privacyverklaring beschrijft welke minimale accountgegevens een gekozen loginprovider verwerkt en dat GlobeTrotr nooit het providerwachtwoord ontvangt.
- Een providerhandleiding en vijf gerichte Corporate Admin-acceptatiecontroles begeleiden de externe configuratie en identiteitstest.

## 2026-09-14 23:00 CEST — Eén herkenbare stijl voor iedere e-mail

- Registratie, wachtwoordherstel, e-mailwijziging en magic link hebben kant-en-klare Supabase Auth-templates met het eigen logo en de GlobeTrotr-tokenroute.
- Uitnodigingen en servicemeldingen uit de VPS-relay gebruiken dezelfde rustige kaartopmaak, primaire knop, contactlink en platte-tekstvariant.
- Markdown-links en ontsnapte HTML uit concepttemplates zijn vervangen door geldige, direct bruikbare e-mail-HTML.
- De Corporate Admin-testlijst bevat vijf afzonderlijke controles voor Auth-mail en visuele consistentie.

## 2026-09-14 22:00 CEST — Zelfstandige productie en uitnodigingsmail

- De Vite- en Nitro-build gebruikt geen Lovable-package of preview-authbroker meer en draait zelfstandig op de eigen VPS-infrastructuur.
- Reis- en Agency-uitnodigingen worden via de bestaande mail-outbox en beveiligde SMTP-relay verzonden, ook naar mensen zonder account en opnieuw na verlengen.
- De relay kiest Nederlandse of Engelse uitnodigingstekst, toont een veilige acceptatieknop en weigert externe actie-URL's.
- Alle aangeleverde GlobeTrotr-logo's zijn onder vaste openbare `/assets/brand/...`-paden beschikbaar; het e-maillogo behoudt zijn vaste adres.
- Migratie 1010 en de bijbehorende SQL-test voegen nullable uitnodigingskoppelingen en vier gerichte productiecontroles aan Corporate Admin toe.

## 2026-09-14 19:00 CEST — Productiemail, Auth en publieke reis afgerond

- Supabase Passkeys zijn in de browserclient geactiveerd en vanuit Account te beheren.
- Registratie heeft een eigen `/register`-route; de eigen tokenroute verwerkt Auth-links op `globetrotr.nl`.
- Accountinstellingen bevatten communicatievoorkeuren, terwijl verplichte account- en platformmail actief blijft.
- Het logo wordt als zelfstandige productieasset geleverd, inclusief openbaar e-maillogo.
- De openbare reispagina toont eerst acht bestemmingen en compactere reisonderdelen.
- Migratie `20260908100000_account_communication_preferences.sql` voegt acceptatiecontroles toe en koppelt voorkeuren aan de mailoutbox.

## 2026-09-14 15:00 CEST — Productie-uitrol over twee servers voorbereid

- De webapp en achtergrondworker hebben afzonderlijke Docker Compose-configuraties gekregen.
- Node-01 serveert de webapp via Caddy met automatische HTTPS; Node-02 draait uitsluitend de worker en publiceert zijn health-endpoint alleen op localhost.
- De Dockerfile bouwt afzonderlijke web- en worker-images en ontvangt publieke Vite-waarden expliciet tijdens de webbuild.
- `VPS_DEPLOYMENT.md` beschrijft DNS, secrets, firewall, installatie, healthchecks, updates en rollback voor beide Hetzner-nodes.
- De productiebuild is zonder fouten uitgevoerd. Compose-validatie volgt op een systeem waarop Docker beschikbaar is.
- De deploymentdocumentatie begrenst de eerste livegang tot het hoofddomein en beschrijft de veilige vervolgstappen voor Agency-subdomeinen en eigen domeinen via CNAME, TXT-verificatie en begrensde certificaatuitgifte.
- Zelf gehoste builds gebruiken nu expliciet Nitro's `node-server`-doel, zodat de webcontainer als blijvende HTTP-server draait; Lovable behoudt binnen zijn eigen buildomgeving het Cloudflare-doel.
- `globetrotr.nl` is de primaire URL voor website en app; `www` en `dashboard` sturen met behoud van het pad door naar hetzelfde domein.
- Node-02 bevat een interne, tokenbeveiligde HTTP-naar-SMTP-relay met afzenderbegrenzing, ontvangerslimieten, time-outs en healthcheck; SMTP-inloggegevens blijven buiten de worker en database.

Technisch wijzigingsoverzicht voor GitHub en beheerders. De publieke, gebruikersgerichte versie staat op `/changelog`.

Tijden gebruiken `Europe/Amsterdam` (CEST/CET). Nieuwe vermeldingen komen bovenaan. Noteer databasewijzigingen, benodigde migraties en uitgevoerde controles; zet geen secrets, persoonsgegevens of interne tokens in dit bestand.

## 2026-09-14 12:00 CEST — Onderhoud, privacyverzoeken en laatste acceptatievoorbereiding

- De productdemo gebruikt voortaan volledig fictieve reis- en persoonsnamen; de route-, dag-, paklijst- en verrekenbediening blijft interactief.
- Contact toont bij alle zelfhulplinks een herkenbaar icoon. Voor ingelogde beheerders volgen Status en Contact nu na Bedrijfsmail en Corporate Admin.
- De reisomslag staat in een eigen instellingenblok naast de algemene gegevens en vermeldt het aanbevolen formaat van 1600 × 900 pixels.
- Een automatisch bijwerkend Pro-agenda-abonnement is als afzonderlijke beveiligde vervolgfunctie gespecificeerd; de bestaande eenmalige ICS-export blijft beschikbaar.
- De 106 migraties hebben een volledige beginnerstutorial, klikbare productie-index en veilige `supabase db push`-procedure gekregen. De uitleg onderscheidt Supabase-beheerde Auth/Storage-tabellen van GlobeTrotr-profielen en workspaces; bestaande herstel- en securitymigraties blijven in hun bewezen volgorde behouden.
- Migratie `20260908099000_production_supabase_acceptance.sql` voegt vijf concrete controles voor het nieuwe EU-project, migraties, Auth/Storage, het eerste beheeraccount en de staging-scheiding toe aan Corporate Admin.
- Een productie-UI-audit heeft de mobiele Corporate Admin-navigatie ingeklapt, icoonknoppen vergroot, Engelse prijsvoordelen hersteld en verouderde migratiemeldingen vervangen door bruikbare foutteksten.
- Recensies sluiten weer met het juiste aanhalingsteken en de Engelse Corporate Admin-releasecheck toont nu werkelijk de Engelse labels en datumopmaak.
- Migratie `20260908097000_production_ui_acceptance.sql` en `production_ui_acceptance.sql` voegen de definitieve breedte-, touch- en NL/EN-tekstcontrole aan Corporate Admin toe.
- Migratie `20260908096000_pre_vps_release_gate.sql` en `pre_vps_release_gate.sql` zijn op 14 september 2026 zonder fouten uitgevoerd; de afsluitende controle bewaakt alle nieuwe checklistonderdelen, taak-RLS en de private omslagbucket.
- De printbare reisgids neemt de eigen omslagfoto mee wanneer die veilig voor de ingelogde gebruiker is geladen.
- Een reis heeft nu een gezamenlijke takenlijst met verantwoordelijke, deadline, afronden en verwijderen. Lezen en wijzigen worden in de serverlaag tegen het reis- of Agency-recht gecontroleerd.
- Migratie `20260908092000_trip_tasks.sql` en de rollbacktest `trip_tasks.sql` zijn op 14 september 2026 zonder fouten uitgevoerd.
- Het rustige scherm Vandaag brengt de actuele planning, boekingen, bestemming, weer, documentenroute en openstaande taken samen voor onderweg.
- Migratie `20260908093000_trip_today_acceptance.sql` en de bijbehorende acceptatietest zijn op 14 september 2026 zonder fouten uitgevoerd.
- De routekaart toont plaatsgebonden boekingen en daaraan gekoppelde uitgaven als herkenbare markers; kaartpop-ups ontsmetten alle ingevoerde tekst.
- Migratie `20260908094000_trip_map_layers_acceptance.sql` en de bijbehorende acceptatietest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Reizen ondersteunen een eigen omslagfoto in een private opslagbucket, met begrensde bestandstypen en omvang, toegangscontrole en directe weergave op reis en dashboard.
- Een bewust openbare reis krijgt de omslag uitsluitend na succesvolle controle van de openbare link via een kortlevende, server-side ondertekende URL.
- Migratie `20260908095000_trip_cover_photos.sql` en de rollbacktest `trip_cover_photos.sql` zijn op 14 september 2026 zonder fouten uitgevoerd.
- Het reisdashboard kan twee zichtbare reizen naast elkaar vergelijken op periode, bestemmingen, boekingen, budget, omgerekende uitgaven en routevolgorde.
- Migratie `20260908091000_trip_comparison_acceptance.sql` en de bijbehorende checklisttest zijn op 14 september 2026 zonder fouten uitgevoerd.
- De routekaart kan bestemmingen in volgorde als geldige GPX 1.1-route exporteren; namen en landen worden veilig als XML verwerkt.
- Reiseigenaren en planners kunnen de volledige bestemmingsvolgorde na bevestiging omkeren via de bestaande versiegestuurde opslag.
- Migratie `20260908090000_route_tools_acceptance.sql` en de bijbehorende checklisttest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Reiseigenaren kunnen een reis veilig dupliceren als private variant; planning en paklijst worden voorzien van nieuwe IDs en gevoelige samenwerking-, betaal- en deelgegevens worden niet gekopieerd.
- Migratie `20260908089000_trip_duplicate_acceptance.sql` en de bijbehorende checklisttest zijn op 14 september 2026 zonder fouten uitgevoerd.
- De publieke hoofdnavigatie is teruggebracht tot Home, Mogelijkheden, Prijzen en Contact; ingelogde gebruikers krijgen Contact en Status direct in het reisplatformmenu.
- De Over-pagina is herschreven als een langer, doorlopend oprichtersverhaal met minder losse kaarten en meer context over het ontstaan en de privacyvisie.
- De onderhoudspagina gebruikt een kleinere kop, legt de veiligheid van reisgegevens uit en groepeert reden, countdown en beheerderslogin overzichtelijk.
- Migratie `20260908088000_public_navigation_about_maintenance_acceptance.sql` en de bijbehorende checklisttest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Geld-tools tonen nu reisstatistieken, uitgaven per categorie, het werkelijke daggemiddelde en een budgetprognose zonder externe provider.
- Migratie `20260908087000_trip_insights_acceptance.sql` en de bijbehorende checklisttest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Corporate Admin heeft een overzichtelijke Governance-indeling voor onderhoud, privacy, incidenten en gecontroleerde uitrol.
- Onderhoud kan met een Nederlandse en Engelse reden, begin- en eindtijd worden gepubliceerd. Gewone bezoekers zien een aftellende onderhoudspagina met toegang tot inloggen; Corporate Admins kunnen doorwerken.
- Ingelogde gebruikers kunnen vanuit hun account een privacyverzoek indienen, de actuele status en antwoordtermijn volgen en Corporate Admin kan dit in dezelfde privacy-inbox behandelen.
- Bestemmingszoekopdrachten lopen via de serverlaag, zodat de externe provider het IP-adres van het gebruikersapparaat niet ontvangt. De privacyverklaring beschrijft deze bestaande werkwijze.
- Contact en Status staan in de publieke hoofdnavigatie, profielfoto's behouden hun verhouding en de homepage legt het verschil voor en na GlobeTrotr concreter uit.
- Recensiebeheer accepteert Corporate Admins met content- of operationeel recht, toont invoergrenzen en geeft bruikbare foutmeldingen.
- De offerte-isolatietest geeft de tijdelijke fixture expliciet leesrecht als `authenticated`; de productiepolicy blijft afgeschermd.
- Migratie `20260908083000_maintenance_privacy_and_acceptance.sql` en de bijbehorende rollbacktest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Nieuwe feedback informeert actieve Corporate Admins. Beheerders kunnen een veilige antwoordthread gebruiken; iedere nieuwe reactie informeert de feedbackindiener zonder de inhoud openbaar te maken.
- Hoge en kritieke bekende problemen geven een gebundelde beheermelding die automatisch sluit wanneer het probleem wordt opgelost of gearchiveerd.
- Migratie `20260908084000_feedback_conversations_and_admin_alerts.sql` en de bijbehorende rollbacktest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Migratie `20260908085000_account_security_acceptance.sql` en de bijbehorende acceptatietest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Reizigers kunnen dagplanning en boekingen vanuit de reisinstellingen als `.ics`-agenda exporteren.
- Migratie `20260908086000_calendar_export_acceptance.sql` en de bijbehorende acceptatietest zijn op 14 september 2026 zonder fouten uitgevoerd.
- Corporate Admin bevat een aparte moderatielijst voor openbare reizen. Depubliceren, archiveren en herstellen vereist een reden, informeert de eigenaar en schrijft de actor naar de auditlog.
- Het meldingenbeheer toont een bezorgoverzicht per gebeurtenistype met verzonden, open en afgesloten in-appmeldingen; inzage wordt geaudit.
- De belangrijkste publieke routes hebben eigen canonical-URL's en social previews; Over en Prijzen leveren aanvullende structured data voor zoekmachines.
- De productiebuild is gecontroleerd: routepagina's en zware kaart-, grafiek- en Supabasebibliotheken worden als afzonderlijke chunks geladen.

## 2026-09-14 00:08 CEST — Privacy, dynamische website en rustigere reisschermen

- De kritieke cross-workspace RLS-fout bij Agency-offertevarianten is gesloten; alleen leden met `trips_view` binnen de juiste workspace kunnen prijzen lezen.
- Onnodige `authenticated`-rechten op openbare `SECURITY DEFINER`-RPC's zijn ingetrokken. De bewust anonieme, veldbeperkte publieksfuncties blijven met een expliciete allowlist en regressietest bewaakt.
- Bestaande bescherming tegen spreadsheetformules, ingelogde vluchtquota en directe inzage in leden-e-mails is opnieuw in de securitytest vastgelegd.
- De homepage toont actuele openbare reizen en legt de Europese opslag, Duitse applicatieservers en persoonlijke privacycontrole concreet uit. Contact staat in de hoofdnavigatie.
- De Over-pagina combineert het oprichtersverhaal met controleerbare feiten en productstatussen zonder verzonnen percentages.
- Reisinstellingen zijn opgesplitst per onderwerp, de planningseditor scheidt boekingen van dagplanning en uitgaven kunnen op tekst, categorie en betaler worden gefilterd.
- Corporate Admin kan via een provider-neutrale serverkoppeling een Engels vertaalconcept maken; publicatie blijft een bewuste handmatige actie.
- Migraties `20260908078000` tot en met `20260908082000` en hun nieuwe SQL-regressietests staan klaar voor uitvoering.
- Alle 34 applicatietests en de client- en serverproductiebuild slagen.

## 2026-09-13 23:52 CEST — Governance, Agency-inzicht en publieke vindbaarheid

- De publieke site bevat een sitemap, zoekmachine-instructies en uitgebreidere algemene metadata; routespecifieke canonical-URL's, previews en structured data blijven onderdeel van de laatste webcontrole.
- Corporate Admin krijgt één governancepagina voor gecontroleerde featureflags, privacyverzoeken met wettelijke deadline en interne incidentregistratie.
- Wijzigingen aan featureflags, privacyverzoeken en incidenten worden met actor en context in de bestaande auditlog vastgelegd; de nieuwe tabellen zijn uitsluitend via de serverlaag bereikbaar.
- Agency Admin krijgt rapportage voor klanten, reizen, offerteconversie, geaccepteerde offertewaarde, werkvoorraad en declarabele kosten.
- Bevoegde Agency-planners kunnen afzonderlijke herinneringstermijnen instellen voor taken, offertes en documenten. De bestaande onderhoudstaak past deze instellingen toe zodra de dagelijkse VPS-planning actief is.
- Migraties `20260908078000_corporate_governance.sql`, `20260908079000_agency_reporting_and_automation.sql` en `20260908080000_apply_agency_automation_settings.sql` plus drie rollbacktests staan klaar voor uitvoering.
- De 34 applicatietests en de client- en serverproductiebuild slagen.

## 2026-09-13 23:06 CEST — Duidelijke productreis en actuele beta-informatie

- De lange publieke linklijst is verdeeld over Product, Bedrijf, Transparantie en juridische informatie.
- Een contactpagina bewaart berichten server-side en vereist in productie een geldige Turnstile-configuratie; een verborgen spamveld biedt aanvullende filtering.
- Corporate Admin bevat een afgeschermde contactinbox met zoeken, statusfilters, berichtdetail, beantwoordsnelkoppeling en geaudite statuswijzigingen.
- Homepage, Demo en Mogelijkheden hebben ieder een eigen doel gekregen: kennismaken, interactief proberen en functies volledig nalopen.
- De prijspagina legt per plan uit voor wie het bedoeld is, vergelijkt de belangrijkste mogelijkheden en toont correcte europrijzen.
- De Over-pagina bevat naast het oprichtersverhaal ook productprincipes en transparante ingangen naar roadmap en feedback.
- De publieke roadmap toont alleen toekomstig werk; afgeronde stappen blijven terug te vinden in Wat is er nieuw.
- Contact ondersteunt gerichte vragen, technische hulp, feedback, klachten, privacy, betalingen en Agency; het terugbetalingsbeleid geldt nu expliciet voor actieve betaalde Paddle-abonnementen.
- De voorwaarden zijn voorbereid op een publieke beta met Free- en betalende abonnementen en verwijzen voor betaling, belasting, bewijs en terugbetaling naar Paddle als Merchant of Record.
- De Corporate Admin-releasechecklist bevat afzonderlijke controles voor navigatie, recensies, commerciële pagina's, contact en gecontroleerde vertaalconcepten.
- De homepage is teruggebracht tot één heldere productbelofte met een logische route van plannen naar boekingen en kostenverdeling; herhaalde featureblokken en de statische voorbeeldkaart zijn verwijderd.
- De homepage en aparte demopagina gebruiken dezelfde interactieve Scandinavië-reis met werkende route-, boekings-, dagplanning-, paklijst- en verrekenacties.
- Het oprichtersverhaal en de ingangen voor groepsreizen en Agencies blijven onderdeel van de korte kooproute zonder verzonnen recensies of gebruikscijfers.
- Corporate Admin bevat recensiebeheer met NL/EN-tekst, optionele waardering, publicatie, volgorde en archief; de homepage toont uitsluitend expliciet gepubliceerde recensies.
- De openbare beta-status en bekende-problemenmigratie noemen de werkelijk ontbrekende OAuth-, automatische e-mail-, Paddle- en Agency-domeinkoppelingen; de opgeloste uitnodigingsbeperking wordt gearchiveerd.
- De interne en publieke roadmap onderscheiden uitgevoerde migraties en SQL-tests voortaan van de nog openstaande praktische productcontrole.
- De blijvende Corporate Admin-releasecheck is opgesplitst in concrete scenario's en gegroepeerd per productonderdeel, met voortgang per categorie en over de volledige acceptatietest.

## 2026-09-13 22:27 CEST — Stabiliteit, presentatie en beheer

- De Engelstalige en Nederlandse openbare reisroutes lezen hun parameters nu route-onafhankelijk; onvolledige oudere RPC-resultaten krijgen veilige lege standaardwaarden.
- Relationele reizen zijn ook bij een lege lijst de bron van waarheid, waardoor verwijderde oude JSON-reizen niet meer uit lokale of workspacecache terugkeren.
- Een wijziging van Agency naar Pro of Free zet de zichtbare branding direct terug naar GlobeTrotr.
- De Agency-navigatie bevat Leveranciers eenmaal. Corporate Admin gebruikt op desktop een vaste zijbalk en op mobiel een ombrekend raster zonder lange horizontale scrollbar.
- De OpenStreetMap-laag wordt in dark mode gedempt, terwijl markeringen en routekleuren helder blijven.
- De homepage bevat concrete praktijkvoorbeelden en het oprichtersverhaal met foto; bestaande productfuncties blijven direct via de interactieve demo bereikbaar.
- Privacyverklaring, privacykeuzes en betavoorwaarden hebben herkenbare pictogrammen en Over GlobeTrotr staat in de primaire publieke navigatie.
- De zichtbare bronbestanden zijn gecontroleerd op kapotte UTF-8-sequenties en zijn opgeschoond.
- De productieconfiguratie documenteert nu ook SUPABASE_PUBLISHABLE_KEY, nodig voor openbare database-RPC’s op de VPS.
- De projecttests en productiebuild slagen.

## 2026-09-12 12:52 CEST — Platformstatus, infrastructuurbeheer en releasecontrole

- `/status` toont publiek alleen veilige componentstatussen en reactietijden; interne adressen en beheerdata blijven afgeschermd.
- `/about` vertelt het oprichtersverhaal in Nederlands en Engels met de geoptimaliseerde aangeleverde foto.
- Corporate Admin beheert de twee VPS-records, publieke SSH-sleutels en host-key-fingerprints, maar weigert private sleutels.
- Weer-, vlucht- en routequota kunnen met verplichte reden per workspace of gebruiker worden gereset en iedere actie komt in de auditlog.
- Een persistente releasechecklist ondersteunt de volledige implementatie- en praktijktest; migratie `20260908066000_platform_operations_and_release_checklist.sql` en de bijbehorende SQL-test staan klaar.
- `npm test` slaagt met 34 tests en `npm run build` levert de volledige client- en serverbuild zonder fouten op.
- Corporate Admin bevat nu ook de bedrijfsbasis voor statistieken, verkoopfacturen en gedeelde of persoonlijke `@globetrotr.nl`-mailboxen met eigen handtekeningen.
- De database bewaart uitsluitend verwijzingen naar IMAP- en SMTP-secrets; daadwerkelijke wachtwoorden blijven op de VPS. Inboxsync en Paddle-facturen worden pas na providerconfiguratie actief.
- Medewerkers krijgen een eigen mailboxscherm met gedeelde of persoonlijke inboxen, lees- en antwoordrechten, berichtdetail, archiveren, beantwoorden en een afgeschermde uitgaande testwachtrij.
- De Node-worker claimt bedrijfsberichten uitsluitend in live-modus, verzendt via de afgeschermde relay, registreert een verzonden kopie en verwerkt fouten met begrensde retries zonder berichtinhoud te loggen.
- De financiële bedrijfslaag bevat een afgeschermd Paddle-klaar model voor klanten, abonnementen, transacties en idempotente webhookevents, plus MRR, netto-omzet, refunds, achterstanden en factuurdetail in Corporate Admin.
- Corporate Admin beheert GlobeTrotr-medewerkers met functie, eigenaar-, admin- of supportrol en afzonderlijke rechten voor gebruikers, Agencies, financiën, mail, operatie en issues; persoonlijke adressen volgen `eersteletter.achternaam@globetrotr.nl`.
- Een beheerder kan zichzelf of de laatste actieve eigenaar niet uitschakelen; rol- en mailboxwijzigingen vereisen een reden, actualiseren de Auth-claim en worden geaudit.
- De Corporate Admin-navigatie volgt nu de afzonderlijke bedrijfsrechten; infrastructuur- en quotafuncties dwingen het operationele recht ook server-side af.
- Medewerkers tonen hun recente rechtenhistorie. Deactivatie, promotie tot eigenaar en quota-reset vragen een extra bevestiging.
- Auditregels zijn doorzoekbaar en filterbaar; het gefilterde auditresultaat, omzetreeksen en factuuroverzichten kunnen formuleveilig als CSV worden geëxporteerd.
- De geplande-meldingen-test voegt de automatisch geregistreerde workspace-eigenaar niet langer dubbel toe. De securitytest erkent de doelbewust openbare platformstatus-RPC voor anonieme en ingelogde bezoekers.

## 2026-09-12 12:10 CEST — Providerquota, workerwachtrij en draagbare opslag

- Free, Pro en Agency hebben centrale, testbare dagbudgetten voor weer-, vlucht- en routeaanvragen; betaalde plannen krijgen aantoonbaar meer ruimte.
- Een service-role-only providerstop kan een externe dienst direct uitschakelen zonder nieuwe applicatiebuild.
- De PostgreSQL-workerwachtrij voorkomt dubbele opdrachten, ondersteunt meerdere workers met `SKIP LOCKED` en plant mislukte opdrachten met begrensde back-off opnieuw in.
- Het opslagbesluit en migratiepad zijn vastgelegd: private bestanden blijven eerst in Supabase Storage, terwijl nieuwe servercode provider, bucket en objectsleutel gescheiden behandelt voor een latere overstap naar Hetzner S3.
- `20260908065000_provider_quotas_and_worker_queue.sql` en `provider_quotas_and_worker_queue.sql` staan klaar voor latere uitvoering.
- Ingelogde weer- en vluchtverzoeken gebruiken het planbudget uit deze centrale laag; het bestaande striktere uurquotum voor vluchtinformatie blijft daarnaast actief.
- De eerste Node 24-worker, containerbuild en tweeservice-Compose-configuratie zijn toegevoegd met healthcheck, veilige technische logging en een afgeschermde mail-relaygrens.
- Corporate Admin toont providergebruik, mislukte workerjobs en providerstops met verplichte reden en volledige auditregistratie.

## 2026-09-12 12:30 CEST — E-mailwachtrij in veilige testmodus

- Transactionele account-, toegang-, uitnodigings-, platform- en verrekeningsmeldingen worden idempotent als compacte mailopdracht klaargezet.
- De standaardmodus `test` houdt iedere opdracht vast; de claimfunctie levert pas werk nadat productiebeheer expliciet `live` activeert.
- Browserrollen hebben geen toegang tot de wachtrij of workerfunctie en e-mailinhoud wordt bij rendering tegen HTML-injectie beschermd.
- De daadwerkelijke SMTP-adapter, secretkoppeling en verzending worden pas op de Ubuntu-VPS geactiveerd.

## 2026-09-12 12:15 CEST — Agency-domeinen en mail voorbereid

- Agency-eigenaren kunnen een gereserveerd subdomein, optioneel eigen domein en mailafzender configureren.
- Unieke claims, gereserveerde platformnamen, verificatietokens en statussen worden in de database bewaakt.
- SMTP-wachtwoorden worden bewust niet opgeslagen; de database bevat later uitsluitend een verwijzing naar een versleuteld VPS-secret.
- Wildcard-routing, DNS-verificatie, TLS-uitgifte en daadwerkelijke SMTP-connectiviteit worden tijdens de VPS-implementatie geactiveerd.

## 2026-09-12 11:55 CEST — Agency-leveranciersbibliotheek

- Agencies kunnen accommodaties, vervoerders en activiteiten centraal opslaan, zoeken, wijzigen, archiveren en herstellen.
- Contactpersoon, website, boekingsvoorwaarden, commissie en interne notities blijven strikt aan de Agency-workspace gebonden.
- Leveranciers kunnen aan meerdere reizen uit dezelfde workspace worden gekoppeld; een databasetrigger blokkeert koppelingen over workspacegrenzen.
- Alleen Agency-gebruikers met planningsrecht kunnen wijzigen. Lezen vereist reis-inzagerecht en alle wijzigingen verschijnen in de Agency-auditlog.
- `20260908062000_agency_suppliers.sql` en `agency_suppliers.sql` staan klaar voor uitvoering.

## 2026-09-12 11:45 CEST — Meldingsvoorkeuren per reis

- Iedere deelnemer kan in de reisinstellingen afzonderlijk kiezen voor meldingen over planning, boekingen, uitgaven, documenten en toekomstige vluchtalerts.
- De database past deze voorkeuren toe bij het aanmaken en bijwerken van meldingen; bestaande openstaande meldingen uit een uitgeschakelde categorie worden direct gesloten.
- Uitnodigingen, toegangs- en beveiligingswijzigingen, platformmeldingen en betaalverzoeken blijven verplicht en kunnen niet via deze voorkeuren worden uitgeschakeld.
- De RPC controleert dat de gebruiker werkelijk eigenaar, actief reislid of actief Agency-teamlid van de reis is. Browserrollen hebben geen directe toegang tot de voorkeurentabel.
- `20260908061000_trip_notification_preferences.sql` en `trip_notification_preferences.sql` staan klaar voor uitvoering.

## 2026-09-12 11:40 CEST — Persistente verrekeningsrondes

- De slimme verrekening kan berekende overboekingen nu als betaalverzoeken publiceren en de volledige ronde expliciet afronden.
- `trip_settlement_requests` bewaart uitsluitend gekoppelde accountpartijen, begrensde namen, bedrag, valuta en status; browserrollen krijgen geen directe tabeltoegang.
- De servicefunctie controleert reis- of Agency-financerechten, sluit oudere open verzoeken en maakt gerichte, tweetalige meldingen.
- Nieuwe serveractie en knoppen zijn toegevoegd aan de bestaande verrekeningskaart.
- `20260908060000_trip_settlement_notifications.sql` en `trip_settlement_notifications.sql` staan klaar voor uitvoering.

## 2026-09-12 09:55 CEST — Publieke website en geplande meldingen

- Nieuwe publieke pagina's voor demo, reizigers, groepen, Agencies en support, met vaste Engelstalige routes voor features, pricing, updates, bekende problemen, beta en juridische informatie.
- De publieke header en footer leiden nu naar de nieuwe structuur. Bestaande Nederlandse URL's en oude deel- en uitnodigingslinks krijgen productie-redirects; `sitemap.xml` en de robots-verwijzing zijn toegevoegd.
- `20260908059000_scheduled_notification_maintenance.sql` sluit verlopen uitnodigingsacties en maakt gebundelde herinneringen voor taken, documenten en offertes. De functie is alleen uitvoerbaar met de service-role en klaar voor een dagelijkse cronjob.
- `scheduled_notification_maintenance.sql` controleert verlopen uitnodigingen, taakdeadlines en documentverval in een teruggedraaide testtransactie.
- Productiebuild is succesvol uitgevoerd. Migraties `20260908058000` en `20260908059000` met hun tests moeten nog in Supabase worden uitgevoerd.

## 2026-09-12 09:44 CEST — Notificaties integraal afgerond en gecontroleerd

- Boekingen, vluchtstatus en uitgaven krijgen afzonderlijke, vertaalde en per reis gebundelde meldingen; alleen rollen die de betreffende inhoud mogen zien worden ontvanger.
- Snapshotopslag vergelijkt de werkelijke inhoud vóór en na opslag. De interne verwijder- en herplaatsstappen veroorzaken geen losse meldingen en documenten leveren niet langer tegelijk een algemene reisupdate op.
- Profielwijzigingen, abonnementswijzigingen, gegevensexports en Corporate accountblokkade of herstel hebben nu herkenbare NL/EN-meldingen met stabiele deduplicatiesleutels.
- Nieuwe reisuitnodigingen zijn ook voor Engelstalige accounts volledig vertaald en bevatten alleen de begrensde reisnaam, zonder e-mailadres of uitnodigingstoken.
- `notification_system_audit.sql` controleert RLS, browserrechten, alle meldingstypen, verplichte triggers en de service-role-only actorbewuste opslagfunctie in één laatste structurele audit.
- `20260908057000_important_trip_notifications.sql` en de bijbehorende test zijn door de beheerder succesvol uitgevoerd. `20260908058000_trip_content_notifications.sql`, `trip_content_notifications.sql` en `notification_system_audit.sql` staan klaar voor uitvoering.

## 2026-09-12 09:34 CEST — Belangrijke reiswijzigingen herkenbaar gemeld

- Wijzigingen aan reisdata, bestemmingen, openbare status, toegangscode en gedeelde financiën krijgen één afzonderlijke, vertaalde melding per reis.
- De server geeft de werkelijk ingelogde uitvoerder door aan de database, zodat ook wijzigingen door een bevoegd Agency-teamlid niet ten onrechte aan de eigenaar worden toegeschreven.
- De uitvoerder wordt overgeslagen, persoonlijke Agency-voorkeuren blijven gelden en algemene reisupdates worden bij deze gebeurtenissen niet dubbel aangemaakt.
- `20260908055000_restore_public_function_grants.sql`, de vier herstelde regressietests, `20260908056000_trip_access_notifications.sql` en `trip_access_notifications.sql` zijn door de beheerder succesvol uitgevoerd.
- Migratie `20260908057000_important_trip_notifications.sql` en rollbacktest `important_trip_notifications.sql` zijn op 12 september 2026 succesvol uitgevoerd.

## 2026-09-12 09:30 CEST — Reisrollen en ingetrokken uitnodigingen gemeld

- Een gekoppeld reisaccount krijgt een eigen vertaalde melding wanneer de reisrol of deelnamestatus verandert.
- Bij intrekken wordt de oude uitnodigingsactie direct gesloten en krijgt een bestaand account een duidelijke melding dat de uitnodiging niet meer geldig is.
- Vernieuwen roteert de link en heropent precies één bestaande uitnodigingsmelding met de nieuwe geldigheidsduur.
- Meldingsteksten bevatten alleen de begrensde reisnaam en de nieuwe rol of status; uitnodigingstokens en e-mailadressen worden niet opgenomen.
- Migratie `20260908056000_trip_access_notifications.sql` en rollbacktest `trip_access_notifications.sql` zijn op 12 september 2026 succesvol uitgevoerd.

## 2026-09-12 09:26 CEST — Implementatiestatus en regressietests hersteld

- De Agency-reeks tot en met `20260908054000_agency_quote_lifecycle.sql` is als uitgevoerd en gepusht vastgelegd; `TEST_CHECKLIST.md` bevat één praktische controlelijst voor de volledige beta.
- Drie regressietests gebruiken nu uitsluitend hun eigen tijdelijke workspace of herkenbare testregels en blijven daardoor correct wanneer productie al auditregels, workspaceleden of bekende problemen bevat.
- `security_hardening.sql` rapporteert voortaan de exacte onverwacht uitvoerbare functie in plaats van alleen een algemene foutmelding.
- Migratie `20260908055000_restore_public_function_grants.sql` trekt opnieuw toegekende `authenticated`-rechten op de publieke reis- en branding-RPC in; de server blijft deze routes met de anonieme publicatieclient gebruiken.
- Deze aanvullende migratie en de vier herstelde tests zijn op 12 september 2026 succesvol uitgevoerd.

## 2026-09-12 00:14 CEST — Offertecyclus gemeld en geaudit

- Delen, vernieuwen en intrekken van een offertelink informeren andere bevoegde teamleden met één actuele, vertaalde offertemelding.
- Offertes opslaan controleert nu ook in de database het vereiste planningsrecht en blokkeert wijzigingen aan definitief beantwoorde offertes.
- Aanmaak, wijziging, delen en vernieuwen vullen de bestaande auditregels voor antwoorden, intrekken en converteren aan tot een volledige beheerhistorie.
- Auditregels en meldingen bevatten geen deeltoken, klantnotitie of contactgegevens.
- Migratie `20260908054000_agency_quote_lifecycle.sql` en rollbacktest `agency_quote_lifecycle.sql` staan klaar voor de latere implementatieronde.

## 2026-09-12 00:10 CEST — Gerichte meldingen bij Agency-klanten

- Toevoegen, bijwerken, koppelen, ontkoppelen, archiveren en herstellen van een Agency-klant levert één actuele `agency_client`-melding per klant op.
- Alleen de Agency-eigenaar en actieve medewerkers met klantbeheerrecht ontvangen de melding; de uitvoerder wordt overgeslagen.
- De persoonlijke voorkeur `client_updates` wordt gerespecteerd en de melding bevat alleen een begrensde klant- en eventuele reisnaam.
- Migratie `20260908053000_agency_client_notifications.sql` en rollbacktest `agency_client_notifications.sql` staan klaar voor de latere implementatieronde.

## 2026-09-12 00:06 CEST — Meldingen bij reisdocumenten

- Toevoegen, verwijderen, categoriseren en wijzigen van een documentvervaldatum levert een vertaalde, gebundelde `trip_document`-melding op.
- Ontvangers worden afgeleid uit eigenaar, actieve reisleden en bevoegde Agency-teamleden; de uitvoerder wordt uitgesloten.
- Bestaande Agency-voorkeuren voor reiswijzigingen kunnen deze informatieve meldingen onderdrukken.
- Meldingen bevatten uitsluitend de begrensde bestandsnaam, actie en eventuele vervaldatum, zonder opslagpad of documentinhoud.
- Migratie `20260908052000_trip_document_notifications.sql` en rollbacktest `trip_document_notifications.sql` staan klaar voor de latere implementatieronde.

## 2026-09-12 00:02 CEST — Atomaire Agency-taakmeldingen

- Taaktoewijzing, overdracht, status en deadline informeren de betrokken uitvoerder met een vertaalde `agency_task`-melding.
- Bij overdracht ontvangen de vorige en nieuwe uitvoerder ieder de juiste context; de gebruiker die de wijziging zelf uitvoert krijgt geen overbodige melding.
- Een stabiele gebeurtenissleutel houdt per taak één actuele openstaande melding en heropent die na een nieuwe relevante wijziging.
- De eerdere losse melding vanuit de serveractie is verwijderd; een databasetrigger verwerkt taak en melding nu atomair.
- Migratie `20260908051000_agency_task_notifications.sql` en rollbacktest `agency_task_notifications.sql` staan klaar voor de latere implementatieronde.

## 2026-09-12 00:00 CEST — Meldingen bij Agency-huisstijl

- Inhoudelijke wijzigingen aan centrale Agency-instellingen en huisstijl informeren uitsluitend andere actieve gebruikers met `branding_manage`.
- Nieuwe of gewijzigde huisstijl per reis krijgt een eigen gebundelde melding met de betreffende reisnaam.
- De uitvoerder ontvangt geen overbodige melding en wijzigingen die alleen het opslagtijdstip raken veroorzaken geen melding.
- Databasetriggers bewaren de wijziging en melding binnen dezelfde transactie, ongeacht welke beheerinterface later wordt gebruikt.
- Migratie `20260908050000_agency_branding_notifications.sql` en rollbacktest `agency_branding_notifications.sql` staan klaar voor de latere implementatieronde.

## 2026-09-11 23:58 CEST — Meldingen bij Agency-rollen en rechten

- Rolwijzigingen en persoonlijke rechtenwijzigingen informeren het betrokken teamlid met een vertaalde `agency_access`-melding.
- Een wijziging aan de standaardrechten van adviseurs of finance informeert uitsluitend actieve medewerkers met die rol.
- Stabiele gebeurtenissleutels bundelen herhaalde wijzigingen en maken een eerder weggeklikte melding bij een nieuwe wijziging opnieuw zichtbaar.
- De rechtenwijziging en melding worden binnen dezelfde databasefunctie opgeslagen.
- Migratie `20260908049000_agency_access_notifications.sql` en rollbacktest `agency_access_notifications.sql` staan klaar voor de latere implementatieronde.

## 2026-09-11 23:54 CEST — Beheer van Agency-offertelinks

- Agency Admin toont nu de vervaldatum van een actieve offertelink.
- Veilig vernieuwen genereert een nieuw willekeurig token en maakt de oude link onmiddellijk ongeldig.
- Een bevoegde medewerker kan een link na bevestiging direct intrekken; tokenhash en deeltijden worden samen gewist.
- Intrekken is herhaalveilig en wordt met de uitvoerende gebruiker in de Agency-auditlog vastgelegd.
- Migratie `20260908048000_manage_agency_quote_shares.sql` en rollbacktest `agency_quote_share_management.sql` staan klaar voor de latere implementatieronde.

## 2026-09-11 23:49 CEST — Geaccepteerde Agency-offerte omzetten

- Een aparte controlepagina toont klant, gekozen variant, bedrag en de uiteindelijke reis voordat een geaccepteerde offerte wordt omgezet.
- Zonder gekoppelde reis maakt de flow precies één nieuwe privéreis met gecontroleerde naam, datums, type en het geaccepteerde offertebedrag als budget.
- Bij een bestaande reis legt de flow alleen de offerte- en klantkoppeling vast; planning, boekingen en uitgaven blijven intact.
- De conversie is transactioneel en herhaalveilig, verleent een bestaand klantaccount zo nodig toegang, informeert het Agency-team en schrijft de actor naar de auditlog.
- Migratie `20260908047000_convert_agency_quotes.sql` en rollbacktest `agency_quote_conversion.sql` staan klaar voor de latere implementatieronde.

## 2026-09-11 23:47 CEST — Klantrespons op Agency-offertes

- Een klant kan precies één offertevariant accepteren of de volledige offerte afwijzen, met een optionele opmerking tot 500 tekens.
- De eerste geldige respons wordt atomair vastgelegd; dubbel klikken, vernieuwen of een tweede keuze wijzigt de uitkomst niet.
- De openbare offertepagina toont na antwoorden een duidelijke bevestiging in Nederlands of Engels.
- Actieve Agency-teamleden krijgen één gebundelde en vertaalde offertemelding; de respons komt zonder fictieve gebruiker in de append-only auditlog.
- Migratie `20260908046000_agency_quote_responses.sql` en rollbacktest `agency_quote_responses.sql` staan klaar voor de implementatieronde.

## 2026-09-11 23:40 CEST — Roadmap opgeschoond en notificaties uitgewerkt

- De private roadmap is teruggebracht van bijna negenhonderd regels naar één actuele productroadmap met een korte bouwvolgorde, gegroepeerde prioriteiten en een apart implementatieoverzicht.
- Afgeronde dagtests en herhaalde historische plannen zijn verwijderd; de uitgevoerde geschiedenis blijft in dit changelog bewaard.
- Volledige notificatiedekking is als P0 uitgewerkt voor accounts, reiswijzigingen, uitnodigingen, rollen, blokkades, boekingen, uitgaven, documenten, Agency, offertes, feedback en platformbeheer.
- De notificatieregels leggen ontvangers, deduplicatie, verplichte veiligheidsmeldingen, persoonlijke voorkeuren, vertaling, veilige links en de latere koppeling met SMTP vast.
- De publieke roadmap vermeldt gerichte, gebundelde meldingen en voorkeuren per reis en onderwerp als komende verbetering.

## 2026-09-11 23:36 CEST — Veilige klantweergave voor Agency-offertes

- Een deelklare offerte kan vanuit Agency Admin een nieuwe, veertien dagen geldige klantlink krijgen.
- Alleen de SHA-256-hash van het willekeurige token wordt opgeslagen; een nieuwe link maakt een eerder exemplaar ongeldig.
- De publieke route `/quote/:token` toont uitsluitend de offertevarianten, bedragen, geldigheid, klant- en reisnaam en openbare Agency-huisstijl.
- Concepten, geannuleerde, afgeronde en verlopen offertes worden niet via de link vrijgegeven.
- Migratie `20260908045000_secure_agency_quote_sharing.sql` en rollbacktest `agency_quote_sharing.sql` staan klaar voor de latere implementatieronde.
- Accepteren of afwijzen is bewust nog niet aan deze leesstap gekoppeld en volgt als afzonderlijke atomaire responsstroom.

## 2026-09-11 19:20 CEST — Nieuwe publieke website ingepland

- De private en publieke roadmap bevatten nu de volledige herbouw van de GlobeTrotr-homepage en marketingwebsite.
- De scope omvat afzonderlijke pagina's voor reizigers, groepen en Agencies, een interactieve productdemo, een nieuwe navigatie en een duidelijke productpresentatie.
- Alle publieke routes krijgen Engelstalige slugs. Bestaande Nederlandse URL's blijven via permanente redirects werken, zodat gedeelde reizen, uitnodigingen en bestaande links niet breken.
- De resterende bouwvolgorde is aangescherpt: offerte delen en beantwoorden, offerteconversie, publieke website, leveranciers, productiecontrole, VPS-portabiliteit en daarna SMTP en Paddle.

## 2026-09-11 19:09 CEST — Roadmaps en implementatievolgorde gelijkgetrokken

- De interne roadmap begint nu met één concrete bouwvolgorde van offerteacceptatie tot VPS, SMTP en Paddle.
- De grens tussen gebouwd en geïmplementeerd is expliciet gemaakt; migraties `39000` t/m `44000` blijven open totdat ze werkelijk zijn uitgevoerd en getest.
- De publieke roadmap vermeldt het interne offertebeheer als afgerond en veilige klantgoedkeuring plus reisconversie als volgende stappen.
- De README bevat nu alle Agency-routes en de volledige migratievolgorde door `20260908044000_agency_quote_management.sql`.
- Verouderde Lovable-mailinstructies zijn vervangen door de gekozen toekomstige VPS- en SMTP-route.

## 2026-09-11 19:06 CEST — Intern Agency-offertebeheer

- Agency Admin heeft een offertepagina met klant- en optionele reiskoppeling, geldigheid, valuta, statusfilters en maximaal tien varianten.
- Iedere variant heeft een begrensde naam, omschrijving en niet-negatief bedrag.
- Service-role-only RPC `save_agency_quote` bewaart de offerte en volledige variantenset atomair; geaccepteerde, afgewezen en verlopen offertes zijn niet intern overschrijfbaar.
- Migratie `20260908044000_agency_quote_management.sql` en rollbacktest `agency_quotes.sql` staan klaar voor de latere implementatieronde.
- Publieke tokenacceptatie en conversie naar een reis blijven bewust de volgende afzonderlijke beveiligingsstap.

## 2026-09-11 18:59 CEST — Paddle, eigen hosting en SMTP in juridische informatie

- Paddle is in prijzen, voorwaarden en terugbetalingsbeleid vastgelegd als toekomstige Merchant of Record voor betaalde abonnementen.
- De voorwaarden onderscheiden de Paddle-koop en betaling van de software, accounttoegang en productondersteuning die GlobeTrotr levert.
- De privacyverklaring beschrijft afzonderlijk de rollen van Paddle, Supabase, de geplande VPS-infrastructuur en de nog te selecteren SMTP-provider.
- Account- en service-e-mail, bezorgmetadata, transactiegegevens, grondslagen en bewaardoelen zijn toegevoegd in NL/EN.
- De verklaring belooft geen onbekende leverancier of regio: concrete VPS- en SMTP-partijen, locaties, termijnen en eventuele cookies moeten vóór productie worden gepubliceerd.
- Actuele facturatiepagina's en roadmaps verwijzen voortaan naar Paddle en SMTP in plaats van de eerder beoogde Stripe- en Lovable-mailroute.

## 2026-09-11 18:55 CEST — Publieke prijzen en juridische aankoopinformatie

- Een nieuwe openbare prijspagina vergelijkt Free, Pro en Agency met de bestaande beoogde maandprijzen.
- De pagina maakt expliciet dat de huidige beta gratis is en dat pas na activering van de beveiligde Paddle-checkout betalingen kunnen plaatsvinden.
- Afzonderlijke algemene voorwaarden beschrijven accounts, toegestaan gebruik, abonnementen, opzegging, consumentenbescherming, aansprakelijkheid en klachten in NL/EN.
- Een afzonderlijk terugbetalingsbeleid beschrijft de wettelijke bedenktijd, opzegging, terugbetalingsgronden en aanvraagprocedure in NL/EN.
- De drie pagina's zijn vanuit de compacte footer en onderling bereikbaar.
- Voor live betaalactivatie blijft een afzonderlijke checkoutcontrole nodig; deze teksten activeren geen betaling en bevatten geen verzonnen ondernemingsgegevens.

## 2026-09-11 18:52 CEST — Relationele basis voor Agency-offertes

- Een nieuwe workspacegebonden offerte-opslag ondersteunt klant, optionele reis, valuta, geldigheid en een gecontroleerde statuscyclus.
- Iedere offerte kan meerdere geordende varianten met eigen omschrijving en bedrag bevatten.
- Databasecontroles voorkomen koppelingen met klanten, reizen of geaccepteerde varianten buiten de offerte en workspace.
- RLS maakt offertes leesbaar voor interne Agency-leden en wijzigbaar voor teamleden met effectief planrecht.
- Migratie `20260908043000_agency_quotes.sql` staat klaar; beheerinterface, veilige klantacceptatie en regressietest volgen in de volgende bouwstap voordat dit publiek als afgerond verschijnt.

## 2026-09-11 18:48 CEST — Herbruikbare Agency-sjablonen

- Agency Admin heeft een eigen sjablonenpagina voor reisschema's, paklijsten en klantteksten.
- Bevoegde planners kunnen sjablonen aanmaken, wijzigen en archiveren; andere interne Agency-leden kunnen ze alleen lezen.
- Een programma- of paklijstsjabloon kan vanuit de reisinstellingen worden toegevoegd zonder bestaande reisinhoud te vervangen.
- Klantteksten worden vanuit dezelfde bediening naar het klembord gekopieerd voor gecontroleerd hergebruik.
- Opslag is workspacegebonden, begrensd tot honderd geldige onderdelen en opgenomen in de Agency-auditlog.
- Migratie `20260908042000_agency_templates.sql` en SQL-test `agency_templates.sql` staan klaar voor implementatie.
- De productiebuild slaagt met de nieuwe beheer- en reisroutes.

## 2026-09-11 18:43 CEST — Agency-taken en deadlines

- Agency Admin heeft een eigen pagina voor openstaande, afgeronde en geannuleerde taken.
- Taken ondersteunen prioriteit, status, deadline, notities en optionele koppelingen aan een reis, klant en actief teamlid.
- Persoonlijke Agency-rechten bepalen wie taken alleen leest en wie ze aanmaakt of wijzigt.
- Een nieuwe toewijzing maakt een melding voor de uitvoerder; eigen toewijzingen veroorzaken geen overbodige melding.
- Alle taakopslag wordt workspacegebonden gevalideerd en wijzigingen worden aan de append-only Agency-auditlog toegevoegd.
- Migratie `20260908041000_agency_tasks.sql` en SQL-test `agency_tasks.sql` staan klaar voor de implementatieronde.
- De productiebuild en alle 29 applicatieregressietests slagen.

## 2026-09-11 18:38 CEST — Vervaldatums en documentwerkvoorraad

- Reisbeheerders kunnen de categorie, gekoppelde boeking en optionele vervaldatum van een bestaand document wijzigen.
- Een vervaldatum kan direct tijdens het uploaden worden vastgelegd.
- Agency Operatie toont documenten die al verlopen zijn of binnen dertig dagen verlopen en linkt terug naar de juiste reis.
- De database valideert dat documentmetadata en het gekoppelde reisonderdeel werkelijk bij dezelfde onveranderlijke reis-UUID horen.
- Migratie `20260908040000_trip_document_expiry.sql` bouwt voort op de private documentenopslag; `trip_documents_security.sql` controleert ook mutatierechten en ongeldige koppelingen.
- De productiebuild en alle 29 applicatieregressietests slagen.

## 2026-09-11 18:34 CEST — Eerste Agency-klantportaal

- Accounts met een actieve klantrol krijgen een afzonderlijke navigatie naar **Klantportaal**.
- Het portaal toont uitsluitend expliciet gekoppelde klantreizen, met reisperiode, bestemmingen, boekingen, documenten en eerstvolgende planning.
- Documentaantallen worden rechtstreeks onder bestaande RLS geladen; een fout of nog niet uitgevoerde documentmigratie lekt geen gegevens en blokkeert de rest van het portaal niet.
- De pagina gebruikt de actieve Agency-huisstijl en verwijst voor volledige details naar de bestaande afgeschermde reisweergave.
- Facturen en betaalstatus worden pas toegevoegd nadat een echte betaalprovider en een relationeel factuurmodel beschikbaar zijn.
- De productiebuild slaagt en de gegenereerde router bevat de nieuwe route.

## 2026-09-11 18:31 CEST — Documenten aan een reisonderdeel koppelen

- Bij uploaden kan een ticket, voucher of ander document optioneel aan een bestaande vlucht, accommodatie, rit of activiteit worden gekoppeld.
- De documentenlijst toont het gekoppelde reisonderdeel en blijft op smalle schermen binnen de kaart.
- Algemene reisdocumenten blijven mogelijk wanneer er geen specifieke boeking gekozen wordt.
- De productiebuild slaagt na deze uitbreiding.

## 2026-09-11 18:28 CEST — Private reisdocumenten

- Iedere reis heeft een eigen tab **Documenten** voor tickets, vouchers, verzekeringen, visa en boekingsbevestigingen.
- PDF-, JPG-, PNG- en WebP-bestanden tot 15 MB worden in een private Storage-bucket opgeslagen en uitsluitend via een tijdelijke beveiligde link geopend.
- Leestoegang volgt het actieve reislidmaatschap; uploaden en verwijderen volgen het effectieve planrecht, inclusief persoonlijke Agency-afwijkingen.
- Storage-paden gebruiken de onveranderlijke reis-UUID en ongeldige paden veroorzaken geen UUID-castfout in de policies.
- Migratie `20260908039000_secure_trip_documents.sql` en SQL-test `trip_documents_security.sql` staan klaar voor de latere implementatieronde.
- Productiebuild en alle 29 applicatieregressietests slagen.

## 2026-09-11 18:21 CEST — Serverfuncties bijgewerkt voor actuele TanStack API

- Alle serverfuncties gebruiken nu `validator()` in plaats van de verouderde `inputValidator()`-methode.
- De wijziging omvat account, Agency, reizen, uitnodigingen, publieke pagina's, feedback, weer, valuta en vluchtdata.
- De productiebuild slaagt zonder de eerdere TanStack-deprecatiewaarschuwingen; alle 29 regressietests blijven slagen.
- De resterende melding over `vite-tsconfig-paths` komt uit de gedeelde Lovable-configuratie en wordt niet lokaal dubbel aangepast.

## 2026-09-11 13:51 CEST — Echt Agency-abonnementsoverzicht

- Agency Admin heeft een eigen pagina **Abonnement** met het actieve plan en actuele aantallen teamleden, uitnodigingen, klanten en actieve, openbare en gearchiveerde reizen.
- De loader gebruikt uitsluitend compacte server-side count-query’s en vereist het effectieve `billing_manage`-recht.
- Facturen en bedragen worden niet gesimuleerd; het scherm vermeldt duidelijk dat deze na de gecontroleerde Stripe-koppeling beschikbaar komen.
- De bestaande algemene plannenpagina blijft bereikbaar vanuit het Agency-overzicht.

## 2026-09-11 13:49 CEST — Complete Agency-autorisatiematrix

- Een nieuwe integrale SQL-regressietest controleert alle negen Agency-rechten voor eigenaar, standaardadviseur, adviseur met persoonlijke afwijkingen, finance, klant en buitenstaander.
- De test bewijst daarnaast dat interne medewerkers alle Agency-reizen kunnen lezen, een klant uitsluitend de gekoppelde reis ziet en een buitenstaander geen reizen ziet.
- Persoonlijke deny- en allow-afwijkingen worden expliciet boven de rolstandaard getest.
- De test gebruikt uitsluitend tijdelijke gegevens en draait alles terug.

## 2026-09-11 13:46 CEST — Persoonlijke Agency-meldingsvoorkeuren

- Ieder actief Agency-teamlid krijgt eigen voorkeuren voor reiswijzigingen, uitnodigingsreacties en klantupdates.
- Een nieuwe Agency Admin-pagina **Meldingen** leest en bewaart de voorkeuren via afgeschermde serverfuncties en registreert wijzigingen in de auditlog.
- Een database-trigger onderdrukt uitgeschakelde reiswijzigingen en reacties op workspace-uitnodigingen vóórdat ze als melding worden opgeslagen.
- Kritieke meldingen over blokkades, verwijderde toegang en platformstatus blijven verplicht actief.
- Migratie `20260908038000_agency_notification_preferences.sql` en SQL-test `agency_notification_preferences.sql` staan klaar voor de latere implementatieronde.

## 2026-09-11 13:42 CEST — Agency-reisacties beter traceerbaar

- Nieuwe reizen krijgen de stabiele workspace-UUID nu expliciet mee, ook wanneer een bevoegde adviseur de reis aanmaakt.
- Aanmaken en definitief verwijderen van een reis worden voor Agency-workspaces aan de bestaande auditlog toegevoegd met de werkelijke uitvoerder.
- Definitief verwijderen controleert vooraf expliciet dat de ingelogde gebruiker de workspace-eigenaar is.
- De volledige productiebuild en alle 29 regressietests slagen.

## 2026-09-11 13:35 CEST — Agency-beveiligingsoverzicht

- Agency-eigenaren hebben een afzonderlijke pagina **Beveiliging** met aantallen actieve en geblokkeerde teamleden en verlopen uitnodigingen.
- De vijf recentste beheeracties tonen uitvoerder en tijdstip; de volledige append-only historie blijft via **Activiteit** bereikbaar.
- Snelle acties openen het bestaande team- en rechtenbeheer zonder beveiligingslogica te dupliceren.
- De pagina gebruikt uitsluitend bestaande beveiligde Agency-loaders en vereist daardoor geen aanvullende migratie.

## 2026-09-11 13:32 CEST — Agency-instellingen rustiger ingedeeld

- Organisatie- en regiogegevens en de huisstijl staan voortaan in afzonderlijke tabs binnen het Agency-instellingenscherm.
- Het live voorbeeld blijft naast het actieve onderdeel zichtbaar en bestaande opslag, logo-upload en validatie zijn behouden.

## 2026-09-11 13:31 CEST — Persoonlijke Agency-rechten zichtbaar consequent

- Persoonlijke uitzonderingen voor reisplanning, uitgaven en reisinstellingen bepalen nu ook direct welke bediening in het reisscherm beschikbaar is.
- Tijdens het laden van Agency-toegang worden geen kortstondig onbevoegde bewerkknoppen getoond.
- Reisinstellingen, openbaar delen en archiveren controleren hun effectieve recht ook in de browserhandler; de bestaande servercontrole blijft leidend.
- De regressietest dekt een adviseur met ingetrokken planrecht, toegekend instellingenrecht, de laadstatus en terugval naar een gewone reisrol.

## 2026-09-11 13:27 CEST — Reisgenotenbeheer volgt Agency-rechten

- Een centrale server-side controle staat reisgenotenbeheer toe aan de reiseigenaar of een actief Agency-teamlid met expliciet `members_manage`.
- Uitnodigingen aanmaken, bekijken, vernieuwen en intrekken en reisgenoten verwijderen gebruiken dezelfde controle; bestaande service-role-only databasefuncties blijven de mutaties uitvoeren.
- De interface toont het reisgenotenbeheer aan een bevoegd Agency-teamlid en houdt het verborgen voor onbevoegde adviseurs, finance en buitenstaanders.
- Agency-acties op uitnodigingen en verwijderingen krijgen actor en doel in de append-only Agency-auditlog.
- Een negatieve regressietest controleert eigenaar, bevoegde adviseur, standaardadviseur, finance en buitenstaander.

## 2026-09-11 13:23 CEST — Conflicterende Agency-reisrollen opgelost

- Reisloading en reisopslag gebruiken nu dezelfde keuze wanneer iemand zowel een interne Agency-rol als een oude per-reisrol heeft.
- Een actief Agency-lidmaatschap met `trips_view` gaat voor een conflicterende klant-, viewer- of reizigersrol op dezelfde reis.
- Wanneer het Agency-kijkrecht uitstaat, blijft een afzonderlijk geldig reis­lidmaatschap bruikbaar en worden geen Agency-bewerkrechten overgenomen.
- Twee negatieve regressietests bewaken beide situaties.

## 2026-09-11 13:20 CEST — Verouderde Agency-sessies worden hersteld

- De applicatieshell controleert voor actieve Agency-sessies periodiek en bij terugkeer naar het browservenster of het teamlidmaatschap en Agency-plan nog geldig zijn.
- Na blokkeren, verwijderen of een downgrade wordt de workspace opnieuw veilig geladen; oude Agency-navigatie, kleuren en logo's verdwijnen daardoor zonder nieuwe login.
- Tijdelijke controlefouten laten de bestaande server-side beveiliging leidend en veroorzaken geen onbehandelde browserfout.
- De roadmap erkent nu dat bevoegde Agency-adviseurs al reizen in de gedeelde workspace kunnen aanmaken.

## 2026-09-11 12:52 CEST — Agency-klanttoegang en werkvoorraad hersteld

- De foutcode van een ongeldige klant-reiskoppeling is gecorrigeerd, zodat de atomaire rollbacktest de verwachte fout herkent.
- Een Agency-klant met een bestaand GlobeTrotr-account krijgt na koppeling automatisch een actieve `client`-deelname aan de geselecteerde reizen.
- De herstelmigratie vult ook eerder opgeslagen actieve klantkoppelingen aan; opnieuw opslaan is daarvoor niet nodig.
- Automatisch gemaakte deelnames verwijzen naar het klantprofiel; ontkoppelen verwijdert daardoor uitsluitend deze toegang en laat handmatig beheerde deelnames staan.
- Archiveren trekt automatisch verleende klanttoegang in en herstellen activeert de gekoppelde reizen opnieuw wanneer het account nog bestaat.
- De werkvoorraad laadt reizen, boekingen en uitgaven via afzonderlijke workspacegebonden queries en vertrouwt niet meer op een ontbrekende impliciete PostgREST-relatie.
- Het klantenscherm toont of het account daadwerkelijk toegang heeft en legt uit wanneer voor een nieuw account nog een uitnodiging nodig is.
- Corrupte typografische tekens en scheidingstekens in Agency Admin zijn hersteld.
- README, AGENTS.md, publieke roadmap, interne roadmap, mogelijkhedenpagina en beide changelogs zijn gecontroleerd en gelijkgetrokken met de actuele Agency-functionaliteit.

## 2026-09-10 19:36 CEST — Append-only Agency-auditlog

- Agency Admin heeft een afzonderlijke eigenaarspagina **Activiteit** met maximaal honderd recente beheeracties en een compacte standaardweergave.
- Klantopslag en archivering, organisatie- en reishuisstijl, rol- en gebruikersrechten, teamuitnodigingen en teamlidacties leggen actor, actie, doel en tijdstip vast.
- Ook het accepteren of weigeren van een Agency-uitnodiging wordt aan de juiste workspace toegeschreven.
- Context blijft doelbewust beperkt: uitnodigingstokens, klantnotities en volledige gewijzigde records komen niet in de auditlog.
- De nieuwe tabel is afgeschermd voor browserrollen en append-only voor de service-role; de meegeleverde SQL-test controleert beide eigenschappen.

## 2026-09-10 19:28 CEST — Operationele Agency-werkvoorraad

- De pagina **Operatie** combineert de bestaande echte portfolio- en kostencijfers met een concrete werkvoorraad.
- Aankomende reizen, toekomstige boekingen zonder aanbieder of boekingsnummer, declarabele uitgaven en verlopen teamuitnodigingen staan in vier begrensde lijsten.
- Ieder reisgebonden aandachtspunt opent direct de juiste reis; lege categorieën krijgen een duidelijke rustige status.
- De nieuwe serverloader controleert `analytics_view` en retourneert uitsluitend compacte operationele samenvattingen uit de relationele Agency-data.
- Factuurstatus wordt nog niet gesuggereerd: declarabele uitgaven blijven als open weergegeven totdat het geplande factuurmodel een echte betaaldatum kan leveren.

## 2026-09-10 19:21 CEST — Klantprofielen in Agency Admin

- Nieuwe pagina `/agency-admin/clients` beheert klantprofielen los van interne Agency-teamleden en reisuitnodigingen.
- Een profiel bevat naam, e-mail, telefoonnummer, voorkeurstaal en interne notities en kan aan meerdere reizen worden gekoppeld.
- Actieve en gearchiveerde klanten zijn afzonderlijk filterbaar; de begrensde lijst houdt ook een grotere klantenportefeuille overzichtelijk.
- Profielwijzigingen en de volledige set reiskoppelingen worden door één service-role-only RPC atomair opgeslagen en controleren opnieuw het effectieve `members_manage`-recht.
- Het operationele reis- en kostenoverzicht staat nu als eigen pagina in Agency Admin; bestaande links naar `/analytics` worden doorgestuurd.
- De SQL-regressietest bewijst dat een ongeldige reiskoppeling ook de voorafgaande profielwijziging terugdraait.

## 2026-09-10 16:58 CEST — Directe Agency-branding en compact beheer

- Opslaan van Agency-instellingen herlaadt de actieve workspace onmiddellijk; naam, domein, tagline, valuta en accentkleur wachten niet langer op een volgende sessie.
- Logo-upload gebruikt een uniek, workspacegebonden bestandspad, slaat de nieuwe verwijzing atomair op en verwijdert daarna het vorige bestand. AppShell toont het private logo via een signed URL.
- De publieke Agency-reis gebruikt de effectieve bedrijfsnaam bij **gedeeld door** en ontvangt alleen expliciet veilige merkvelden.
- Blokkeren en herstellen van een Agency-lid maakt of actualiseert een accountmelding voor dat lid.
- Persoonlijke rechten gebruiken een teamlidselector en renderen daardoor niet langer alle uitgebreide matrices onder elkaar.
- Corporate Admin heeft een afzonderlijke pagina **Agencies** voor inzage en correctie van organisatie-instellingen; iedere wijziging vereist een reden en wordt in de auditlog vastgelegd.
- Agency-serverfuncties bepalen voor eigenaar, Advisor en Finance eerst de effectieve rolstandaard en persoonlijke uitzondering; organisatie-instellingen en teamacties vertrouwen niet alleen op verborgen browserknoppen.
- De routes voor analyse en reisleden controleren `analytics_view` respectievelijk `members_manage`, ook wanneer iemand een directe URL opent.
- De volledige client-, SSR- en Cloudflare-productiebuild slaagt.

## 2026-09-09 22:04 CEST — Optionele branding per Agency-reis

- Reisinstellingen tonen voor Agency-eigenaren een afzonderlijke reishuisstijl met naam, domein, tagline, accentkleur en live voorbeeld.
- Ieder leeg afwijkingsveld erft automatisch de centrale Agency-instelling; **Agency-standaard herstellen** schakelt de afwijking volledig uit.
- Nieuwe tabel `trip_branding_overrides` bewaart de optionele reisafwijking los van de reissnapshot en verwijdert deze via de reisrelatie automatisch mee.
- Service-role-only RPC's controleren het actieve Agency-plan en het effectieve `branding_manage`-recht van de uitvoerende gebruiker.
- De publieke reispagina vraagt via een aparte anon-RPC uitsluitend naam, domein, tagline en accentkleur op; interne instellingen en logo-opslagpaden worden niet gedeeld.
- Relationeel geladen reizen bevatten de actieve reisafwijking, zodat PDF en reisgids direct dezelfde effectieve huisstijl gebruiken.
- Migratie `20260908034000_trip_branding_overrides.sql` en rollbacktest `supabase/tests/trip_branding_overrides.sql` toegevoegd.
- Alle 25 regressietests en de volledige client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 22:00 CEST — Rechtenbewuste Agency Admin-shell

- Agency Admin gebruikt nu een vaste geneste beheerindeling voor overzicht, organisatie, rollen en rechten, klanten, operatie en abonnement.
- De navigatie werkt horizontaal op mobiel en als vaste zijbalk op grotere schermen.
- Een nieuwe geauthenticeerde serverfunctie bepaalt de actieve Agency-workspace, rol en effectieve rechten van de huidige gebruiker.
- Beheeronderdelen en overzichtskaarten worden alleen getoond wanneer de eigenaar, rolstandaard of persoonlijke uitzondering daar toegang toe geeft.
- De centrale branding-resolver hanteert Agency-instellingen boven legacywaarden en valt bij een ander plan altijd terug op GlobeTrotr; reisafwijkingen zijn technisch voorbereid.
- Er zijn regressietests toegevoegd voor Agency-rechten en de merkhiërarchie. Alle 25 tests en de volledige client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 21:55 CEST — Agency-rechten per rol en gebruiker

- Nieuw scherm `/agency-permissions` beheert standaardrechten voor Advisor en Finance en afzonderlijke uitzonderingen per teamlid.
- Rechten zijn opgesplitst in reizen bekijken en aanmaken, planning, uitgaven, reisinstellingen, reisgenoten, analyses, branding en abonnement.
- De eigenaar houdt altijd alle rechten en kan niet via een gebruikersafwijking worden beperkt.
- De server dwingt de effectieve rechten afzonderlijk af bij reisloading, nieuwe Agency-reizen en bestaande reiswrites; velden buiten de bevoegdheid blijven gelijk aan de databaseversie.
- Migratie `20260908033000_agency_permission_overrides.sql`, SQL-regressietest en twee TypeScript-regressietests toegevoegd.
- Alle 23 regressietests en de volledige client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 21:39 CEST — Veilige Agency-instellingen en logo

- Nieuwe afzonderlijke route `/agency-settings` groepeert algemene organisatiegegevens en merkuitstraling buiten account- en reisinstellingen.
- Systeemnaam, afzendernaam, contactadres, domein, standaardtaal, valuta, tijdzone, tagline en accentkleur hebben expliciete validatie en zichtbare tekentellers.
- Lege verplichte legacywaarden worden server-side teruggezet naar veilige GlobeTrotr-standaardwaarden en de beheerder krijgt daar na opslaan melding van.
- Agency-logo's gebruiken een private Storage-bucket met een limiet van 2 MB, beperkte afbeeldingsformaten en een workspacegebonden eigenaarsbeleid.
- Het dashboard bevat een live voorbeeld van naam, domein, tagline, accentkleur en logo.
- Migratie `20260908032000_agency_settings_and_logo.sql` en rollbacktest `supabase/tests/agency_settings.sql` toegevoegd.
- Alle 21 regressietests en de volledige client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 21:19 CEST — Volledig beheer van Agency-teams

- Agency Admin toont echte workspaceleden en openstaande uitnodigingen in één centrale teamsectie.
- Een eigenaar kan een adviseur of financieel medewerker via een zeven dagen geldige, gehashte uitnodigingslink toevoegen; bestaande accounts ontvangen ook een melding.
- De genodigde kan via een afzonderlijke NL/EN-pagina of rechtstreeks vanuit Meldingen accepteren of weigeren. Het exacte accountadres wordt server-side gecontroleerd.
- Openstaande uitnodigingen kunnen veilig worden vernieuwd of ingetrokken. Bij vernieuwen wordt de oude link ongeldig en wordt de nieuwe link gekopieerd.
- Rollen kunnen worden gewijzigd en toegang kan worden geblokkeerd, hersteld of verwijderd; de eigenaar kan zichzelf niet via deze acties aanpassen.
- Migratie `20260908031000_agency_team_management.sql` en rollbacktest `supabase/tests/agency_team_management.sql` toegevoegd.
- Alle 21 regressietests en de volledige client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 20:50 CEST — Relationele Agency-teams

- Iedere workspace krijgt een vaste UUID; bestaande en nieuwe reizen worden automatisch aan die stabiele organisatie-ID gekoppeld.
- Nieuwe relationele tabellen bewaren interne Agency-leden en toekomstige Agency-uitnodigingen los van reisgenoten en browserdata.
- De database vertaalt actieve workspace-rollen naar de bestaande reisrechten: adviseurs kunnen plannen, financiële medewerkers beheren geldzaken en klanten blijven uitsluitend per reis gekoppeld.
- De workspace-loader geeft een intern teamlid de actieve Agency-branding en alle reizen van de organisatie, zonder e-mailadressen van reisgenoten vrij te geven.
- Reiswrites herkennen dezelfde Agency-rollen server-side en blijven onbevoegde accounts weigeren.
- Migratie `20260908030000_agency_workspace_members.sql` en rollbacktest `supabase/tests/agency_workspace_access.sql` toegevoegd.
- Alle 21 regressietests en de volledige client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 18:20 CEST — Start van Agency Admin en logischere back-ups

- Nieuwe centrale route `/agency-admin` geeft Agency-eigenaren één overzicht met actuele reizen, workspaceleden, actieve branding en ingangen voor team, operatie en abonnement.
- De interne roadmap beschrijft de volledige Agency-bouwvolgorde van relationele workspace en rollen tot branding, lifecycle, audit en regressietests.
- De afzonderlijke reisback-up is van de dashboardkaart naar Reisinstellingen verplaatst; veilige JSON-import staat nu in Accountinstellingen.
- De README is volledig herschreven naar de actuele beta, functies, architectuur, lokale installatie, controles, migraties en Lovable-werkwijze.
- GitHub Actions gebruikt Node 24-compatibele Actions en Bun met het aanwezige `bun.lock`; de fout door een ontbrekend npm-lockbestand is daarmee verwijderd.
- Alle 21 regressietests en de client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 13:32 CEST — Openstaande uitnodigingen beheren

- Reisinstellingen tonen voor de eigenaar een afzonderlijk overzicht van openstaande en verlopen uitnodigingen, met e-mailadres, rol en vervaldatum.
- **Nieuwe link** roteert het geheime token, verlengt de uitnodiging zeven dagen en heropent voor een bestaand account de uitnodigingsmelding; de oude link werkt daarna niet meer.
- **Intrekken** vraagt om bevestiging, sluit de uitnodiging en melding en verwijdert uitsluitend de nog ongekoppelde placeholder uit de reisgenotenlijst.
- Nieuwe service-role-only RPC `manage_trip_invitation` controleert de reiseigenaar en voert iedere beheeractie atomair uit.
- Migratie `20260908029000_manage_pending_trip_invitations.sql` en SQL-regressietest `supabase/tests/pending_trip_invitation_management.sql` toegevoegd.
- Alle 21 regressietests en de client-, SSR- en Cloudflare-productiebuild slagen.

## 2026-09-09 13:21 CEST — Sneller storingen en problemen beheren

- Het bijwerken en oplossen van een platformstoring opent nu in een dialoog bij de gekozen status, zonder handmatig naar het publicatieformulier te scrollen.
- Een oplossingsdialoog vult bewust een afzonderlijke titel **Opgelost:** en hersteltekst in, zodat de herstelmelding niet gelijk is aan de oorspronkelijke storing.
- Bekende problemen openen bij bewerken in een eigen dialoog. Archiveren vraagt voortaan bevestiging en werkt de lijst direct bij; herstellen en verwijderen geven eveneens directe terugkoppeling.
- Live weer en JSON-import/export zijn in productie werkend bevestigd. De weerbeperking kan via het nieuwe bewerkvenster op opgelost worden gezet.
- De fout in de SQL-regressietest is hersteld: oplossingsmeldingen worden alleen voor de twee tijdelijke testaccounts en het unieke testincident geteld.

## 2026-09-09 13:06 CEST — Beheerbare platformstatus met banner

- Actuele platformstatussen verschijnen als duidelijke, wegklikbare banner bij ingelogde gebruikers; belangrijke productupdates blijven gewone meldingen rechtsboven.
- Iedere status krijgt een vaste incidentcode. Een vervolgstatus vervangt automatisch de vorige banner en **Opgelost** sluit de banner bij alle gebruikers en stuurt een gewone oplossingsmelding.
- Corporate Admin toont actieve statussen en een begrensde berichtgeschiedenis en kan een status bijwerken of als opgelost melden.
- Migratie `20260908028000_platform_status_lifecycle.sql` bewaart de statusrelatie, herstelt bestaande statusmeldingen en actualiseert de geregistreerde bekende problemen.
- De interne en publieke roadmap zijn vergeleken met de gebouwde functies en bevestigde praktijktests; verouderde open punten over uitnodigingen, platformpublicatie, juridische contactgegevens en probleembeheer zijn bijgewerkt.

## 2026-09-09 12:48 CEST — Weigeren, platformberichten, weer en import hersteld

- Een geweigerde uitnodiging verwijdert nu ook de niet-gekoppelde placeholder uit Reisgenoten; reeds achtergebleven geweigerde regels worden veilig opgeruimd zolang er geen nieuwe open uitnodiging bestaat.
- Platformberichten worden via één afgeschermde databasefunctie aangemaakt en gepubliceerd, zodat de meldingentrigger niet meer afhankelijk is van twee losse API-bewerkingen.
- Live weer en de platformstatus vallen terug op MET Norway wanneer Open-Meteo vanuit de serveromgeving niet bereikbaar is.
- De openbare weerwidget valideert de gedeelde reis, eventuele PIN en bestemming via de publieke reis-RPC; hij vereist daardoor geen ingelogde sessie meer.
- JSON-import houdt de zojuist aangemaakte reis direct in de interne workspace-state beschikbaar, zodat de inhoud aansluitend zonder render-race kan worden opgeslagen.
- Het reisoverzicht onderscheidt nu duidelijk de back-up van alle reizen en biedt op iedere reiskaart een afzonderlijke JSON-back-up.
- De publieke roadmap toont geen interne praktijktest meer; de bevestigde testresultaten staan gebruikersgericht in Beta 0.22 van het publieke changelog.
- Migratie `20260908027000_invitation_cleanup_and_platform_publish.sql` en de bestaande SQL-regressietests zijn uitgebreid voor opruimen na weigering en de publicatie-RPC.

## 2026-09-09 12:32 CEST — Herkenbare auditlog en veilige reisimport

- De Corporate Admin-auditlog toont nu per actie de naam en het e-mailadres van de uitvoerende beheerder, naast actie, doel, resultaat en tijdstip.
- De JSON-back-up in het reisoverzicht kan weer worden geïmporteerd. Iedere reis krijgt een nieuwe UUID en wordt privé en actief teruggezet, zodat bestaande reizen niet worden overschreven.
- Uit veiligheid worden accountkoppelingen, openbare publicatie, deel-PIN en oude bonpaden niet uit een back-up overgenomen; inhoudelijke reisdata blijft behouden.

## 2026-09-09 12:28 CEST — Volledige meldingscyclus

- Reiswijzigingen gebruiken voortaan één stabiele melding per ontvanger en reis; nieuwe wijzigingen verversen die melding in plaats van duplicaten toe te voegen.
- Een actief reisgenootaccount krijgt bericht wanneer de eigenaar de deelname verwijdert.
- De indiener krijgt automatisch een vertaalde melding wanneer Corporate Admin de feedbackstatus wijzigt.
- Corporate Admin heeft een afzonderlijke Berichten-pagina om een actuele platformstatus of belangrijke update in NL en EN naar alle bevestigde accounts te publiceren, met bevestiging en auditlog.
- Migratie `20260908026000_notification_lifecycle.sql` voegt de meldingstypen, triggers, publicatietabel en bestaande ontdubbeling toe; `supabase/tests/notification_lifecycle.sql` controleert de vier stromen.

## 2026-09-09 12:20 CEST — Eenduidige uitnodigingsstatus en betrouwbaarder weer

- De betekenisloze knoppen om een reisgenoot handmatig te bevestigen of opnieuw uit te nodigen zijn verwijderd; acceptatie en weigering blijven uitsluitend bij de genodigde.
- Migratie `20260908025000_notify_invitation_responses.sql` meldt de uitnodiger voortaan wanneer een uitnodiging is geaccepteerd of geweigerd. De app vertaalt deze melding naar NL/EN en linkt naar de reis.
- De weerwidget haalt Open-Meteo voortaan via een geauthenticeerde serverfunctie op met de actuele API-velden, invoercontrole en een timeout; de Pro/Agency-controle wordt ook server-side afgedwongen.
- De platform-healthcheck gebruikt dezelfde actuele weerendpoint zonder een afwijkende User-Agent-header.

## 2026-09-09 12:13 CEST — Reisgenoten definitief verwijderen en ontdubbelen

- De verwijderknop gebruikt nu een eigenaar-geautoriseerde serveractie die alle ledenrijen met hetzelfde adres verwijdert, open uitnodigingen intrekt en bijbehorende meldingen sluit.
- Acceptatie ruimt achtergebleven ongekoppelde placeholders met hetzelfde reisgenootadres op, zodat één persoon nog maar één keer in de ledenlijst verschijnt.
- Migratie `20260908024000_remove_members_and_deduplicate.sql` herstelt ook bestaande dubbele leden en voegt de afgeschermde verwijder-RPC toe.
- SQL-regressietest `supabase/tests/trip_member_removal_and_deduplication.sql` controleert ontdubbelen, definitief verwijderen en weigering van een niet-eigenaar.

## 2026-09-09 12:05 CEST — Gedeelde reis zichtbaar na acceptatie

- De relationele workspace-loader vroeg na de privacyversterking nog alle kolommen van `trip_members` op; de ontbrekende e-mailgrant liet daardoor de hele laadactie terugvallen op de oude workspacekopie.
- RLS bepaalt nu eerst welke reizen het account mag zien. Alleen die reis-ID's worden server-side met leden aangevuld en uitsluitend een reiseigenaar ontvangt daarbij e-mailadressen.
- Acceptatie via de uitnodigingslink sluit nu ook server-side de bijbehorende persistente melding voordat het dashboard opnieuw wordt geladen.

## 2026-09-09 11:55 CEST — Geweigerde en verouderde uitnodigingen gesloten

- Weigeren roteert voortaan de opgeslagen tokenhash, waardoor de oorspronkelijke uitnodigingslink onmiddellijk ongeldig wordt terwijl de rij als auditspoor behouden blijft.
- Uitnodigingsmeldingen worden na weigeren direct gesloten en de triggers slaan geaccepteerde, geweigerde, ingetrokken en verlopen uitnodigingen over.
- Oude open uitnodigingen voor een bevestigd account dat al actief aan dezelfde reis deelneemt worden door de migratie als afgehandeld gemarkeerd.
- De opruiming is generiek en herstelt daardoor ook de gemelde oude uitnodigingsstaat rond reis `352d3b68-866d-4295-8948-2164b629c2db` zonder reisdata te verwijderen.
- De SQL-regressietest controleert nu dat de oorspronkelijke link na weigeren niet opnieuw gebruikt kan worden.

## 2026-09-09 01:54 CEST — Conflict bij uitnodigingsacceptatie hersteld

- De productiemelding is herleid tot unieke-indexconflict `23505`: het account had al een actieve koppeling aan dezelfde reis.
- Herstelmigratie `20260908022000_resolve_existing_invitation_memberships.sql` laat een bestaande actieve koppeling vóór iedere placeholder winnen en maakt acceptatie ook voor bestaande leden idempotent.
- Een bestaande eigenaar behoudt altijd de eigenaarrol; de overbodige uitnodiging wordt afgesloten en de app meldt dat het account al deelneemt.
- De SQL-regressietest controleert nu ook acceptatie door een account dat al als eigenaar actief is.

## 2026-09-09 01:48 CEST — Agency-instellingen aangescherpt in de roadmap

- De interne roadmap plant één afzonderlijk Agency Workspace Admin-dashboard voor alle workspacebrede instellingen.
- Verplichte instellingen krijgen client-, server- en databasevalidatie en kunnen niet als lege of uitsluitend uit spaties bestaande waarde worden opgeslagen.
- Ontbrekende verplichte waarden worden volgens vaste standaardwaarden hersteld, met een zichtbare uitleg en zonder geldige instellingen te overschrijven.
- De systeemnaam/Agency-naam krijgt een maximale lengte, tekenteller, vertaalde foutmelding en databaseconstraint.

## 2026-09-09 01:40 CEST — Publieke voortgang en bekende beperkingen

- De onjuiste toekomstige tijden in de publieke changelog zijn vervangen door lokale CEST-tijden die aansluiten op de werkelijke volgorde.
- De brede beheerrelease is gesplitst in afzonderlijke releases voor navigatie en roadmap, platformstatus en audit, accountbeheer, thema en reisgenootherkenning, en de nieuwe uitnodigingsflow.
- De publieke roadmap vermeldt uitnodigingslinks en accountmeldingen als huidig resultaat; automatische e-mail en intrekken/vernieuwen staan als volgende stappen.
- Migratie `20260908021000_seed_current_beta_limitations.sql` voegt de drie concrete, actuele beta-beperkingen zonder titelduplicaten toe aan Bekende problemen.
- Corporate Admin kan alle nog niet gekoppelde bekende problemen gecontroleerd naar GitHub synchroniseren en legt het resultaat vast in de auditlog.

## 2026-09-09 01:30 CEST — Uitnodigingen zichtbaar aangesloten

- Reisbeheerders krijgen na het toevoegen van een reisgenoot een eenmalig getoonde, zeven dagen geldige uitnodigingslink die ze veilig kunnen kopiëren.
- De nieuwe route `/uitnodiging/$token` toont uitsluitend veilige uitnodigingsinformatie en laat het geverifieerde uitgenodigde account accepteren of weigeren.
- Bestaande accounts kunnen uitnodigingen rechtstreeks in het persistente meldingenpaneel accepteren of weigeren.
- Nieuwe gebruikers keren na registratie en e-mailbevestiging terug naar dezelfde uitnodiging; de interne redirect wordt begrensd en accepteert uitsluitend lokale paden.
- De oude automatische koppeling tijdens het laden van een workspace is verwijderd. Alleen de atomaire database-respons activeert een reisdeelname.
- Gebruikersteksten bij Reisgenoten beschrijven nu de expliciete acceptatie in NL en EN; de uitnodigingslink blijft ook op smalle schermen bruikbaar en meldt een mislukte clipboardactie.
- De publieke changelog bevat hiervoor een zelfstandige Beta 0.14-release.

## 2026-09-09 01:00 CEST — Uitnodigingsflow uitgewerkt

- De roadmap beschrijft één beveiligde uitnodigingsbron met drie kanalen: e-mail, persistente accountmelding en deelbare link.
- Alle kanalen gaan naar dezelfde acceptatiestroom; toegang ontstaat pas na een expliciete server-side geverifieerde acceptatie.
- Bestaande accounts krijgen uiteindelijk accepteren/weigeren in hun meldingen; nieuwe gebruikers kunnen via de uitnodigingslink registreren en daarna naar dezelfde uitnodiging terugkeren.
- E-mailbezorging blijft afhankelijk van Lovable Cloud Emails, maar de melding- en linkroutes kunnen eerder worden gebouwd.
- De thema-initialisatie draait vóór de eerste browserpaint en gebruikt een kleine functionele voorkeurcache, waardoor vernieuwen in donkere modus geen witte flits meer geeft; de opslag staat in de privacy-inventaris.
- Migratie `20260908020000_trip_invitation_responses.sql` voegt expliciet weigeren toe en maakt accepteren/weigeren atomair, idempotent, aan het bevestigde accountadres gebonden en uitsluitend uitvoerbaar via de service-role.
- Nieuwe serverfuncties maken een zeven dagen geldige uitnodiging, geven uitsluitend veilige uitnodigingsdetails terug en verwerken een antwoord via een linktoken of melding-ID.
- SQL-regressietest `supabase/tests/trip_invitation_responses.sql` controleert verkeerde accounts, actieve toegang na acceptatie, geen toegang na weigeren en herhaalde acceptatie.

## 2026-09-08 23:30 CEST — Corporate Admin en gebruikersinzage

- De publieke changelog heeft een afzonderlijke Beta 0.13-release voor platformbeheer; Beta 0.12 blijft gericht op feedback en bekende problemen.
- Corporate Admin gebruikt afzonderlijke routes voor overzicht, gebruikers, platformstatus, problemen, feedback en auditlog.
- Gebruikers hebben een losse detailpagina, zodat de hoofdlijst compact blijft.
- Het detail toont noodzakelijke account- en workspacegegevens, aantallen actieve, openbare en gearchiveerde reizen, actieve deelnames en maximaal tien recent bijgewerkte reizen.
- Iedere gebruikersdetailinzage wordt server-side als `user.detail.view` in de afgeschermde auditlog vastgelegd.
- Corporate Admin kan een account tijdelijk blokkeren en herstellen na een duidelijke waarschuwing en met een verplichte interne reden; de server weigert blokkering van het eigen beheerdersaccount.
- Geslaagde en mislukte accountblokkeringen en herstelacties worden als `user.block` of `user.restore` geaudit.
- De technische Auth-melding `User is banned` is vervangen door een vertaalde gebruikersmelding die voor hulp naar `info@globetrotr.nl` verwijst.
- De koppeling van een vooraf toegevoegd reisgenootadres gebruikt nu het server-side geverifieerde Auth-account in plaats van een mogelijk ontbrekende tokenclaim; de vergelijking blijft exact en genormaliseerd.
- Corporate Admin wordt in een eigen operationele shell weergegeven zonder reis- en Agency-navigatie, publieke footer of beta-feedbackknop; een expliciete knop leidt terug naar het reisplatform.
- De publieke roadmap vermeldt het Corporate Admin-dashboard als afgeronde stap binnen de internationale beta, met uitsluitend publieksveilige producttekst.
- De al uitgevoerde migratie `20260908019000_platform_admins_and_audit.sql` en test `supabase/tests/platform_admin_security.sql` zijn in de roadmap als afgerond gemarkeerd.

## 2026-09-08 16:10 CEST — Betafeedback en bekende problemen

- Ingelogde betatesters hebben op iedere pagina een vaste zijknop voor feedback; pagina en beperkte browserinformatie worden voor foutonderzoek meegestuurd.
- Corporate Admin beheert ontvangen feedback en openbare bekende problemen via een uitsluitend met `app_metadata.corporate_admin=true` toegankelijke pagina.
- Bekende problemen hebben NL/EN-tekst, status, ernst en publieke zichtbaarheid en verschijnen op `/bekende-problemen`.
- Opslaan en wijzigen synchroniseert met een GitHub Issue zodra de server-secrets `GITHUB_ISSUES_TOKEN` en `GITHUB_ISSUES_REPOSITORY` zijn ingesteld.
- De oude `atlasledger.workspace.v1`-cache wordt verliesvrij naar `globetrotr.workspace.v1` gemigreerd en daarna verwijderd.
- Privacykeuzes staan voor ingelogde gebruikers bij Accountinstellingen; gasten houden de footeroptie. Juridische naam, postadres en privacycontact zijn gepubliceerd.
- Migratie `20260908016000_beta_feedback_and_known_issues.sql` en regressietest `supabase/tests/beta_feedback_and_known_issues.sql` zijn toegevoegd.
- GitHub-verzoeken sturen de verplichte herkenbare `User-Agent` mee en gebruiken voor nieuwe Issues uitsluitend velden uit het create-issue-schema.
- De feedbackknop toont alleen nog een icoon, zodat hij ook op smalle schermen past.
- Feedback en bekende problemen kunnen worden gearchiveerd, hersteld en na bevestiging definitief verwijderd; gekoppelde GitHub Issues worden bij archiveren of verwijderen gesloten.
- Statussen en ernstlabels worden in de gekozen accounttaal getoond.
- Migratie `20260908017000_archive_feedback_and_issues.sql` voegt de archiveerstatus toe.
- Feedback en bekende problemen gebruiken dezelfde vertaalde categorieën: fout, verbetering, idee, gebruiksgemak, vertaling, beveiliging en overig.
- Corporate Admin toont echte platform-KPI's voor workspaces, plannen, reizen en open werk, plus zoeken en filteren in feedback en bekende problemen.
- De actuele beta-beperkingen zijn eenmalig zonder dubbelingen geïmporteerd en naar GitHub gesynchroniseerd; de tijdelijke importknop is daarna opgeruimd.

## 2026-09-08 15:20 CEST — Privacykeuzes en beta-voorwaarden

### Privacy en juridisch

- De privacyverklaring beschrijft nu per gegevenscategorie het doel en de AVG-grondslag, ontvangers, internationale doorgifte, bewaartermijnen, openbare reizen, rechten en klachten.
- Een volledige inventaris van cookies en browseropslag vermeldt naam, doel, categorie en bewaarmoment. GlobeTrotr gebruikt momenteel geen analyse-, advertentie-, marketing- of cross-site-trackingtechnologie.
- Nieuwe privacykeuze verschijnt bij het eerste bezoek. Noodzakelijke opslag wordt uitgelegd; taalopslag is optioneel, standaard uit en kan even eenvoudig worden geweigerd, toegestaan of later via de footer ingetrokken.
- Google Fonts en Leaflet-CSS worden niet meer automatisch vanaf externe hosts geladen. Leaflet-CSS zit nu in de eigen applicatiebundel.
- De beta-voorwaarden regelen deelnameleeftijd, accountveiligheid, toegestaan gebruik, rechten op gebruikersinhoud, beta- en reisrisico's, beëindiging, aansprakelijkheid, consumentenrecht en toepasselijk recht in NL/EN.
- De officiële juridische naam, het postadres en een werkend privacycontact blijven verplichte gegevens vóór een openbare productieopening.

### Controles

- Alle 21 geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 14:42 CEST — Securityscan: exports, API-quota en ledenprivacy

### Beveiliging

- CSV-cellen met `=`, `+`, `-`, `@` of gevaarlijke voorlooptekens krijgen een tekstprefix voordat een spreadsheet ze opent; bestaande quote-escaping blijft actief.
- De SkyLink-serverfunctie vereist nu een geverifieerde Supabase-sessie en reserveert atomair maximaal twintig controles per account per uur.
- Rechtstreekse `SELECT`-toegang tot `trip_members.email` is voor `authenticated` ingetrokken. Veilige ledenvelden blijven onder de bestaande reis-RLS leesbaar; de afgeschermde serverroute levert e-mail alleen aan de eigenaar.
- Directe uitvoerrechten op interne `SECURITY DEFINER`-triggerfuncties zijn ingetrokken en hun vaste `search_path` is aangescherpt.
- `authenticated` kan de publieke reis-RPC's niet meer rechtstreeks uitvoeren. De twee bewust openbare functies blijven voor `anon` beschikbaar omdat de homepage en gedeelde reislinks deze nodig hebben; hun responses bestaan uit een vaste allowlist en PIN-validatie.
- Migratie `20260908015000_security_hardening.sql` bevat de rechtenwijzigingen en de persistente vluchtquotateller.

### Controles

- `security_hardening.sql` controleert het uurquotum, afgeschermde e-mailkolom en de toegestane `SECURITY DEFINER`-rechten.
- Twee nieuwe regressietests controleren CSV-formule-injectie en correcte quote-escaping.
- Alle 21 geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De beveiligingsmigratie en SQL-test moeten nog worden uitgevoerd; draai daarna de Lovable-securityscan opnieuw.

## 2026-09-08 14:34 CEST — Weer op de openbare reispagina

### Publieke reis

- Openbare Pro- en Agency-reizen tonen de actuele verwachting voor de eerste of door de bezoeker geselecteerde bestemming.
- De vijfdaagse verwachting gebruikt op telefoon twee kolommen en vanaf grotere schermen vijf kolommen.
- De publieke RPC geeft alleen `weatherEnabled` terug; de abonnementsnaam zelf blijft buiten de publieke response.
- Omdat de boekingsmigratie al was uitgevoerd, staat deze uitbreiding afzonderlijk in `20260908014000_public_trip_weather.sql` met regressietest `supabase/tests/public_trip_weather.sql`.

### Controles

- De test dekt een openbare Pro-reis, een openbare Free-reis en controleert dat het plan niet wordt vrijgegeven.
- Alle negentien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De weermigratie en SQL-regressietest zijn op 8 september 2026 zonder fouten uitgevoerd.

## 2026-09-08 14:29 CEST — Boekingen bewust openbaar delen

### Publieke reis

- Elk reisonderdeel heeft een afzonderlijke keuze **Delen op de openbare reispagina**; bestaande en nieuwe boekingen zijn standaard niet gedeeld.
- De openbare reispagina toont gedeelde onderdelen als compacte kaarten met type, titel, datum, tijd en plaatsnamen.
- Nieuwe migratie `20260908013000_public_trip_bookings.sql` breidt de publieke detail-RPC uit met een vaste allowlist.
- Boekingsreferentie, prijs, valuta, betaler, notities, aanbieder, vluchtnummer, vluchtstatus, terminal, gate, bagageband en exacte locatiecoördinaten worden niet vrijgegeven.
- SQL-regressietest `supabase/tests/public_trip_bookings.sql` controleert zowel expliciete toestemming als het ontbreken van private boekingsvelden.

### Controles

- Alle negentien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De migratie en SQL-regressietest zijn op 8 september 2026 zonder fouten uitgevoerd.

## 2026-09-08 14:25 CEST — Vervoerssoort en werkelijke brandstofkosten

### Uitgaven

- Een uitgave kan vanuit het uitgavenformulier expliciet als werkelijke brandstofkosten aan een autorit worden gekoppeld.
- Nieuwe vervoersboekingen vragen om auto, motor, camper, openbaar vervoer, trein, bus, veerboot, taxi/deelrit, fiets, lopen of anders en tonen deze keuze in het boekingsoverzicht.
- Afstand, literverbruik en brandstofprijs verschijnen alleen voor auto, motor en camper. Andere vervoerssoorten veroorzaken ook bij achtergebleven waarden geen brandstofprognose.
- Zodra minstens één bestaande tankuitgave aan een rit gekoppeld is, vervangt die realisatie de berekende brandstofprognose van de rit.
- Meerdere tankuitgaven kunnen bij dezelfde rit horen. Bewerken, opnieuw koppelen en verwijderen werkt de verwijzingen atomair bij via de bestaande versiegestuurde reisopslag.
- Gekoppelde uitgaven zijn herkenbaar in het uitgavenoverzicht; bonnetjes blijven optioneel beschikbaar binnen het bestaande Agency-recht.
- De koppeling wordt in het bestaande JSONB-detailveld van het reisonderdeel opgeslagen en vereist geen nieuwe migratie.

### Controles

- Vier regressietests controleren vervoerssoorten zonder eigen brandstof, een actieve prognose, vervanging door een werkelijke uitgave en meerdere veilig gekoppelde tankuitgaven.
- Alle negentien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 09:56 CEST — Bevestigde opslag voor reisleden en paklijst

### Betrouwbaarheid

- Reisleden toevoegen, verwijderen, activeren en van rol veranderen wacht nu zichtbaar op serverbevestiging.
- Paklijstitems, afvinkstatussen en sjablonen gebruiken dezelfde bevestigde opslagroute.
- Tijdens opslag zijn de betreffende acties tijdelijk geblokkeerd; bij een serverfout herstelt de reis naar de vorige bevestigde toestand en blijft invoer waar mogelijk staan.
- Hiermee gebruiken alle directe wijzigingen van stops, planning, boekingen, uitgaven, reisleden en paklijst dezelfde versiegestuurde opslagroute.

### Controles

- Alle vijftien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 09:51 CEST — Nabije vluchtplanning via SkyLink

### Vluchten

- Het vluchtformulier accepteert nu een optionele vertrek-IATA, bijvoorbeeld `AMS`.
- Wanneer Flight Status geen vlucht vindt, zoekt de server dezelfde vlucht in het vertrekrooster voor de gekozen datum.
- De Schedule-fallback wordt uitsluitend gebruikt binnen SkyLinks ondersteunde venster van vijf dagen terug tot één dag vooruit; verre reisdatums veroorzaken geen extra provider-call.
- De API-sleutel blijft uitsluitend in de serveromgeving en de browser ontvangt alleen de gemapte vluchtvelden.

### Controles

- Drie nieuwe regressietests controleren het datumvenster, het vereiste `DD-MM-YYYY`-formaat en vluchtnummers met of zonder spatie.

## 2026-09-08 09:46 CEST — Vaste deelnemers voor kostenverdeling

### Oplossing

- Betalers en deelnemers aan een uitgave worden intern opgeslagen met een vaste eigenaars- of `trip_member`-sleutel; zichtbare namen blijven alleen labels.
- Twee reisleden met dezelfde naam blijven hierdoor afzonderlijke personen in de slimme verrekening.
- Een gewijzigde naam verbreekt de koppeling met bestaande uitgaven niet meer.
- Bestaande uitgaven met oude naamwaarden blijven leesbaar en worden bij bewerken of vóór een ledenwijziging naar vaste sleutels omgezet.

### Controles

- Drie regressietests controleren dubbele namen, een naamswijziging en omzetting van oude naamwaarden.
- Alle twaalf geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 01:15 CEST — Beta-ervaring, privacy en accountcontrole

### Publieke ervaring

- De homepage toont nu een visuele productdemo, belangrijkste mogelijkheden, een stappenplan, openbare reisinspiratie en duidelijke acties voor bezoekers en ingelogde gebruikers.
- Runtimefout `Constructor Map requires 'new'` op de homepage opgelost door het kaarticoon expliciet als `MapPinned` te gebruiken in plaats van de globale JavaScript-`Map` constructor.
- Nieuwe migratie `20260908010000_public_trip_api.sql` vervangt directe openbare workspace-reads door beperkte RPC's voor de openbare reisindex en detailpagina. Publieke pagina's werken daardoor lokaal met de publishable key en vereisen geen server-secret.
- De oude anon-policy op `workspaces` wordt verwijderd, zodat een gedeelde workspace nooit het volledige compatibiliteits-JSON aan een anonieme databaseclient vrijgeeft.
- SQL-regressietest `supabase/tests/public_trip_api.sql` controleert de openbare lijst, PIN-validatie en het ontbreken van private workspace- en financiële velden.
- Migratie en SQL-regressietest zijn op 8 september 2026 volledig uitgevoerd.
- De openbare lijst- en detail-RPC zijn daarna rechtstreeks tegen de gekoppelde Supabase-omgeving gecontroleerd met alleen de publishable key; de detailroute antwoordde met `ok` zonder service-role secret.
- Nieuwe publieke pagina `/mogelijkheden` toont per reisfase routes, planning, boekingen, kosten, samenwerking, delen, mobiele hulpmiddelen, exports en Agency-gebruik; de pagina is gekoppeld vanuit homepage en footer.
- De internationale beta-pagina is uitgebreid met concrete testgebieden, een testronde in drie stappen, foutmeldinstructies, veiligheidsadvies en bekende beperkingen.
- Publieke release **Beta 0.8** beschrijft deze wijzigingen in Nederlands en Engels.

### Privacy en accounts

- De privacyverklaring beschrijft gegevenscategorieën, doelen en AVG-grondslagen, ontvangers en doorgiften, bewaarinformatie, rechten, beveiliging, cookies en de klachtroute bij de Autoriteit Persoonsgegevens.
- Accountinstellingen biedt een server-side, machineleesbare JSON-export van het account, profiel, eigen reizen, planning, uitgaven, samenwerkingen, meldingen en documentmetadata.
- Accountverwijdering vereist de expliciete invoer `DELETE`, verwijdert eerst eigen avatar- en bonuploads en verwijdert daarna het Auth-account; gekoppelde databasegegevens volgen de bestaande cascade-relaties.
- De gegevens-export en volledige accountverwijdering zijn op 8 september 2026 praktisch getest en als stabiel bevestigd.
- Voor een volledig openbare productieopening moeten de officiële juridische identiteit, het adres en een werkend privacycontactadres nog worden ingevuld.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- Beveiligingsvelden voor openbare deeltoegang worden uit de account-export gefilterd.

## 2026-09-08 00:23 CEST — Grenzen voor reisteksten

### Gebruikerservaring

- Reisnamen zijn begrensd op 30 tekens en reisomschrijvingen op 375 tekens.
- Het reisnaamveld in Reisinstellingen toont een live teller, bijvoorbeeld `0/30`, net als het omschrijvingsveld.
- Dashboardkaarten, de afteller, het reisbeheer, het Agency-overzicht en publieke reispagina's breken bestaande lange woorden veilig af.
- Invoervelden tonen dezelfde grenzen als de server en database.

### Database

- Nieuwe migratie `supabase/migrations/20260908002000_trip_text_limits.sql` kort bestaande langere waarden gecontroleerd in en voegt databaseconstraints toe.
- De migratie handelt uitgestelde `trips`-triggers af voordat constraints worden gewijzigd, zodat PostgreSQL-fout `55006` niet optreedt.
- Nieuwe regressietest `supabase/tests/trip_text_limits.sql` controleert toegestane grenswaarden en weigert 31/376 tekens.
- Migratie en SQL-test zijn op 8 september 2026 volledig en zonder foutmelding uitgevoerd.

## 2026-09-08 00:15 CEST — Mobiele slimme verrekening

### Oplossing

- Op telefoon toont Slimme verrekening voortaan een compacte kaart per persoon; Saldo krijgt een eigen volledige rij en blijft daardoor volledig binnen het scherm.
- Lange namen en overboekingsregels kunnen afbreken zonder bedragen of andere inhoud buiten de kaart te duwen.
- Op grotere schermen blijft de bestaande overzichtstabel behouden.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De mobiele productiecontrole met lange namen en grote positieve en negatieve bedragen staat nog open.

## 2026-09-08 00:08 CEST — Rolwijziging voor gekoppelde reisleden

### Oplossing

- Een Agency-eigenaar kan de rol van een bestaand reisgenootaccount weer wijzigen.
- De versiegestuurde opslag synchroniseert alleen de nieuwe rol en behoudt de gekoppelde Auth-gebruiker, actieve status en oorspronkelijke acceptatietijd.

### Database

- Nieuwe migratie: `supabase/migrations/20260908000000_update_linked_member_roles.sql`.
- Nieuwe regressietest: `supabase/tests/trip_member_role_updates.sql`.
- Migratie en SQL-test zijn op 8 september 2026 volledig uitgevoerd; de praktische rolwijziging werkt eveneens zoals bedoeld.

## 2026-09-07 23:56 CEST — Compactere reisplanning

### Gebruikerservaring

- De volledige tijdlijn kan nu per dag worden ingeklapt en toont bij iedere dag hoeveel onderdelen erin staan.
- Snelle filters maken vluchten, verblijven, vervoer, huurauto's, activiteiten en eigen planning afzonderlijk zichtbaar.
- De filterbalk blijft op smalle schermen horizontaal bereikbaar en lege filterresultaten krijgen een duidelijke melding in het Nederlands en Engels.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De beheerder heeft bevestigd dat alle aanwezige SQL-migraties en SQL-testbestanden volledig zijn uitgevoerd.
- `SKYLINK_API_KEY` is als Lovable Cloud-secret ingesteld; de sleutel is niet aan repositorybestanden toegevoegd. De live vluchtlookup blijft afzonderlijk te testen.

## 2026-09-07 23:51 CEST — Samenwerken per reis

### Gebruikerservaring

- Bestaande accounts krijgen na opnieuw inloggen toegang tot reizen waarvoor hun geverifieerde e-mailadres als reisgenoot is toegevoegd.
- Gedeelde reizen verschijnen herkenbaar in het dashboard en tellen niet mee voor de persoonlijke reislimiet.
- Traveler en advisor kunnen planning en uitgaven beheren, finance alleen uitgaven en viewer/client alleen de toegestane reisinhoud bekijken.

### Privacy en autorisatie

- Alleen de eigenaar kan reisleden, openbare toegang, archivering en verwijdering beheren.
- Viewer en client ontvangen geen financiële reisgegevens; niet-eigenaren ontvangen geen e-mailadressen van andere reisleden.
- De server bewaart beschermde velden uit de actuele databaseversie wanneer een planner of financieel lid een gemanipuleerde snapshot indient.

### Controles

- De praktijktest met een tweede bestaand account en alle vijf niet-eigenaarsrollen is geslaagd.
- Negen geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-07 23:34 CEST — Internationale testopening

### Vrijgegeven voor testers

- De Nederlandse en Engelse gebruikersstromen zijn gereed voor de internationale betatest.
- Registratie met e-mail, reisbeheer, bestemmingen, planning, boekingen, uitgaven, verdeling, paklijst en exports zijn in de praktijk gecontroleerd.
- Publiek delen is gecontroleerd met en zonder PIN, met financiële informatie aan en uit, met lege en uitgebreide reizen.
- Dashboard, formulieren, uitgaven, publieke reizen en changelog zijn op een echte telefoon gecontroleerd.
- Free-, Pro- en Agency-scenario's zijn doorlopen.

### Bekende beperkingen

- OAuth en automatische app-e-mails maken bewust nog geen deel uit van deze testopening.

### Controles

- De beheerder heeft op 7 september 2026 bevestigd dat de volledige rooktest is geslaagd.
- Zeven geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

### Privacy-audit na vrijgave

- De openbare reisindex toont geen PIN-beveiligde reizen meer; deze blijven alleen via hun directe link en geldige PIN bereikbaar.
- Een ontbrekende profielnaam valt openbaar terug op een neutrale reizigersnaam en gebruikt geen deel van het e-mailadres.
- Gearchiveerde reizen zijn ook via bestaande openbare links niet meer opvraagbaar.
- `20260907234000_restrict_trip_financials.sql` beperkt relationele uitgaven tot owner, traveler, advisor en finance. De migratie en regressietest zijn op 7 september 2026 volledig en zonder foutmelding uitgevoerd.
- De SQL-regressietests voor versiegestuurde reisopslag en persistente meldingen zijn op 7 september 2026 volledig en zonder foutmelding uitgevoerd.

### Samenwerking

- Actieve relationele reisleden krijgen gedeelde reizen in hun eigen dashboard, herkenbaar als gedeelde reis en zonder invloed op hun persoonlijke reislimiet.
- Een bestaande gebruiker kan een openstaande lidregel alleen claimen via het geverifieerde e-mailadres in het Supabase-token; uitnodigingsmail is hiervoor niet nodig.
- Reisrollen worden ook door de server begrensd. Finance kan alleen uitgaven indienen, planners kunnen geen leden, publicatie of archiefstatus wijzigen en viewer/client blijven alleen-lezen.
- Niet-eigenaren ontvangen geen e-mailadressen van andere reisleden. Viewer/client ontvangen ook geen financiële reisgegevens.
- Twee nieuwe autorisatietests brengen het geautomatiseerde totaal op negen. De productiebuild en praktijktest met een tweede account zijn geslaagd.

## 2026-09-07 19:30 CEST — Basis voor internationale beta

### Gebruikerservaring

- Een globale NL/EN-keuze volgt de browsertaal en wordt voor ingelogde gebruikers in het profiel opgeslagen.
- Homepage, e-mailauthenticatie, openbare reizen, hoofdnavigatie, footer, privacy en beta-voorwaarden zijn tweetalig gemaakt.
- Datums en bedragen op openbare reizen volgen de gekozen taal.
- Privacy-informatie en beta-voorwaarden zijn vanuit de footer bereikbaar.
- OAuth-knoppen zijn verborgen zolang OAuth bewust buiten deze beta valt.
- Opslaanknoppen voor het wachtwoord en de reisinstellingen hebben meer afstand tot de velden erboven.
- Alle publieke releasetitels, samenvattingen en wijzigingskaarten zijn in Nederlands en Engels beschikbaar.
- De taalactie toont bezoekers duidelijk `NL` of `EN`. Voor ingelogde gebruikers staat de taalkeuze alleen in Accountinstellingen en wordt deze na opslaan direct overal toegepast.
- Dashboard, abonnementsoverzicht en meldingen volgen nu ook de opgeslagen NL/EN-voorkeur, inclusief acties, statuslabels, lege staten, foutmeldingen en meldingsdatums.
- Het centrale reisbeheerscherm volgt NL/EN voor navigatie, reis- en deelinstellingen, routes, uitgaven, verrekening, paklijst en weerinformatie.
- Tijdlijn en reisgenoten zijn tweetalig gemaakt. De belangrijkste boekingsvelden en validatiemeldingen volgen eveneens de accounttaal; specialistische voertuig- en vluchtinformatie volgt in de resterende vertaalslag.
- Ook specialistische velden voor vluchtstatus, verblijf, huurauto, vervoer en brandstof zijn vertaald. Accountprofiel, wachtwoordbeheer, voorkeuren en planinformatie volgen nu dezelfde taalkeuze.
- Landnamen, weeromschrijvingen, aftel-eenheden en de standaardtagline worden nu ook in het Engels weergegeven wanneer Engels actief is.
- Bestemmingslijsten tonen ieder volgnummer één keer en de opslaanknop in het formulier voor reisonderdelen heeft meer ruimte tot het laatste veld.
- Agency-overzicht, team- en reisrechten en white-labelinstellingen volgen de opgeslagen NL/EN-voorkeur.
- CSV-uitgaven, declaratie-PDF's en reisgidsen gebruiken de gekozen accounttaal voor koppen, categorieën, landen en bestandsnamen.
- Bevestigingen, foutmeldingen, reisstatussen, uitgavencategorieën en bonacties in het reisbeheer zijn verder vertaald.

### Controles

- Zeven geautomatiseerde tests geslaagd.
- Productiebuild voor client, SSR en Cloudflare geslaagd.
- De bestaande waarschuwingen over TanStack `inputValidator()` en de grote hoofdbundle blijven als technisch onderhoud openstaan.

## 2026-09-07 18:50 CEST — Rustigere publieke reisheader

### Gebruikerservaring

- Een reis kan vanuit Reisinstellingen een omschrijving van maximaal 500 tekens krijgen.
- De openbare reis toont deze omschrijving in de hero. Zonder omschrijving verschijnt een korte samenvatting van het aantal bestemmingen en landen.
- De lange bestemmingenketen is uit de hero verwijderd.
- De lijst naast de kaart toont eerst vier bestemmingen en heeft een knop om de volledige route te openen.

### Backend en database

- `20260907170000_trip_description.sql` voegt `trips.description` met een lengtelimiet toe en neemt het veld op in de versiegestuurde opslag.
- Uitvoering van deze migratie is op 7 september 2026 door de beheerder bevestigd; de functionele productiecontrole staat nog open.
- De publieke endpoint levert de omschrijving mee, maar blijft uitgaven, betalers, bonnetjes en boekingsdetails uitsluiten.

## 2026-09-07 18:45 CEST — Changelog gereedmaken voor testopening

### Releaseproces

- Publieke releases hebben nu een herkenbare bèta-versie.
- De changelogpagina toont de actuele testfase en vermeldt dat OAuth en automatische app-e-mails bewust buiten de eerste testopening vallen.
- Automatische tests controleren unieke release-ID's en versies, expliciete tijdzones, nieuwste-eerst-volgorde, volledige teksten en gevoelige termen.
- GitHub Actions voert bij iedere push en pull request de tests en productiebuild uit.
- Een pull-requesttemplate bewaakt handmatige controles, mobiele weergave en beide changeloglagen.

### Controles

- Zeven geautomatiseerde tests geslaagd.
- Productiebuild geslaagd.

## 2026-09-07 18:40 CEST — Publieke reisbeleving en changelog

### Gebruikerservaring

- De publieke reisweergave heeft een hero, interactieve routekaart, klikbare bestemmingen, dagkaarten, verzorgde statusweergaven en een duidelijkere call-to-action gekregen.
- Aankomstdata en verblijfsduur worden openbaar getoond wanneer de eigenaar deze bij een bestemming heeft ingevuld.
- De publieke endpoint blijft beperkt tot expliciet deelbare reisgegevens. Uitgaven, betalers, bonnetjes en boekingsdetails worden niet meegestuurd.
- Een publieke changelogpagina en footerlink zijn toegevoegd.

### Backend en database

- `20260907150000_fix_snapshot_column_ambiguity.sql` corrigeert ambigue kolomverwijzingen in `save_trip_snapshot`.
- `20260907160000_trip_snapshot_versions.sql` voegt versiecontrole toe voor reisopslag en verwijderen en trekt uitvoerrechten op de onbeschermde snapshotfunctie in.
- Reismutaties worden per reis op volgorde verstuurd. Na een conflict of onzekere netwerkfout worden verdere writes geblokkeerd totdat de pagina opnieuw is geladen.

### Controles

- Productiebuild geslaagd.
- Wachtrijtests voor opslagvolgorde, versieoverdracht, blokkeren na fouten en verwijderen geslaagd.
- Praktijktest met twee tabbladen geslaagd.

## 2026-09-07 17:30 CEST — Mobiele formulieren en uitgaven

### Opgelost

- Vertrek- en aankomsttijd blijven binnen de mobiele kolom van het vluchtformulier.
- Het uitgavenoverzicht kan op kleine schermen binnen de kaart horizontaal worden bekeken.
- De opslagfunctie voor het wijzigen van uitgaven is hersteld met expliciete databasekolommen.
- Ingelogde gebruikers zien op een openbare reis `Naar mijn reizen` in plaats van een registratieoproep.

## 2026-09-07 16:30 CEST — Accountoverzicht

### Toegevoegd

- Accountinstellingen tonen het huidige plan, de planlimiet, het totale aantal reizen en het aantal actieve reizen.
- De abonnementsknop past zich aan: Free toont upgrades en betaalde plannen tonen abonnementbeheer.

## Onderhoudsafspraken

- Publieke wijzigingen worden daarnaast toegevoegd aan `src/lib/public-changelog.ts`.
- Technische wijzigingen die geen zichtbaar gedrag veranderen blijven alleen in dit bestand.
- Een item krijgt pas een geslaagde controle wanneer die daadwerkelijk is uitgevoerd.
- Iedere publieke release heeft een unieke bèta-versie en een ISO-tijdstip met expliciete tijdzone.
- `npm test` controleert de publieke releasevolgorde, unieke IDs/versies, volledige teksten en veelvoorkomende gevoelige termen.
- GitHub Actions voert bij iedere push en pull request `npm test` en de productiebuild uit.
