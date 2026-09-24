# GlobeTrotr Self-Hosted Agency

**Technische status: verborgen basis gereed · juridische en commerciële besluiten vereist vóór livegang**

Dit document beschrijft een commerciële editie waarmee een reisorganisatie GlobeTrotr op eigen infrastructuur draait. De klant gebruikt zijn eigen domein, database, opslag, mail en beheerders, terwijl het product herkenbaar GlobeTrotr blijft. De licentie wordt jaarlijks of eenmalig bij GlobeTrotr gekocht en centraal beheerd via `globetrotr.nl`.

## 1. Eerst het licentiemodel kiezen

De repository heeft momenteel geen `LICENSE`-bestand. Publiek leesbare broncode is daarmee niet automatisch open source; het auteursrecht blijft zonder expliciete licentie voorbehouden.

Een echte open-sourcelicentie kan commercieel gebruik en zelf hosten niet verbieden. De Open Source Definition vereist vrije herdistributie en staat geen beperking op zakelijk gebruik toe. Er zijn daarom drie modellen:

1. **Source-available commerciële licentie — aanbevolen voor het beschreven doel.** De broncode mag worden bekeken en eventueel voor evaluatie worden gebruikt. Productiehosting, dienstverlening aan derden en het GlobeTrotr-merk vereisen een gekochte licentie.
2. **Open core.** Een beperkte kern krijgt een OSI-licentie; Agency, licentiebeheer, officiële images, updates en support blijven commercieel. Dit vraagt een harde technische splitsing en extra onderhoud.
3. **Volledig open source plus merklicentie.** Iedereen mag de software zelf hosten onder de gekozen open-sourcelicentie, maar alleen betalende installaties mogen de namen en logo's van GlobeTrotr gebruiken en krijgen officiële builds, updates en support. Dit beperkt ongebrande forks niet.

Voor “het blijft GlobeTrotr en een bedrijf koopt het recht om het zelf te hosten” past model 1 het nauwst. Laat een gespecialiseerde jurist vóór publicatie de softwarelicentie, GlobeTrotr-merklicentie en voorwaarden opstellen. Gebruik tot dat besluit niet de claim “open source” op de website; “source available” of “broncode inzichtelijk” is preciezer.

## 2. Product dat de klant koopt

Werk met twee verkoopvormen van hetzelfde productrecht:

| Product                      | Recht                                                     | Updates                                                        | Centrale controle                                            |
| ---------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Self-Hosted Agency Annual    | één productie-installatie voor één juridische organisatie | zolang het jaarabonnement actief is                            | periodieke licentielease                                     |
| Self-Hosted Agency Perpetual | permanent gebruik van de gekochte hoofdversie             | bijvoorbeeld twaalf maanden inbegrepen; daarna apart onderhoud | activatie plus getekend permanent recht voor die hoofdversie |

Leg daarnaast expliciet vast:

- aantal productie- en testinstallaties;
- inbegrepen gebruikers, Agencies of modules;
- gebruik van het GlobeTrotr-merk en verplichte productvermelding;
- overdracht, verkoop, hosting voor derden en managed hosting;
- supportniveau, responstijden en ondersteunde versies;
- beveiligingsupdates voor een eenmalige licentie;
- gevolgen van terugbetaling, wanbetaling en misbruik;
- eigendom van klantdata en verantwoordelijkheid voor back-ups.

Een eenmalige licentie moet geen onbeperkte toekomstige hoofdversies beloven. Geef bijvoorbeeld recht op `1.x` en bied onderhoud of een upgradeprijs voor `2.x`.

## 3. Centrale onderdelen op globetrotr.nl

### Openbare verkooppagina

Nieuwe route: `/self-hosted`.

Deze pagina bevat:

- voor wie Self-Hosted Agency bedoeld is;
- verschil met het bestaande gehoste Agency-plan;
- jaarlijkse en eenmalige prijs;
- wat wel en niet inbegrepen is;
- infrastructuureisen en gedeelde verantwoordelijkheid;
- demo of screenshots;
- beveiligingsupdates, support en versiebeleid;
- privacyuitleg over beperkte licentietelemetrie;
- offerte/contact voor maatwerk;
- Paddle-checkout op het goedgekeurde GlobeTrotr-domein.

### Klantportaal

Nieuwe beveiligde route: `/self-hosted/manage` op `portal.globetrotr.nl`.

Een licentiehouder kan hier:

