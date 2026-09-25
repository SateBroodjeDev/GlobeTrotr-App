# Release 1.0 — lege testregistratie

**Status: nog niet gestart**

Alle controles beginnen bewust leeg. Gebruik **Geslaagd**, **Mislukt** of
**Geblokkeerd**. Vermeld bij een fout een incidentnummer en reproduceerstap.

| Gegeven | Waarde |
| --- | --- |
| Git-commit |  |
| Uitgerold op |  |
| Getest door |  |
| Browsers/apparaten |  |
| Besluit | Nog niet genomen |

## A. Uitrol en basis

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Migratie en test 1770 slagen |  |  |
| Migratie en test 1780 slagen |  |  |
| Migratie en test 1790 archiveren oude open checks zonder ze als geslaagd te markeren |  |  |
| Migratie en test 1800 maken het afgeschermde reisdagboek beschikbaar |  |  |
| Migratie en test 1810 leggen opslagmetadata vast zonder externe opslag te activeren |  |  |
| `npm run verify` en productiebuild slagen |  |  |
| Node-01 webcontainer is gezond |  |  |
| Hoofddomein en portaal openen via HTTPS |  |  |
| Geen nieuwe kritieke fout in logs |  |  |

## B. Account en toegang

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Registratie, bevestigingsmail en eerste profiel werken |  |  |
| Inloggen, uitloggen en sessie na verversen werken |  |  |
| Google en Discord koppelen en ontkoppelen correct |  |  |
| Passkey en TOTP werken, inclusief supportpad |  |  |
| Herstel, magic link en e-mailwijziging werken in NL en EN |  |  |
| Privacyverzoek indienen, beantwoorden en archiveren werkt |  |  |

## C. Favorieten, taken en checklists

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Favoriete routeplaats opslaan en na herladen terugzien |  |  |
| Favoriet aan andere reis toevoegen en verwijderen |  |  |
| Tweede account ziet persoonlijke favorieten niet |  |  |
| Gewone taak toevoegen, afvinken en verwijderen |  |  |
| Vertrekchecklist en boodschappenlijst blijven gescheiden |  |  |
| Zelf benoemde lijst blijft na herladen correct |  |  |
| Bewerkend reisgenoot kan checklist wijzigen |  |  |
| Alleen-lezen reisgenoot kan checklist niet wijzigen |  |  |
| Accountexport bevat `favorite_places` en `trip_tasks` |  |  |

## D. Reisplanning en verblijf

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Route, boekingen en dagplanning blijven na herladen staan |  |  |
| Hotelcontrole toont uitsluitend ontbrekende nachten |  |  |
| Aankomst bepaalt automatisch de logische slaapplaats |  |  |
| Activiteitslocatie werkt als fallback |  |  |
| Handmatige routekeuze verschijnt alleen zonder locatie |  |  |
| Hotel zoeken en kandidaat bewaren werken |  |  |
| Vergelijker: reactie, peiling, stem en keuze werken |  |  |
| Reisdatum verschuiven toont juiste preview |  |  |

## E. Export, agenda en offline

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| CSV, GPX, reisgids en PDF-declaratie downloaden |  |  |
| Eenmalige ICS opent als geldige agenda |  |  |
| Agenda-abonnement verwerkt latere wijzigingen |  |  |
| Verblijf en huurauto zijn hele-dagactiviteiten |  |  |
| Offline pakket bevat planning zonder geheimen of bedragen |  |  |
| Offline dagoverzicht opent in vliegtuigmodus |  |  |
| Offline uitgave synchroniseert precies één keer |  |  |

## F. Reisdagboek en routevoorstel

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Herinnering met datum, locatie, waardering en meerdere foto's opslaan |  |  |
| Foto's ordenen, vervangen en verwijderen; bijschriften en omslag blijven na herladen behouden |  |  |
| Tekstconcept blijft zonder internet lokaal beschikbaar en wordt alleen bewust opgeslagen |  |  |
| Privé-, reisleden- en openbare zichtbaarheid werken met een tweede account |  |  |
| Publieke reisterugblik toont alleen openbare herinneringen en geen gevoelige reisgegevens |  |  |
| Routevoorstel toont huidige en voorgestelde volgorde met geschatte afstand en tijd |  |  |
| Route blijft ongewijzigd na annuleren en verandert alleen na expliciet toepassen |  |  |

## G. Betaling en meldingen

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Paddle maandbetaling activeert juiste plan |  |  |
| Eenmalige betalingen stapelen toegang correct |  |  |
| Factuur volgt pas na bevestigde transactie |  |  |
| Afgebroken checkout blijft niet laden |  |  |
| In-appmeldingen openen juiste pagina |  |  |
| Pushcategorieën zijn afzonderlijk instelbaar |  |  |
| Testpush komt aan met gesloten tabblad |  |  |
| Boekingsherinnering wordt maximaal één keer verstuurd |  |  |

## H. Mail en Corporate Admin

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| ZXCS verzendt en ontvangt platformmail |  |  |
| Bedrijfsmail toont ontvangen en verzonden HTML |  |  |
| Groot leesvenster en archiefpaginering werken |  |  |
| Definitief verwijderen werkt alleen voor beheerder |  |  |
| NL/EN-vertaalconcept behoudt HTML-opmaak |  |  |
| Mailboxwachtwoord toont gemaskeerde status |  |  |
| Governance-, incident- en auditdetails zijn beheerbaar |  |  |

## I. Taal, privacy en mobiel

| Controle | Status | Resultaat/opmerking |
| --- | --- | --- |
| Belangrijkste schermen en meldingen zijn volledig NL/EN |  |  |
| Privacytekst, opslagkeuze en accountvoorkeuren kloppen |  |  |
| Publieke changelog en roadmap kloppen met productie |  |  |
| Reis, account en beheer werken op 320, 375 en 430 px |  |  |
| Toetsenbordfocus en dialoogsluiting werken |  |  |

Agency- en white-labelacceptatie is bewust uit deze testronde gehaald. Die krijgt een
eigen ronde wanneer de Agency-fase wordt hervat.

## Open bevindingen

| Incident | Ernst | Onderdeel | Reproduceerstappen | Eigenaar | Status |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
