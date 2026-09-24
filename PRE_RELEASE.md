# Release 1.0 vrijgavebesluit

**Gepland: 1 oktober 2026**

Dit document bevat alleen het uiteindelijke go/no-go-besluit. De uitvoering en praktijktests staan in `IMPLEMENTATION_PENDING.md`; servercommando’s in `SERVER_OPERATIONS.md`.

## Go wanneer

- migraties en tests 1660, 1670, 1680 en 1690 slagen;
- `npm run verify`, `npm run build` en `git diff --check` slagen;
- Node-01 en Node-02 gezond zijn en dezelfde releasecommit draaien;
- registratie, login, Paddle, ZXCS-mail en privacyverzoeken werken;
- Reisvergelijker, live agenda, offline gebruik, reisdatumverschuiving, bedrijfsmail, mobiel en Agency-domeinen praktisch zijn getest;
- webpush werkelijk met een gesloten tabblad is ontvangen;
- geen kritisch of hoog beveiligingsprobleem openstaat;
- publieke homepage, prijzen, roadmap, updates en juridische teksten overeenkomen met productie.

## No-go wanneer

- een betaling geen recht activeert of een dubbele factuur veroorzaakt;
- registratie of herstelmail structureel faalt;
- tenantisolatie, RLS of Agency-domeinbinding twijfelachtig is;
- een geheime sleutel of mailboxwachtwoord in Git staat;
- migratie, build, healthcheck of kernpraktijktest faalt;
- privacytekst een actieve leverancier of gegevensstroom mist.

## Buiten release 1.0

De eigen Stalwart-mailserver, Agency-SMTP en MX-omschakeling zijn geen blokkade voor 1.0. ZXCS blijft actief. Live hotelprijzen en verdere providerzoekfuncties volgen pas na partner- en privacybeoordeling.

## Vastleggen

Noteer bij vrijgave:

- Git-commit;
- datum en tijd van Node-01 en Node-02;
- uitgevoerde migraties;
- uitvoerder van de praktijktest;
- resterende niet-kritieke afwijkingen;
- definitief go/no-go-besluit.