- organisatie- en factuurgegevens zien;
- licentieplan, looptijd en onderhoudsrecht zien;
- een licentiesleutel eenmalig aanmaken en daarna roteren;
- actieve installaties, domeinen, versie en laatste controle zien;
- een oude installatie intrekken;
- een testinstallatie aanwijzen;
- installatiehandleiding en passende release downloaden;
- Paddle-facturen openen;
- support en beveiligingsmeldingen bekijken;
- een jaarlijkse licentie beheren of verlengen.

### Corporate Admin

Nieuwe sectie: `/corporate-admin/licenses`.

Bevoegde medewerkers beheren daar:

- klanten en juridische organisaties;
- Paddle-customer, transaction en subscription-koppeling;
- type licentie, versiegrens, modules, seats en installatielimiet;
- actieve, verlopen, opgeschorte, terugbetaalde en ingetrokken licenties;
- installaties, domeinen, versies en laatste heartbeat;
- handmatige proeflicenties met verplichte reden en einddatum;
- sleutelrotatie zonder leesbare oude sleutel;
- supportniveau en onderhoudsperiode;
- append-only auditlog van iedere beheeractie;
- waarschuwingen voor dubbele activatie, oude versies en mislukte controles.

Een Corporate Admin mag nooit de volledige licentiesleutel of secrets van een klant teruglezen.

## 4. Licentiedatabase

Voeg in het centrale GlobeTrotr-project afzonderlijke tabellen toe:

- `self_hosted_customers`: organisatie, eigenaar, factuur- en supportstatus;
- `self_hosted_licenses`: product, status, uitgifte, verval, permanente versiegrens en limieten;
- `self_hosted_license_secrets`: alleen Argon2id- of vergelijkbare hashes en sleutelprefix;
- `self_hosted_installations`: willekeurige installation-id, omgeving, domein, versie, activatie en laatste controle;
- `self_hosted_entitlements`: modules en kwantitatieve rechten;
- `self_hosted_license_events`: idempotente Paddle- en lifecycle-events;
- `self_hosted_release_channels`: stabiel, onderhoud en eventueel preview;
- `self_hosted_audit_log`: onveranderbare actor, actie, doel, reden en resultaat.

RLS geeft de licentiehouder uitsluitend toegang tot de eigen organisatie. Uitgifte, activatie en Paddle-verwerking lopen via service-role-only functies. Bewaar ruwe sleutels nooit in de database of logs.

## 5. License API

Publiceer een versieerbare API onder `https://globetrotr.nl/api/licensing/v1`:

| Endpoint             | Doel                                                         |
| -------------------- | ------------------------------------------------------------ |
| `POST /activate`     | licentiesleutel één keer koppelen aan een nieuwe installatie |
| `POST /lease`        | kortlevend getekend gebruiksbewijs vernieuwen                |
| `POST /deactivate`   | installatie gecontroleerd vrijgeven                          |
| klantportaal         | oude sleutel intrekken en een nieuwe eenmalig tonen          |
| `POST /entitlements` | modules, limieten, versiegrens en onderhoudsrecht ophalen    |
| `GET /releases`      | passend, getekend release-manifest ophalen                   |
| `POST /diagnostics`  | minimale opt-in diagnose voor support aanleveren             |

Gebruik voor de menselijke aankoop een licentiesleutel met herkenbaar prefix, bijvoorbeeld `gt_sh_...`. Bij activatie wisselt de installatie die in voor:

- een willekeurige installation-id;
- een per-installatie refresh secret, alleen lokaal versleuteld opgeslagen;
- een door GlobeTrotr asymmetrisch getekende licentielease;
- de actuele rechten en toegestane versie.

De installatie controleert de handtekening lokaal met een ingebouwde publieke sleutel. Daardoor hoeft zij niet bij iedere paginaweergave online te zijn. Vernieuw de lease bijvoorbeeld dagelijks met een geldigheid van veertien dagen.

Beveilig de API met:

- TLS, strikte schema-validatie en maximale bodygroottes;
- gehashte secrets, constante-tijdvergelijking en sleutelrotatie;
- rate limits per sleutel, installatie en IP;
- idempotency keys voor activatie en deactivatie;
- replaybescherming, nonce en kloktolerantie;
- getekende antwoorden met key-id voor latere signing-keyrotatie;
- generieke foutmeldingen en gestructureerde, geheimvrije auditlogs;
- afzonderlijke productie- en testrechten.

De API-sleutel van GlobeTrotr zelf komt nooit in de browser of klantimage. De klant krijgt uitsluitend een licentiesleutel en daarna installationspecifieke credentials.

## 6. Gedrag van een zelfgehoste installatie

