# Release 1.0 vrijgavebesluit

**Gepland: 1 oktober 2026**

Dit document bevat alleen het uiteindelijke go/no-go-besluit. De uitrol staat in `IMPLEMENTATION_PENDING.md`, de lege acceptatieronde in `TEST_CHECKLIST.md` en serverbeheer in `SERVER_OPERATIONS.md`.

## Go wanneer

- alle regels in `TEST_CHECKLIST.md` een actuele status hebben;
- iedere kritieke controle op **Geslaagd** staat;
- geen kritisch of hoog beveiligingsprobleem openstaat;
- iedere lagere afwijking een incidentnummer, eigenaar en besluit heeft;
- publieke homepage, prijzen, roadmap, updates en juridische teksten overeenkomen met productie.

## No-go wanneer

- een betaling geen recht activeert of een dubbele factuur veroorzaakt;
- registratie of herstelmail structureel faalt;
- tenantisolatie of RLS voor de functies binnen deze release twijfelachtig is;
- een geheime sleutel of mailboxwachtwoord in Git staat;
- migratie, build, healthcheck of kernpraktijktest faalt;
- privacytekst een actieve leverancier of gegevensstroom mist.

## Buiten release 1.0

Agency- en white-labelacceptatie, de eigen Stalwart-mailserver en MX-omschakeling zijn geen blokkade voor 1.0. ZXCS blijft actief als centrale route en fallback. Live hotelprijzen en verdere providerzoekfuncties volgen pas na partner- en privacybeoordeling.

## Vastleggen

Noteer bij vrijgave:

- Git-commit;
- datum en tijd van Node-01 en Node-02;
- uitgevoerde migraties;
- uitvoerder van de praktijktest;
- resterende niet-kritieke afwijkingen;
- definitief go/no-go-besluit.
