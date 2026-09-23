# GlobeTrotr-mailstatus

**Stand: 23 september 2026**

Dit document maakt onderscheid tussen productie, lokaal gereed en nog te accepteren werk. De concrete uitrolvolgorde staat in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md). De installatie van de eigen server staat in [MAIL_SERVER_DEPLOYMENT.md](MAIL_SERVER_DEPLOYMENT.md).

## Werkt nu in de productie-beta

De huidige productie gebruikt de bestaande ZXCS-postvakken via SMTP en IMAP. De volgende onderdelen zijn door de eigenaar werkend bevestigd of al uitgerold:

- transactionele mail via de beveiligde SMTP-relay;
- registratie-, bevestigings-, herstel-, magic-link-, uitnodigings-, beveiligings- en betaalmail;
- Supabase Auth-links via het GlobeTrotr-portaal;
- Nederlandse of Engelse servicemail op basis van de opgeslagen accounttaal;
- nette HTML-opmaak voor servicemail, uitnodigingen en kritieke storingen;
- bedrijfsmail lezen en verzenden vanuit het portaal;
- HTML-editor en centraal beheerde HTML-handtekening;
- gekoppelde persoonlijke en gedeelde IMAP/SMTP-postvakken;
- gesprekken, bijlagen, veilige inline afbeeldingen en bewuste toestemming voor externe afbeeldingen;
- ClamAV-controle van bijlagen, bezorgwachtrij, opnieuw proberen en beperkte foutdiagnose;
- meldingen voor nieuwe bedrijfsmail en communicatiegebeurtenissen.

Deze productiefunctionaliteit blijft via ZXCS werken totdat de gecontroleerde MX-overgang naar Stalwart is voltooid.

## Uitgerold, productieacceptatie nog afronden

Deze onderdelen zijn met releasecommit `9a67ef0` op Node-01 en Node-02 uitgerold. De SQL-migraties en tests zijn uitgevoerd; de genoemde praktijktests en de afzonderlijke mailserverinrichting zijn nog nodig:

| Onderdeel | Code gereed | Nog nodig |
| --- | --- | --- |
| Agency-klantformulieren | Ja | Echte NL/EN-formulieren testen |
| Zelf gehoste Stalwart-mailserver | Ja | Node-02 configureren, DNS/mailauthenticatie en back-up/herstel testen |
| Mailserverstatus en provisioningherstel | Ja | Health-URL en fout/herstelproef controleren |
| Boekingsmail per reis | Ja | Echte hotel-/vluchtmail testen |

Na uitrol kan Corporate Admin persoonlijke, gedeelde en automatische postvakken op de eigen server laten maken. Een reisplanner kan dan een uniek `trip.*@globetrotr.nl`-adres aanmaken, afzenders en bewaartermijn instellen, herkende gegevens corrigeren en het concept bewust als boeking toevoegen of afwijzen. Dubbele berichten, wijzigingen en annuleringen worden voor controle gemarkeerd. Intrekken stopt verdere verwerking.

## Vereist vóór de MX-overgang

- PTR/rDNS van Node-02 naar `mail.globetrotr.nl`;
- geldige A/AAAA-keuze, MX, SPF, DKIM, DMARC, MTA-STS en TLS-RPT;
- Stalwart-beheerder met MFA en een beperkt provisioningtoken;
- werkende IMAPS, SMTP submission en server-to-server SMTP;
- migratie en telling van bestaande ZXCS-mappen en berichten;
- afleverproeven naar meerdere externe providers en controle van spam/reputatie;
- versleutelde externe back-up en een geslaagde herstelproef;
- terugval naar het bestaande ZXCS-MX-record getest en gedocumenteerd.

Zolang deze punten niet zijn afgerond, blijft ZXCS de actieve mailprovider en mag de bestaande MX-configuratie niet worden verwijderd.

## Bewuste grenzen

- GlobeTrotr scant geen volledige persoonlijke Gmail-, Google Workspace- of andere externe mailbox om boekingen te zoeken.
- Boekingsmail verwerkt alleen berichten die bewust naar het unieke reisadres worden gestuurd.
- Een herkend bericht wordt nooit zonder bevestiging als boeking opgeslagen.
- Corp Admin maakt binnen GlobeTrotr een postvakaccount aan; DNS, PTR en reputatiebeheer blijven infrastructuurhandelingen.
- De applicatie is geen algemene spamfilter- of mailarchiefdienst voor externe domeinen.

## Definitie van klaar

Mail is volledig overgezet wanneer beide nodes dezelfde commit draaien, alle mailchecks in [TEST_CHECKLIST.md](TEST_CHECKLIST.md) praktisch zijn uitgevoerd, de eigen server minimaal enkele dagen stabiel ontvangt en verzendt en de terugvalproef is geslaagd. De SQL-set 1550–1580 is al uitgevoerd.