Voeg een expliciete distributiemodus toe:

```dotenv
GLOBETROTR_DISTRIBUTION=self-hosted-agency
GLOBETROTR_LICENSE_SERVER=https://globetrotr.nl/api/licensing/v1
GLOBETROTR_LICENSE_KEY=gt_sh_eenmalig_zichtbare_sleutel
GLOBETROTR_INSTALLATION_ENV=production
PUBLIC_APP_URL=https://travel.voorbeeldbureau.nl
```

Na activatie wordt `GLOBETROTR_LICENSE_KEY` vervangen door het installationspecifieke secret in Docker Secrets, een secrets manager of een root-only bestand. Het installatieprogramma weigert secrets naar compose-output of logs te schrijven.

De lokale installatie krijgt:

- installatiewizard met database-, domein-, mail-, opslag- en licentiecheck;
- startupcontrole zonder elke start afhankelijk te maken van globetrotr.nl;
- dagelijkse leasevernieuwing via de worker;
- zichtbaar licentie- en updateoverzicht voor de lokale hoofdbeheerder;
- waarschuwingen ruim vóór afloop;
- veilige export van alle klantdata en configuratie;
- healthchecks voor web, worker, database, mail, opslag en licentie;
- migraties en rollbackinstructies per ondersteunde release.

Bij een tijdelijk onbereikbare licentieserver blijft de installatie gedurende de getekende grace-periode volledig werken. Na afloop blokkeer je geen toegang tot of export van klantdata. Beperk eerst alleen nieuwe commerciële beheeracties en toon een duidelijke herstelroute. Een permanente licentie blijft binnen de toegestane hoofdversie lokaal verifieerbaar; alleen updates en support kunnen verlopen.

## 7. Branding en organisatie-instellingen

Hergebruik `agency_settings`, maar scheid drie niveaus:

1. **Productidentiteit:** GlobeTrotr-naam, beveiligingsmeldingen, versienummer en licentiepagina. Alleen een officiële release kan dit wijzigen.
2. **Installatieorganisatie:** bedrijfsnaam, juridisch adres, supportadres, standaarddomein, taal, valuta, tijdzone, mailafzender, logo, kleuren en voettekst.
3. **Agency- of reisbranding:** bestaande workspace- en reisinstellingen.

Corporate Admin van de klant krijgt een pagina **Organisatie & merk** voor niveau 2. Houd altijd een afgesproken vermelding zichtbaar, bijvoorbeeld “GlobeTrotr · hosted by Reisbureau X” of “Powered by GlobeTrotr”. Leg toegestane naamvoering, logo-opbouw, favicon, e-mailfooter en domeinen vast in aparte merkrichtlijnen.

Voorkom een generieke white-labelbelofte als het product GlobeTrotr moet blijven. Volledige verwijdering van GlobeTrotr kan later een duurdere OEM-licentie worden met afzonderlijke voorwaarden.

## 8. Paddle en levering

Maak in Paddle één product met minimaal:

- jaarlijkse terugkerende prijs;
- eenmalige prijs;
- eventueel onboarding/support als afzonderlijke eenmalige post.

De bestaande webhook verwerkt pas `transaction.completed` als betaling. Daarna:

1. koppel Paddle-customer en transactie aan de aangemelde organisatie;
2. maak de licentie idempotent aan;
3. geef nog geen installatie namens een browsercallback vrij;
4. stuur een nette transactionele mail met portallink;
5. laat de klant in het portaal zelf de eerste sleutel genereren;
6. verwerk refund, chargeback, cancellation, pause en past-due zonder data te verwijderen;
7. gebruik het Paddle-customerportal voor facturen, betaalmethode en abonnementsbeheer.

Paddle Billing genereert in dit model niet zelf de licentiesleutel. GlobeTrotr levert die na een geverifieerde webhook. Jaarlijks en eenmalig kunnen daardoor dezelfde License API gebruiken met andere eind- en onderhoudsrechten.

## 9. Releases en distributie

Publiceer officiële, ondertekende containerimages in een private registry of via een geauthenticeerde downloadroute. Een publiek Git-repository alleen is geen betrouwbare commerciële distributielaag.

Iedere release krijgt:

- semantische versie en ondersteunde databaseversie;
- immutable image digest;
- ondertekend manifest en changelog;
- migratie- en rollbackpad;
- minimale Node, PostgreSQL/Supabase en opslagversie;
- support-einddatum;
- SBOM en bekende beveiligingsadviezen;
- aparte stable- en optionele previewkanalen.

