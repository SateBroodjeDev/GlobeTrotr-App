# Uitrolhandboek Beta 0.9.1

**Stand: 25 september 2026 · doel: productieacceptatie voor release 1.0**

Dit is de enige volgorde voor deze uitrol. Testresultaten registreer je in
[`TEST_CHECKLIST.md`](TEST_CHECKLIST.md). Serverbeheer en rollback staan in
[`SERVER_OPERATIONS.md`](SERVER_OPERATIONS.md).

## Wat in deze uitrol zit

- GPX-preview en gecontroleerde route-import;
- afzonderlijk beheer van offline uitgaven;
- groepsuitnodigingen, bulkrollen en veilige reisvarianten;
- plaatsen rond de route en een provider-onafhankelijke verblijfvergelijker;
- favoriete plaatsen en gedeelde reischecklists;
- reisdagboek met tijdlijn, galerij, kaart, afgeschermde foto's, bijschriften,
  omslagfoto, lokaal tekstconcept en bewuste openbare reisterugblik;
- controleerbaar routevoorstel met huidige en voorgestelde volgorde;
- bijgewerkte publieke mogelijkheden, roadmap en changelog.

Live hotelprijzen, echte wegafstanden en Hetzner Object Storage horen niet bij
deze uitrol. Supabase Storage blijft actief. Er zijn geen nieuwe
omgevingsvariabelen nodig.

## 1. Supabase — afgerond

Volgens de eigenaar zijn alle migraties en SQL-tests tot en met **1810**
uitgevoerd, inclusief:

1. `20260908179000_archive_open_release_checks.sql`;
2. `20260908180000_trip_journal.sql`;
3. `20260908181000_object_storage_metadata.sql`;
4. de drie bijbehorende bestanden in `supabase/tests`.

Voer deze bestanden tijdens deze uitrol niet opnieuw uit. Migratie 1810 legt
alleen opslagmetadata vast en schakelt geen externe objectopslag in.

<!-- release-preflight: confirmed-through=20260908181000_object_storage_metadata.sql -->

## 2. Op je eigen pc

```powershell
cd "C:\Users\info\Desktop\Travelplanner\GIT Clone\globetrotr-1d042353"
git status --short
npm run verify
npm run build
git diff --check
```

Controleer de wijzigingen en commit en push daarna:

```powershell
git add -A
git commit -m "Prepare Beta 0.9.1 travel journal and route tools"
git push
```

## 3. Node-01 bijwerken

```bash
cd /opt/globetrotr
git status --short
git pull --ff-only
docker compose --env-file .env.production -f deploy/web.compose.yml build --pull web
docker compose --env-file .env.production -f deploy/web.compose.yml up -d web
docker compose --env-file .env.production -f deploy/web.compose.yml ps
docker compose --env-file .env.production -f deploy/web.compose.yml logs --tail=100 web
curl -I https://globetrotr.nl
curl -I https://portal.globetrotr.nl
```

De webcontainer moet gezond blijven en beide domeinen moeten via HTTPS
reageren.

## 4. Node-02

Deze wijziging bevat geen nieuwe worker- of mailruntime. Node-02 hoeft niet te
worden bijgewerkt of herstart.

## 5. Eerst deze nieuwe functies testen

### Reisdagboek

1. Open een reis en ga naar **Dagboek**.
2. Maak een herinnering met datum, locatie, tekst, waardering en meerdere foto's.
3. Versleep foto's, wijzig bijschriften, vervang één foto en verwijder één foto.
4. Sla op en herlaad; volgorde, omslagfoto en bijschriften moeten behouden zijn.
5. Maak een tekstconcept, zet de browser offline, herlaad en controleer dat het
   concept lokaal terugkomt. Zet internet aan en sla het bewust op.
6. Test de zichtbaarheid **Privé**, **Reisleden** en **Openbaar** met een tweede
   account.
7. Open de publieke reislink, ook met PIN. Alleen openbare herinneringen mogen
   daar verschijnen; bedragen, codes en privéfoto's mogen nooit zichtbaar zijn.

### Routevoorstel

1. Gebruik een reis met minimaal vier geografisch verspreide routeplaatsen.
2. Open het routevoorstel en vergelijk huidige en voorgestelde volgorde.
3. Controleer dat afstand en reistijd duidelijk als schatting zijn aangeduid.
4. Sluit zonder toepassen; de opgeslagen route moet ongewijzigd blijven.
5. Open opnieuw, pas bewust toe en herlaad; alleen dan mag de volgorde wijzigen.

### Overige 0.9.1-controles

- importeer een GPX-bestand, bekijk de preview en voeg alleen geselecteerde
  punten toe;
- test groepsuitnodigingen, bulkrollen en het toegangsvoorbeeld;
- test een reisvariant en controleer dat documenten, betalingen en codes niet
  worden gekopieerd;
- zoek een plaats langs de route en voeg die pas na bevestiging toe;
- vergelijk verblijven met dezelfde data, gasten, kamers en voorwaarden;
- zet een offline uitgave in de wachtrij, los een conflict op en synchroniseer
  precies één keer;
- controleer de publieke pagina's **Updates**, **Roadmap** en
  **Mogelijkheden** in Nederlands en Engels en op mobiel.

Vul daarna de volledige lege acceptatielijst in
[`TEST_CHECKLIST.md`](TEST_CHECKLIST.md) in.

## 6. Vrijgave

Gebruik [`PRE_RELEASE.md`](PRE_RELEASE.md) voor het go/no-go-besluit. Leg de
Git-commit, uitroltijd, uitvoerder, open afwijkingen, beslissing en beslisser
vast. Publiceer release 1.0 alleen wanneer geen kritieke of hoge bevinding
openstaat.
