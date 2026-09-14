# Openstaande productie-implementatie na commit e02bc59

Werk deze lijst van boven naar beneden af. Vink praktische controles uiteindelijk af in Corporate Admin → Releasecheck.

## 1. Database

- Voer migraties 1010, 1020, 1030 en 1040 uit als ze nog niet zijn toegepast.
- Voer daarna `direct_invitation_email.sql`, `email_template_acceptance.sql`, `social_login_acceptance.sql` en `passwordless_auth_acceptance.sql` uit.
- Zet `public.email_delivery_config.mode` pas op `live` wanneer de relaytest HTTP 202 geeft.

## 2. Supabase Auth

- Controleer Site URL `https://globetrotr.nl` en de toegestane GlobeTrotr-redirects.
- Controleer custom SMTP en de vier templates uit `supabase/templates`.
- Maak Google, Facebook en Discord volgens `OAUTH_SETUP.md` en activeer ze afzonderlijk.
- Test registratie, bevestiging, wachtwoordherstel, magic link, e-mailwijziging, iedere OAuth-provider en passkey.

## 3. Node-01

- Pull de laatste `lovable`-commit en rebuild `deploy/web.compose.yml`.
- Controleer containerhealth, HTTPS, logo-assets, registratie, callbacks en serverfuncties.

## 4. Node-02

- Pull de laatste commit wanneer worker- of relaycode is gewijzigd en rebuild `deploy/worker.compose.yml`.
- Controleer worker- en relayhealth, mailtest 202 en daadwerkelijke ontvangst.
- Controleer daarna een echte reisuitnodiging en Agency-uitnodiging vanuit de app.

## 5. Productacceptatie

- Doorloop alle open controles in Corporate Admin → Releasecheck met gewone reiziger, Agency-eigenaar, Agency-medewerker en klant.
- Test Nederlands en Engels op telefoon en desktop.
- Registreer iedere afwijking als feedback of bekend probleem en sluit kritieke of hoge problemen vóór publieke opening.
- Voer als laatste de geplande deep securityscan en een herstelproef van de vorige stabiele containerrelease uit.

## Nog bewust extern of later

- Paddle kan pas na commerciële goedkeuring en domeincontrole worden geactiveerd.
- Eigen Agency-domeinen vereisen nog geverifieerde CNAME/TXT-onboarding en begrensde Caddy-certificaatuitgifte.
- Inkomende bedrijfsmail vereist IMAP of een mailprovider-API; SMTP verzorgt alleen verzending.
- Externe monitoring, back-upherstel en finale firewallcontrole worden op de echte infrastructuur afgerond.
