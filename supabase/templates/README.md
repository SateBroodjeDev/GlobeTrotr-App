# Supabase Auth e-mailtemplates

Plak deze bestanden in Supabase Dashboard → Authentication → Email Templates:

- `confirmation.html`: Confirm signup
- `recovery.html`: Reset password
- `email-change.html`: Change email address
- `magic-link.html`: Magic link

Gebruik het onderwerp uit `subjects.md`. Behoud de Go-templatevariabelen exact. De links gaan rechtstreeks naar GlobeTrotr, waar `/token/$tokenHash` de eenmalige code met Supabase Auth controleert.

Na iedere wijziging moeten registratie, herstel, e-mailwijziging en magic link afzonderlijk met een echt extern adres worden getest. De applicatiemail van Node-02 gebruikt dezelfde visuele basis, maar wordt door `worker/mail-relay.mjs` opgebouwd.
