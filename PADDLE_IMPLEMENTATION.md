# Paddle van nul naar productie

GlobeTrotr gebruikt Paddle als Merchant of Record. Gebruik voor de daadwerkelijke
uitrol de lineaire stappen en servercommando's in
[`IMPLEMENTATION_PENDING.md`](IMPLEMENTATION_PENDING.md). Dit document geeft de
Paddle-achtergrond en de uitgebreide acceptatiematrix. Paddle int de betaling,
berekent belasting en levert het officiële betalingsbewijs, de factuur en bij
een terugbetaling de creditnota. GlobeTrotr stuurt daarnaast een herkenbare
NL/EN-servicemail en toont de gebeurtenis in het meldingenscherm.

Werk eerst volledig in **Sandbox**. Sandbox en Live hebben afzonderlijke
producten, price-ID's, tokens, API-keys en webhooksecrets.

## 1. Sandbox openen

1. Log in bij Paddle.
2. Schakel linksboven naar **Sandbox**.
3. Open **Catalog > Products**.
4. Maak `GlobeTrotr Pro` met een maandelijks terugkerende prijs van EUR 9,00.
5. Maak `GlobeTrotr Agency` met een maandelijks terugkerende prijs van EUR 29,00.
6. Kies bij beide de passende software/SaaS-belastingcategorie.
7. Kopieer beide prijs-ID's die met `pri_` beginnen.

Maak bij een toekomstige prijswijziging een nieuwe prijs. Bewerk geen bedrag in
de browser of database. De worker vertaalt uitsluitend deze twee price-ID's
naar Pro of Agency.

## 2. Checkout en bedrijfsgegevens

Vul in Paddle onder de checkout-, business- en brandinginstellingen in:

- bedrijfsnaam en supportadres;
- GlobeTrotr-logo en merkkleur;
- `https://globetrotr.nl` als website;
- links naar voorwaarden, privacy en terugbetalingsbeleid;
- `https://globetrotr.nl/billing` als plek waar klanten hun abonnement beheren.

Registreer of keur `globetrotr.nl` als checkoutdomein goed wanneer Paddle dit
vraagt. Controleer in de Sandbox-checkout dat de eindprijs en belasting vóór de
betaling zichtbaar zijn.

## 3. Client-token maken

1. Open **Developer tools > Authentication**.
2. Maak een **client-side token** voor Sandbox.
3. Kopieer de waarde die met `test_` begint.

Dit token is bedoeld voor Paddle.js in de browser en staat als
`VITE_PADDLE_CLIENT_TOKEN` in de Node-01 buildomgeving.

## 4. API-key maken

Maak in **Developer tools > Authentication** een Sandbox API-key. Geef alleen
de rechten die GlobeTrotr gebruikt:

- customer portal sessions aanmaken;
- subscriptions lezen en wijzigen;
- transactions lezen;
- adjustments/refunds aanmaken en lezen.

Kopieer de key één keer. Deze is geheim en hoort als `PADDLE_API_KEY` op
Node-01 en Node-02, nooit in Git of in een browservariabele.

## 5. Webhook instellen

1. Open **Developer tools > Notifications**.
2. Kies **New destination**.
3. Gebruik deze URL:

   `https://globetrotr.nl/api/paddle/webhook`

4. Selecteer minimaal:

   - `subscription.created`, `subscription.activated`, `subscription.updated`;
   - `subscription.trialing`, `subscription.past_due`;
   - `subscription.paused`, `subscription.resumed`, `subscription.canceled`;
   - `transaction.completed`, `transaction.updated`, `transaction.paid`;
   - `transaction.past_due`, `transaction.payment_failed`;
   - `adjustment.created`, `adjustment.updated`;
   - `customer.updated`.

5. Sla de bestemming op.
6. Open de bestemming en kopieer het **endpoint secret** dat met `pdl_ntfset_`
   begint.

De worker controleert `Paddle-Signature` tegen de ongewijzigde request-body,
weigert oude of ongeldige handtekeningen en verwerkt ieder event-ID maximaal
één keer. Een browsercheckout kan zelf nooit betaalde rechten geven.

## 6. Variabelen op Node-01

Open `/opt/globetrotr/.env.production` en voeg toe:

```dotenv
VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_CLIENT_TOKEN=test_VUL_IN
VITE_PADDLE_PRO_MONTHLY_PRICE_ID=pri_VUL_PRO_IN
VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID=pri_VUL_AGENCY_IN
PADDLE_API_KEY=pdl_sdbx_apikey_VUL_IN
```

Node-01 bouwt de website en maakt portal-, factuur- en planwijzigingsaanvragen.

## 7. Variabelen op Node-02

Open daar `/opt/globetrotr/.env.production` en voeg toe:

```dotenv
VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_PRO_MONTHLY_PRICE_ID=pri_VUL_PRO_IN
VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID=pri_VUL_AGENCY_IN
PADDLE_API_KEY=pdl_sdbx_apikey_VUL_IN
PADDLE_WEBHOOK_SECRET=pdl_ntfset_VUL_IN
```

