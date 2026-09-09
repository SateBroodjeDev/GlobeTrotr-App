# GlobeTrotr

GlobeTrotr is een meertalige reisplanner voor individuen, groepen en reisorganisaties. De applicatie combineert routes, planning, boekingen, uitgaven, kostenverdeling, paklijsten, openbare reisverhalen en samenwerking in één workspace.

De huidige versie is een internationale beta. Inloggen met e-mail en wachtwoord werkt. OAuth en automatische app-e-mails staan bewust nog niet aan.

## Wat de applicatie bevat

- Meerdere reizen met sjablonen, data, bestemmingen en een interactieve OpenStreetMap-route.
- Chronologisch reisschema, boekingen, vluchtinformatie, vervoer en paklijsten.
- Uitgaven in meerdere valuta, live ECB-koersen, slimme verrekening en veilige CSV/PDF-export.
- Brandstofprognoses per vervoerstype en koppeling met werkelijke tankuitgaven.
- Beveiligde samenwerking per reis met rollen, uitnodigingslink, accountmelding, accepteren, weigeren, vernieuwen en intrekken.
- Openbare reispagina's met kaart, planning, optioneel gedeelde boekingen, PIN-bescherming en weer.
- JSON-back-up per reis, volledige workspaceback-up, veilige import en AVG-gegevensexport.
- Persistente meldingen, platformstatusbanners, feedback en een publieke lijst met bekende problemen.
- Agency-mogelijkheden voor rollen, declarabele uitgaven, bonnetjes, analytics en white-label branding.
- Afgeschermd Corporate Admin-dashboard voor gebruikers, platformstatus, feedback, problemen en auditlog.

## Techniek

- React 19 en TypeScript
- TanStack Router, Start en React Query
- Vite 8 en Nitro met Cloudflare-build
- Tailwind CSS en Radix UI-componenten
- Supabase Auth, PostgreSQL, Row Level Security en Storage
- Leaflet en OpenStreetMap

Gevoelige databasebewerkingen lopen via geauthenticeerde serverfuncties en service-role-only RPC's. Publieke reisroutes gebruiken afzonderlijke RPC's die uitsluitend geselecteerde openbare velden teruggeven.

## Lokaal ontwikkelen

Vereisten:

- Node.js 24
- npm; Bun is alleen nodig wanneer je lokaal exact dezelfde lockfile-installatie als CI wilt gebruiken
- Een gekoppeld Supabase-project en de vereiste omgevingsvariabelen

```sh
git clone <repository-url>
cd globetrotr-1d042353
npm install
npm run dev
```

Plaats secrets uitsluitend in de lokale omgeving of Lovable Cloud en commit nooit `.env`-bestanden of service-role-sleutels.

## Controles

```sh
npm test
npm run build
npm run check
```

`npm run check` voert de regressietests en de volledige client-, SSR- en Cloudflare-productiebuild uit. GitHub Actions voert dezelfde scriptset uit en installeert dependencies reproduceerbaar vanuit `bun.lock`.

Database-regressietests staan in `supabase/tests`. Voer ze in de Supabase SQL Editor uit nadat de genoemde migratie is toegepast. Iedere test draait in een transactie en eindigt met `ROLLBACK`.

## Databasewijzigingen

Migraties staan chronologisch in `supabase/migrations` en worden in bestandsvolgorde uitgevoerd. Recente onderdelen omvatten versiegestuurde reisopslag, financiële privacy, publieke reis-RPC's, uitnodigingsbeheer, meldingen, feedback, platformbeheer en auditregistratie.

## Projectdocumentatie

- `roadmap.md`: interne technische roadmap en migratiestatus.
- `CHANGELOG.md`: technisch changelog voor GitHub en reviewers.
- `/roadmap`: publieke productroadmap.
- `/changelog`: publieke release notes.
- `/privacy` en `/beta-voorwaarden`: gepubliceerde privacy-informatie en betavoorwaarden.

## Lovable

Dit is een bestaand [Lovable](https://lovable.dev)-project. Commits op de gekoppelde branch synchroniseren terug naar Lovable. Herschrijf gepubliceerde Git-geschiedenis daarom niet met force-push, rebase of amend.
