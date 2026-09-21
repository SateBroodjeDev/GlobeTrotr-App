# Supabase Auth e-mailtemplates

Plak deze bestanden in Supabase Dashboard → Authentication → Email Templates:

- `confirmation.html`: Confirm signup
- `recovery.html`: Reset password
- `email-change.html`: Change email address
- `magic-link.html`: Magic link
- `invite.html`: Invite user

Gebruik het onderwerp uit `subjects.md`. Behoud de Go-templatevariabelen exact. De links gaan rechtstreeks naar GlobeTrotr, waar `/token/$tokenHash` de eenmalige code met Supabase Auth controleert.

De templates kiezen Nederlands wanneer `user_metadata.language` gelijk is aan `nl`; Engels is de veilige standaard. Migratie 1300 vult deze waarde voor bestaande accounts en houdt haar gelijk aan de profieltaal. Na iedere wijziging moeten registratie, herstel, e-mailwijziging, magic link en uitnodiging afzonderlijk met een echt Nederlands en Engels testaccount worden getest. De applicatiemail van Node-02 gebruikt dezelfde visuele basis, maar wordt door `worker/mail-relay.mjs` opgebouwd.
