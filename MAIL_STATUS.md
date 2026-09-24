# GlobeTrotr mailstatus

**Stand: 24 september 2026**

Dit bestand beschrijft alleen de actuele toestand. Serverbeheer staat in `SERVER_OPERATIONS.md`; de latere mailmigratie in `MAIL_SERVER_DEPLOYMENT.md`.

## Productie

ZXCS is de actieve mailprovider voor SMTP en IMAP. Bevestigd of in gebruik:

- registratie, bevestiging, herstel, magic link, uitnodigingen en betaalmail;
- NL/EN-servicemail op basis van accounttaal;
- HTML-opmaak voor service-, uitnodigings- en kritieke storingsmail;
- bedrijfsmail lezen en versturen via gekoppelde ZXCS-postvakken;
- HTML-editor, centraal beheerde handtekening, gesprekken en bijlagen;
- veilige inline afbeeldingen en toestemming voor externe afbeeldingen;
- ClamAV, bezorgwachtrij, opnieuw proberen en beperkte diagnose.

## Gebouwd maar uitgeschakeld

- zelf gehoste Stalwart-server;
- automatische provisioning van `@globetrotr.nl`-postvakken;
- Agency-SMTP;
- unieke `trip.*@globetrotr.nl`-adressen en boekingsmailconcepten.

`TRIP_BOOKING_MAIL_ENABLED` blijft `false`. Deze functies horen niet bij release 1.0.

## Blokkades voor eigen mailhosting

- Hetzner moet uitgaand TCP 25 vrijgeven;
- PTR/rDNS, MX, SPF, DKIM, DMARC, MTA-STS en TLS-RPT moeten kloppen;
- IMAPS, submission en server-to-server SMTP moeten praktisch werken;
- bestaande ZXCS-mail moet gecontroleerd worden gemigreerd;
- aflevering naar meerdere providers, spamreputatie, back-up en herstel moeten slagen;
- terugval naar ZXCS moet getest zijn.

Tot die tijd worden MX-records niet gewijzigd en blijft ZXCS actief.

## Productgrenzen

- Geen stille scan van volledige externe mailboxen.
- Alleen bewust doorgestuurde boekingsmail mag later worden verwerkt.
- Een herkend bericht wordt nooit zonder menselijke bevestiging een boeking.
- DNS, PTR, reputatie en externe back-ups blijven infrastructuurbeheer.
