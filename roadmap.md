# GlobeTrotr interne roadmap

**Stand: 25 september 2026 · beta 0.9 · release 1.0 gepland voor 1 oktober 2026**

De publieke versie staat in `src/lib/public-roadmap.ts`. Uitrolcommando’s staan uitsluitend in `IMPLEMENTATION_PENDING.md` en `SERVER_OPERATIONS.md`.

## Nu: release 1.0 bewijzen

- [x] Migraties en SQL-tests tot en met 1720 uitgevoerd, inclusief betaalmeldingen, Self-Hosted-voorbereiding en notificatielinks.
- [ ] Reisvergelijker: bewaren, reageren, peiling, stemmen en definitief kiezen met twee echte reisleden testen.
- [ ] Live agenda: bestaande link na een wijziging laten verversen; verblijf en huurauto als hele dag controleren.
- [ ] Offline pakket en vertrekcheck op Android en iOS testen.
- [ ] Agency-subdomein en eigen domein met HTTPS, behouden hostnaam en juiste tenant testen.
- [ ] White-label host vóór en na inloggen testen: naam, logo, kleur en tagline; publieke marketingroutes blijven binnen het Agency-portaal.
- [ ] Eigen Agency-SMTP met echte bezorging testen; uitnodiging en klantformulier controleren op uitsluitend eigen branding, contactadres en portalhost.
- [ ] Automatische boekingsherinneringen testen met NL/EN-profielen, verschillende boekingstypen, boekingsvoorkeur uit en een herhaalde worker-run zonder dubbele melding.
- [ ] Webpush op Node-01 en Node-02 configureren en met gesloten browser ontvangen.
- [ ] Registratie, Google/Discord, passkeys, TOTP, Paddle, privacyverzoeken en ZXCS-mail end-to-end controleren.
- [ ] Bedrijfsmail: archief laden, schermvullend lezen, NL/EN vertalen en definitief verwijderen met beheerrecht testen.
- [ ] Reisdatums vooruit en terug verschuiven; preview en ongewijzigde historische administratie controleren.
- [ ] Mobiele controle op 320, 375 en 430 px uitvoeren.

## Bewust buiten release 1.0

- Eigen Stalwart-mailserver: wachten op vrijgave van TCP 25 en volledige aflever-, ontvangst- en herstelproef. Externe Agency-SMTP is gebouwd en wacht op productieacceptatie.
- Live hotelprijzen: wachten op keuze en goedkeuring van een officiële provider.
- Geselecteerde documenten offline: eerst het huidige beperkte offline pakket accepteren.

## Na 1.0: kleine productuitbreidingen

1. Een veilige reisvariant maken zonder leden, toegang of boekingsgeheimen.
2. Favoriete plaatsen en algemene checklijsten.
3. Apotheken, supermarkten, stations en bezienswaardigheden rond een stop.
4. Check-in- en vertrekmeldingen uit bestaande boekingen verder verfijnen na productieacceptatie van de eerste 24-uursherinnering.
5. Agency-klantportaal, formulieren en contentbibliotheek verfijnen op basis van gebruik.

## Daarna

- Self-Hosted Agency besluit en proeftraject: commerciële broncode-/merklicentie, centrale License API, organisatiebranding, officiële images, updates en support. Eerst het model uit `SELF_HOSTED_AGENCY.md` juridisch en commercieel vaststellen.
- Eén officiële hotelprovider voor beschikbaarheid, totaalprijzen en doorsturen.
- Prijsalerts en flexibele data voor bewaarde kandidaten.
- Vlucht-, autohuur- en activiteitenzoekfuncties.
- Routeoptimalisatie met verplichte preview en bevestiging.
- Optioneel privé reisdagboek met selectief delen.
- Zakelijke goedkeuringen en CO₂-inzicht alleen bij aantoonbare vraag.

## Releasegrens

Een onderdeel is pas **gebouwd** wanneer code, rechten, tests, privacy-impact en documentatie zijn bijgewerkt. Het is pas **uitgerold** na productie-uitrol en pas **afgerond** na een echte praktijktest.
