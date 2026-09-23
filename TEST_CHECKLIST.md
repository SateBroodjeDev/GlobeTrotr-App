# GlobeTrotr productiechecklist

**Actuele stand: 23 september 2026.** SQL-migraties en tests tot en met 1630 zijn volgens de laatste bevestiging uitgevoerd. De bijbehorende web-, worker- en productieacceptatie staan nog open. Rond items pas na een echte productieproef af.

## 1. Uitrol

- [x] Migraties en tests tot en met 1630 uitgevoerd (bevestigd door eigenaar).
- [x] Releasecommit `9a67ef0` uitgerold op Node-01 en Node-02 (bevestigd door eigenaar).
- [ ] Test Pro/Agency-vluchtcontrole binnen zeven dagen: basislijn zonder melding, ongewijzigd zonder melding, relevante wijziging eenmaal gemeld, voorkeur uit respecteren en provideruitval begrensd opnieuw proberen.
- [ ] Configureer één VAPID-sleutelpaar, zet push per apparaat aan en uit, ontvang een algemene push met gesloten tabblad en controleer retry en verwijdering van een verlopen endpoint.
- [ ] Bekijk een bibliotheekitem vooraf en voeg dezelfde versie eenmaal toe aan een reis en eenmaal aan een conceptofferte; controleer dat een tweede klik geen duplicaat maakt en dat een nieuwe bibliotheekversie bestaande reizen niet wijzigt.
- [ ] Laat lokaal `npm run verify` en `git diff --check` slagen.
- [ ] Controleer op Node-01 Compose en de Caddy-configuratie vóór de herbouw.
- [ ] Controleer na de uitrol dat web en Caddy gezond zijn en dezelfde commit gebruiken.
- [ ] Controleer `globetrotr.nl`, `portal.globetrotr.nl`, de Paddle-webhook en een geldige live agenda-feed.

## 2. Website en portal

- [ ] Homepage, mogelijkheden, demo, prijzen, About, contact, status, privacy, voorwaarden, roadmap en updates werken in NL en EN.
- [ ] Registreren, inloggen en Reizen openen vanaf de website op `portal.globetrotr.nl`.
- [ ] Logo, Website-link en publieke menu- en footerlinks openen vanaf het portal `globetrotr.nl`.
- [ ] Private routes blijven op het portal; publieke portalroutes verwijzen naar het hoofddomein.
- [ ] Oude private links op `globetrotr.nl` en `dashboard.globetrotr.nl` verwijzen met behoud van pad naar het portal.
- [ ] Portalresponses bevatten `X-Robots-Tag: noindex, nofollow`; publieke pagina’s hebben correcte canonicals en metadata.
- [ ] Mobiel menu, toetsenbordnavigatie, focus, contrast, touchdoelen en smalle schermen zijn bruikbaar zonder overlap of horizontale overflow.

## 3. Account en beveiliging

- [ ] Nieuw e-mailaccount: zichtbare Turnstile, duidelijke bestaande-accountfout, bevestigingsmail en complete profielstroom.
- [ ] Google en Discord: aanmelden, bestaand account koppelen/ontkoppelen en terugkeer naar Account.
- [ ] Wachtwoord, recovery, magic link en e-mailwijziging werken via de portal-tokenroute.
- [ ] Bestaande en nieuwe passkey werken met dezelfde RP-ID; TOTP, herstel- en supportstroom werken.
- [ ] Auth-mails zijn netjes opgemaakt en gebruiken de gekozen NL/EN-taal.
- [ ] Meldingsvoorkeuren, gegevens-export, accountverwijdering en privacyverzoek werken en geven één begrijpelijke melding.

## 4. Reizen