De updater controleert het recht op die versie, toont eerst impact en back-upvereisten en voert nooit stil een hoofdupgrade uit.

## 10. Privacy, beveiliging en verantwoordelijkheden

De zelfhostende organisatie is normaal gesproken verwerkingsverantwoordelijke voor reizigers-, medewerkers- en klantgegevens in haar installatie. GlobeTrotr verwerkt centraal alleen wat nodig is voor verkoop, licentie, updates, support en beveiliging. Leg dit per feitelijke gegevensstroom vast; beloof niet automatisch dat GlobeTrotr bij zelfhosting nooit verwerker is.

Stuur standaard uitsluitend deze minimale licentietelemetrie:

- installation-id en organisatie-id;
- productversie en releasekanaal;
- geverifieerde hoofddomeinhash of expliciet geregistreerd domein;
- activatie- en laatste controletijd;
- technische compatibiliteitsstatus;
- aantallen die contractuele limieten afdwingen, zonder namen of reisinhoud.

Stuur geen reizigers, reizen, boekingen, mailboxinhoud, IP-historie of gebruikerslijsten naar de licentieserver. Diagnostiek met aanvullende gegevens is uitgeschakeld totdat de lokale beheerder die bewust voor een supportcase deelt.

Benodigd vóór verkoop:

- commerciële software- en merklicentie;
- aparte Self-Hosted-voorwaarden en support/SLA;
- gegevensverwerkingsovereenkomst waar GlobeTrotr werkelijk verwerker is;
- privacyverklaring voor aankoop, licentiecontrole en support;
- subverwerkerslijst;
- security- en responsible-disclosurebeleid;
- export-, beëindigings- en verwijderprocedure;
- controle van alle dependencylicenties en distributieverplichtingen;
- merkregistratie of ten minste professioneel merkenadvies.

## 11. Bouwvolgorde

### Fase A — besluit en contract

- licentiemodel, prijzen, installatielimiet, versiebeleid en support kiezen;
- jurist laat licentie, merkgebruik, voorwaarden en privacy aansluiten;
- dependency- en auteursrechtinventaris afronden;
- Paddle-producten in sandbox maken.

### Fase B — centraal minimumproduct

- licentietabellen, RLS, auditlog en Corporate Admin bouwen;
- Paddle-fulfilment voor jaarlijks en eenmalig bouwen;
- klantportaal met eenmalige sleutelweergave en installatiebeheer bouwen;
- License API, hashing, signing keys, rate limits en rotatie bouwen;
- `/self-hosted` en checkout bouwen.

### Fase C — distributie geschikt maken

- distributiemodus en configuratielaag invoeren;
- hardcoded GlobeTrotr-domeinen inventariseren en per rol configurabel maken;
- organisatiebranding boven bestaande Agency-branding plaatsen;
- installatie- en upgrade-CLI bouwen;
- officiële images, manifestsigning, SBOM en releasekanaal inrichten;
- centraal beheerde providers vervangen door door de klant ingestelde credentials.

### Fase D — proefinstallatie

- volledig nieuwe VPS en database gebruiken;
- jaarlijkse, permanente, verlopen en ingetrokken licentie testen;
- internetuitval langer en korter dan de grace-periode testen;
- sleutelverlies, rotatie, domeinwijziging en verhuizing testen;
- backup, restore, upgrade en rollback uitvoeren;
- tenantisolatie, mail, push, OAuth, Paddle, opslag en Agency-domeinen testen;
- externe securityscan en licentiecontrole uitvoeren.

### Fase E — gecontroleerde verkoop

- eerst één design partner met handmatige onboarding;
- gebruik, supportlast en installatieproblemen meten;
- documentatie en defaults verbeteren;
- pas daarna self-service aankoop en automatische provisioning openen.

## 12. Definitie van klaar

Self-Hosted Agency is pas verkoopbaar wanneer:

- de juridische licentie en merkregels gepubliceerd zijn;
- betaling nooit zonder geverifieerd Paddle-event een licentie activeert;
- sleutel-, activatie-, lease-, intrek- en refundtests slagen;
- geen centraal geheim in frontend, image, repository of log verschijnt;
- klantdata beschikbaar en exporteerbaar blijft tijdens een licentiestoring;
- installatie vanaf een lege server reproduceerbaar is;
- update en rollback aantoonbaar werken;
- GlobeTrotr- en klantbranding in app, mail en publieke pagina's kloppen;
- privacydocumenten de werkelijke centrale gegevensstroom beschrijven;
- support, securitymeldingen en ondersteunde versies operationeel zijn;
- minstens één externe proefinstallatie een volledige acceptatieronde heeft doorlopen.

