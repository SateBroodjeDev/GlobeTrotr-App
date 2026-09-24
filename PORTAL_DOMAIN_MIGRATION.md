# Domeinarchitectuur van GlobeTrotr

**De basisscheiding is actief sinds 22 september 2026.** Dit is architectuurnaslag, geen uitrolhandleiding. Gebruik voor updates `IMPLEMENTATION_PENDING.md` en `SERVER_OPERATIONS.md`.

## Hosts

| Host | Functie |
| --- | --- |
| `globetrotr.nl` | Publieke website, demo, prijzen, juridische pagina’s, openbare reizen, Paddle-webhook en agenda-feed |
| `portal.globetrotr.nl` | Registratie, login, dashboard, reizen, account, betaling en beheer |
| `dashboard.globetrotr.nl` | Oude links; redirect naar portal met behoud van pad |
| `agency.globetrotr.nl` | Ingang voor een geregistreerde Agency |
| Eigen Agency-domein | Ingang na CNAME/TXT-verificatie en een actief Agency-plan |

## DNS

- `portal.globetrotr.nl` wijst naar Node-01.
- De wildcard voor `*.globetrotr.nl` wijst naar Node-01.
- Een eigen Agency-host gebruikt `CNAME portal.globetrotr.nl`.
- Het exacte verificatierecord is `TXT _globetrotr.<host>` met het token uit Agency-instellingen.
- Mail-, SMTP- en MX-records staan los van deze portalarchitectuur.

## Beveiligingsmodel

- Caddy vraagt Node-02 of een Agency-host voor certificaatuitgifte is toegestaan.
- De app koppelt de host aan één actieve Agency-workspace.
- Een account van een andere Agency krijgt geen toegang.
- Publieke pagina’s horen op `globetrotr.nl`; privépagina’s op het portal of een geverifieerde Agency-host.
- De portal krijgt `X-Robots-Tag: noindex, nofollow`.
- Supabase Auth, OAuth, Turnstile en passkeys moeten de werkelijk gebruikte origins toestaan.

## Praktijkcontrole

Controleer voor iedere Agency-host:

1. DNS CNAME/A en TXT;
2. geldig HTTPS-certificaat;
3. hostnaam blijft zichtbaar;
4. juiste Agency-branding en workspace;
5. directe privéroute werkt na login;
6. verkeerd Agency-account wordt geweigerd;
7. onbekende host wordt niet toegelaten voor TLS of tenanttoegang.

De concrete release-1.0-proef staat in `IMPLEMENTATION_PENDING.md`.