- [ ] Voeg minimaal twee verblijf-, vlucht-, vervoer-, huurauto- of activiteitsopties toe; vergelijk prijs en voorwaarden; archiveer een kandidaat en zet één keuze om naar exact één boeking. Herhaal kiezen en bevestig dat geen dubbele boeking ontstaat.
- [ ] Reis maken, wijzigen, dupliceren, omkeren, omslagfoto, leden, taken en vandaag-overzicht werken.
- [ ] Bewaar een reis offline, open meerdere reisdagen in vliegtuigmodus, voeg een uitgave toe, synchroniseer deze precies eenmaal na herstel, controleer dat bestaande bedragen/boekingscodes/documenten ontbreken en bevestig dat uitloggen pakket én wachtrij wist.
- [ ] Planning, boekingen, documenten, paklijst, routekaart en kaartlagen werken op telefoon en desktop.
- [ ] Uitgaven, betaald-door-keuze, filters, categorieën, budgettempo en verrekening blijven binnen hun vak.
- [ ] GPX, PDF/reisgids, JSON en losse ICS-download leveren geldige bestanden met echte reisdata.
- [ ] Live agenda-URL geeft zonder browsersessie `200`, `Content-Type: text/calendar` en geldige VEVENTs; intrekken maakt de oude URL ongeldig.
- [ ] Publieke reis toont een rustig reisschema, passende kaart en alleen bedoelde openbare data.
- [ ] Uitnodiging wordt precies eenmaal, met branding en werkende portal-link, verstuurd.
- [ ] Een uniek reisadres wordt geprovisioned; toegestane afzenders, herkenning, wijziging/annulering, deduplicatie, veldcontrole, omzetting naar precies één boeking, intrekken en bewaartermijn werken.

## 5. Betaling

- [ ] Free naar Pro en Agency werkt voor terugkerend en eenmalig betalen.
- [ ] Korting en een betaling van €0,00 worden correct verwerkt zonder constraintfout.
- [ ] Losse vooruitbetaalde maanden stapelen op zonder dubbel verlengen bij hetzelfde webhookevent.
- [ ] Een Paddle-factuur ontstaat pas bij de voltooide Paddle-transactie, niet bij openen of klikken.
- [ ] Paddle-transactie, lokale transactie, entitlement, einddatum, plan en officiële factuurlink komen overeen.
- [ ] Betalingsmail en melding zijn één taal volgens het profiel.
- [ ] Webhookherhaling is idempotent; mislukte events zijn diagnoseerbaar en herstelbaar; oude geslaagde wachtrijregels worden opgeschoond.
- [ ] MRR telt alleen echte terugkerende omzet en toont geen eenmalige maanden als MRR.

## 6. Bedrijfsmail en communicatie

- [ ] Corporate Admin kan een bestaand IMAP/SMTP-postvak koppelen, aan gebruiker/groep toewijzen en veilig wijzigen.
- [ ] Opgeslagen wachtwoorden verschijnen gemaskeerd; een geslaagde credentialwijziging geeft geen foutmelding.
- [ ] Ontvangen HTML-mail blijft binnen het leesvenster; lange mail is ruim leesbaar.
- [ ] Externe afbeeldingen zijn standaard geblokkeerd en laden alleen na expliciete keuze; inline CID-afbeeldingen en bijlagen werken.
- [ ] Opstellen gebruikt de HTML-editor; links en opmaak blijven behouden.
- [ ] De centraal beheerde merkhandtekening bevat juiste afzender, logo en links en verschijnt eenmaal.
- [ ] Verzenden, opnieuw proberen en idempotentie voorkomen dubbele mail.
- [ ] Nieuwe mail, contactbericht, privacyantwoord en kritieke storing geven de juiste melding en nette HTML-mail.

## 7. Governance en Corporate Admin

- [ ] Privacyverzoek openen, gebruiker openen, beantwoorden, status wijzigen en archiveren werkt met auditspoor.
- [ ] Interne incidenten kunnen worden aangemaakt, bijgewerkt, toegewezen, gesloten en teruggevonden.
- [ ] Feedback kan worden beantwoord en van status veranderd; urgente feedback is zichtbaar.
- [ ] Bedrijfsbeheerder opslaan/wijzigen werkt en roltoegang is correct.
- [ ] Releasechecklist bevat alle nieuwe items, waaronder `public.cross-domain-navigation`, en bewaart voortgang.
- [ ] Auditexport bevat de verwachte acties zonder geheimen of mailboxwachtwoorden.