## 13. Reeds voorbereide technische kern

De repository bevat inmiddels, maar publiceert nog niet:

- migratie 1710 met klanten, licenties, gehashte sleutels, installaties, events en audit;
- een standaard uitgeschakelde featureflag `self_hosted.sales`;
- activatie-, lease-, entitlement- en deactivatie-endpoints onder `/api/licensing/v1`;
- idempotente activatie die bij een veilige herhaling een nieuw installatiegeheim uitgeeft;
- een klantpagina op `portal.globetrotr.nl/self-hosted/manage` met sleutelrotatie en installatie-intrekking;
- Corporate Admin-beheer onder `/corporate-admin/licenses`;
- een openbare `/self-hosted`-pagina die zolang de flag uitstaat alleen “in ontwikkeling” toont;
- Ed25519-leaseondertekening, configuratiestatus in Corporate Admin en een lokale sleutelgenerator via `npm run license:keys`.

Paddle-producten, prijzen, automatische Paddle-fulfilment, API-rate-limiting, officiële containerregistry, updater, lokale verificatie in de distributie en juridische publicatieteksten blijven geblokkeerd totdat de besluiten uit fase A zijn genomen.

## 14. Wat nu nog niet live zetten

Dit product begint pas na de huidige release- en productiestabilisatie. Bouw vóór het juridische besluit geen client-side licentiecheck, kill switch of losse API-keypagina. Die onderdelen zijn eenvoudig te omzeilen, kunnen klanten van hun eigen data afsluiten en leggen het verkeerde datamodel vast.

De eerste concrete vervolgstap na release 1.0 is daarom een besluitdocument van één pagina met: model 1, 2 of 3; jaarlijks en eenmalig tarief; installatielimiet; verplichte GlobeTrotr-vermelding; updateperiode; supportniveau; en grace-periode.

## 15. Technische voorbereiding uitrollen zonder verkoop te openen

Deze stappen mogen met een normale GlobeTrotr-release mee. Zij maken tabellen en beheer gereed, maar houden de openbare verkoop uit:

1. voer migratie `20260908171000_self_hosted_agency_licensing.sql` uit;
2. voer `supabase/tests/self_hosted_agency_licensing.sql` uit;
3. rol Node-01 volgens `SERVER_OPERATIONS.md` uit;
4. laat `self_hosted.sales` in `platform_feature_flags` op `false` en `internal` staan;
5. open `/corporate-admin/licenses` en controleer dat de pagina laadt;
6. controleer `/self-hosted`: de pagina vermeldt alleen dat het product in ontwikkeling is;
7. stel nog geen signing-private-key in als geen enkele licentie geactiveerd mag worden.

Voor een besloten proef genereert een beheerder één keer op een beveiligde werkplek:

```bash
npm run license:keys
```

Zet uitsluitend `SELF_HOSTED_LICENSE_SIGNING_PRIVATE_KEY` in de geheime Node-01-omgeving. De publieke sleutel is bestemd voor de officiële klantdistributie. Bewaar beide buiten Git en loguitvoer. Herbouw Node-01, controleer in Corporate Admin dat ondertekening als geconfigureerd wordt getoond en maak vervolgens handmatig één proeflicentie. De ruwe klant- en installatiegeheimen worden maar één keer getoond.

De openbare verkoop mag pas aan door `self_hosted.sales` op `enabled=true,audience='all'` te zetten nadat de juridische teksten, prijzen, Paddle-fulfilment, rate limiting en officiële distributie gereed zijn. De featureflag alleen vormt geen volledige livegang.

## Bronnen voor het besluit

- [Open Source Definition](https://opensource.org/osd): officiële criteria, waaronder vrije herdistributie en geen beperking op zakelijk gebruik.
- [OSI FAQ over gebruiksbeperkingen](https://opensource.org/faq): waarom een echte open-sourcelicentie commercieel gebruik niet mag verbieden.
- [Paddle voor digitale producten](https://developer.paddle.com/get-started/how-paddle-works/digital-products/): eenmalige softwareverkoop en fulfilment na `transaction.completed`.
- [Paddle Customer Portal](https://developer.paddle.com/concepts/sell/customer-portal/): facturen, betalingsgegevens en abonnementsbeheer.
- [Paddle Billing-migratie en fulfilment](https://developer.paddle.com/migrate/start/): license keys en toegang in Paddle Billing zelf na geverifieerde webhooks leveren.