Node-02 valideert webhooks, haalt factuurmetadata op en verwerkt de status in
Supabase. Het client-token is hier niet nodig.

## 8. SQL uitvoeren

Voer na migraties 1140 en 1150 in Supabase SQL Editor uit:

1. `supabase/migrations/20260908116000_paddle_billing_runtime.sql`;
2. `supabase/tests/paddle_billing_runtime.sql`.

De test eindigt met `ROLLBACK` en laat geen testklant achter. Geen foutmelding
betekent dat de verwerking, idempotentie, betaalmail en Corporate Admin-
acceptatiepunten aanwezig zijn.

## 9. Containers opnieuw bouwen

Op Node-01:

```bash
cd /opt/globetrotr
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/web.compose.yml build --pull
docker compose --env-file .env.production -f deploy/web.compose.yml up -d
docker compose --env-file .env.production -f deploy/web.compose.yml ps
```

Op Node-02:

```bash
cd /opt/globetrotr
git pull --ff-only origin lovable
docker compose --env-file .env.production -f deploy/worker.compose.yml build --pull
docker compose --env-file .env.production -f deploy/worker.compose.yml up -d
docker compose --env-file .env.production -f deploy/worker.compose.yml ps
docker compose --env-file .env.production -f deploy/worker.compose.yml logs --tail=100 worker
```

## 10. Transactionele mail en facturen

Laat GlobeTrotr-servicemail in Corporate Admin op **Live** staan. Bij betaling,
mislukte betaling, abonnementswijziging, beëindiging en terugbetaling ontstaat:

1. een melding in GlobeTrotr;
2. een NL- of EN-HTML-mail volgens de accounttaal;
3. een knop naar `/billing`;
4. bij een betaling een transactie met een verse officiële factuurdownload.

Paddle beheert het fiscale document. Controleer in Paddle ook de klantmails en
branding voor betalingsbewijzen, facturen en creditnota's. De link die de API
voor een factuur maakt is tijdelijk; GlobeTrotr haalt daarom bij iedere klik
een nieuwe link op. Facturen blijven eveneens bereikbaar via Customer Portal.

## 11. Volledige Sandbox-test

Gebruik een nieuw testaccount en vink in **Corporate Admin > Releasecheck** af:

1. Free naar Pro en een afzonderlijk account Free naar Agency;
2. geannuleerde checkout houdt Free;
3. juiste productnaam, EUR-prijs, belasting en e-mailadres;
4. webhook geeft HTTP 200 en maakt één klant, abonnement en transactie;
5. opnieuw verzonden event maakt geen duplicaat;
6. ongeldige signature geeft HTTP 401 en wijzigt niets;
7. plan en rechten kloppen na vernieuwen, opnieuw inloggen en tweede apparaat;
8. Pro naar Agency en Agency naar Pro met getoonde/verwerkte verrekening;
9. mislukte betaling, herstel, geplande opzegging en definitief einde;
10. Customer Portal opent betaalmethode, facturen en opzegging;
11. factuurdownload op `/billing` opent het juiste officiële document;
12. NL- en EN-servicemail hebben juiste tekst en CTA;
13. Corporate Admin toont omzet, transactie, factuur en webhookstatus;
14. volledige refund vanuit Corporate Admin maakt een adjustment;
15. goedgekeurde refund past transactie/factuur aan en levert een creditnota;
16. een gefaald webhookevent kan één keer veilig opnieuw worden verwerkt.

## 12. Naar Live gaan

1. Schakel Paddle naar **Live**.
2. Maak dezelfde twee liveproducten en maandprijzen.
3. Voltooi alle bedrijfs-, domein-, branding- en uitbetalingsinstellingen.
4. Maak een live client-token en live API-key met dezelfde minimale rechten.
5. Maak de live notification destination en kopieer het nieuwe secret.
6. Vervang op beide nodes alle Sandboxwaarden door de livewaarden.
7. Zet `VITE_PADDLE_ENVIRONMENT=production`.
8. Bouw en start beide nodes opnieuw.
9. Doe één echte Pro-aankoop met een klein gecontroleerd testaccount.
10. Download de factuur, open Customer Portal en voer daarna een volledige
    terugbetaling uit Corporate Admin uit.
11. Controleer uitbetaling, boekhouding, servicemail en Paddle-creditnota.

Bewaar Sandbox- en Live-secrets nooit door elkaar. Verwijder of roteer oude
keys zodra de productieproef volledig is geslaagd.

## Officiële naslag

- [Paddle Sandbox](https://developer.paddle.com/concepts/sell/sandbox)
- [Client-side tokens](https://developer.paddle.com/paddlejs/client-side-token)
- [Webhookhandtekeningen controleren](https://developer.paddle.com/webhooks/signature-verification)
- [Customer Portal-sessies](https://developer.paddle.com/api-reference/customer-portals/create-customer-portal-session)
- [Factuur-PDF voor een transactie](https://developer.paddle.com/api-reference/transactions/get-transaction-invoice)
- [Terugbetalingen](https://developer.paddle.com/build/transactions/create-transaction-adjustments)