## 8. Agency en domeinen

- [ ] Agency-dashboard, klanten, offertes, branding, team en rollen werken met een echt Agency-account.
- [ ] Een tweede Agency-account kan geen workspace, offerte, prijs of klantdata van de eerste openen.
- [ ] `naam.globetrotr.nl` en een geverifieerd klantdomein controleren DNS, actief plan en workspace vóór de portalredirect.
- [ ] Onbekende, verlopen of verkeerd gekoppelde host krijgt geen tenanttoegang.
- [ ] CNAME/TXT-instructies en certificaatstatus zijn begrijpelijk; gereserveerde platformnamen kunnen niet worden geclaimd.
- [ ] Agency-uitnodigingen en uitgaande berichten gebruiken de juiste Agency-branding.
- [ ] Een zelf gehost persoonlijk en gedeeld postvak doorloopt `pending` → `provisioning` → `ready`; een automatisch `trip.*`-adres genereert geen zichtbaar wachtwoord.
- [ ] Test vóór de MX-cutover inkomend en uitgaand via Stalwart, IMAPS/SMTP-TLS, SPF, DKIM, DMARC, ClamAV, limieten, back-up en volledig herstel.
- [ ] Agency-klantformulieren ondersteunen sjablonen, tweetalige velden en uitleg per vraag; verboden geheimvelden worden geweigerd.
- [ ] Formulierlinks verlopen, zijn eenmalig in te dienen, werken mobiel en blijven strikt geïsoleerd per Agency; auditlogs bevatten geen antwoorden.
- [ ] Review, verwerking naar klantvoorkeuren, JSON-export, intrekken, archiveren en automatische verwijdering na de bewaartermijn werken.
- [ ] Contentbibliotheek ondersteunt zes typen, persoonlijke concepten, organisatiebrede items, NL/EN, tags, publicatie, versies, bron/licentie, kopiëren en archiveren zonder tenantlek; preview en eenmalige toepassing op reis/offerte werken ook bij dubbel klikken.

## 9. Privacy, inhoud en releasebesluit

- [ ] Privacy- en cookie/browseropslagtekst beschrijft feitelijke EU-hosting, portalopslag, Supabase, Hetzner, ZXCS, Paddle, Turnstile, OAuth, kaartdata, externe mailafbeeldingen en vertaalconcepten.
- [ ] Sociale login noemt uitsluitend de werkelijk aangeboden providers Google en Discord.
- [ ] Juridische tekst, prijzen, contactgegevens, bewaartermijnen en leveranciers zijn door de eigenaar gecontroleerd.
- [ ] Publieke changelog noemt alleen uitgerolde wijzigingen; roadmap scheidt nu, volgende stap en later.
- [ ] Geen testdata, placeholders, kapotte tekencodering, secrets, consolefouten of dode primaire knoppen.
- [ ] Back-up, herstelprocedure, monitoring, tijd/NTP, mail SPF/DKIM/DMARC en incidentcontact zijn praktisch gecontroleerd.
- [ ] Publiceer pas nadat alle kritieke regels hierboven en de Corporate Admin-releasechecks zijn afgerond.

Exacte commando’s en terugval staan in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md). Domeingedrag staat in [PORTAL_DOMAIN_MIGRATION.md](PORTAL_DOMAIN_MIGRATION.md); het releasebesluit staat in [PRE_RELEASE.md](PRE_RELEASE.md).

Gebruik [MAIL_STATUS.md](MAIL_STATUS.md) om tijdens de test onderscheid te houden tussen de actieve ZXCS-productiestroom en de nog te accepteren Stalwart- en boekingsmailfuncties.
