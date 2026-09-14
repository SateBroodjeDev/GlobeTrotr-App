# Google, Facebook en Discord via Supabase Auth

GlobeTrotr gebruikt voor alle drie providers dezelfde Supabase-callback:

```text
https://mucvqudlzntywnyqucfo.supabase.co/auth/v1/callback
```

De providersecret hoort alleen in Supabase Dashboard en nooit in `.env.production`, browsercode of Git.

## Vooraf in Supabase

Ga naar Authentication → URL Configuration en controleer:

```text
Site URL: https://globetrotr.nl
Redirect URLs:
https://globetrotr.nl/**
https://www.globetrotr.nl/**
https://dashboard.globetrotr.nl/**
```

## Google

1. Maak in Google Cloud Console een project of selecteer het GlobeTrotr-project.
2. Configureer Google Auth Platform: Branding, Audience en Data Access.
3. Gebruik alleen `openid`, `userinfo.email` en `userinfo.profile`.
4. Maak een OAuth-client van type **Web application**.
5. Authorized JavaScript origin: `https://globetrotr.nl`.
6. Authorized redirect URI: de Supabase-callback bovenaan dit document.
7. Plak Client ID en Client Secret in Supabase → Authentication → Providers → Google en activeer de provider.

## Facebook

1. Maak in Meta for Developers een app met de use case Facebook Login.
2. Voeg `globetrotr.nl` als appdomein en `https://globetrotr.nl` als website-URL toe.
3. Zet onder Facebook Login de Supabase-callback exact als Valid OAuth Redirect URI.
4. Configureer de permissie `email`, privacy-URL en verwijderingsinstructies.
5. Plak App ID en App Secret in Supabase → Authentication → Providers → Facebook.
6. Zet de Meta-app pas live nadat de consenttekst, privacy-URL en testgebruiker zijn gecontroleerd.

## Discord

1. Maak in Discord Developer Portal een applicatie.
2. Voeg onder OAuth2 de Supabase-callback exact als redirect toe.
3. Kopieer Client ID en Client Secret naar Supabase → Authentication → Providers → Discord.
4. Vraag voor aanmelden alleen de standaard identiteit en het e-mailadres op.

## Acceptatietest

Test iedere provider met een nieuw account en daarna met hetzelfde account. Controleer callback naar `/auth`, doorsturen naar `/dashboard`, profielnaam, e-mailadres, uitloggen en opnieuw inloggen. Test daarnaast een uitnodigingslink met `?redirect=...` en controleer dat de gebruiker na OAuth bij die uitnodiging terugkomt.

Wanneer hetzelfde e-mailadres al met een andere methode bestaat, controleer expliciet in Supabase Authentication → Users of de identiteit veilig aan dezelfde gebruiker is gekoppeld. Voeg geen accounts handmatig samen zonder eerst een databaseback-up te maken.
