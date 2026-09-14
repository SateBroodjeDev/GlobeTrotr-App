# GlobeTrotr beta-testlijst

> Alle databasemigraties en SQL-regressietests tot en met migratie 960 zijn uitgevoerd. De onderstaande praktische product- en acceptatiecontroles blijven open totdat ze handmatig zijn getest.

## Nieuwe praktische acceptatiecontroles

- [ ] Onderhoud aanzetten met Nederlandse en Engelse reden en eindtijd; controleer de countdown als gewone gebruiker.
- [ ] Controleer dat `/auth` tijdens onderhoud bereikbaar blijft en dat een Corporate Admin na inloggen toegang houdt.
- [ ] Dien vanuit Account → Privacy een verzoek in, controleer direct de statusgeschiedenis en behandel het in Governance → Privacy.
- [ ] Voeg een recensie van minimaal 20 tekens toe, publiceer, wijzig en archiveer haar.
- [ ] Controleer vierkante en staande profielfoto's; de afbeelding moet uitsnijden zonder uitrekken.
- [ ] Controleer Contact en Status in de hoofdnavigatie op telefoon en desktop.
- [ ] Log in en controleer dat Contact en Status ook vanuit het reisplatform direct in de hoofdnavigatie staan.
- [ ] Zoek een bestemming en controleer dat de browser uitsluitend de GlobeTrotr-serverfunctie aanspreekt.
- [ ] Controleer homepage, demo, mogelijkheden en Over op een duidelijke eigen taak en zonder zichtbare regeleindemarkeringen.
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
