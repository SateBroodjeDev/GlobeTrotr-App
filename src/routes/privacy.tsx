import { createFileRoute, Link } from "@tanstack/react-router";
import { FileDown, Scale, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { openPrivacyChoices } from "@/lib/privacy-consent";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — GlobeTrotr" },
      { name: "description", content: "Privacy- en browseropslagverklaring van GlobeTrotr." },
      { property: "og:title", content: "Privacy bij GlobeTrotr" },
      {
        property: "og:description",
        content:
          "Lees waar reisgegevens staan, welke providers worden gebruikt en welke keuzes je zelf hebt.",
      },
    ],
    links: [{ rel: "canonical", href: "https://globetrotr.nl/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { user } = useAuth();
  const { text } = useLocale();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="aurora rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
        <Badge variant="secondary" className="mb-4 gap-1.5">
          <ShieldCheck className="size-3.5" /> AVG / GDPR
        </Badge>
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">
          {text("Jouw reis, jouw gegevens", "Your trip, your data")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90">
          {text(
            "Privacy- en browseropslagverklaring voor de live internationale beta en betaalde accounts. Versie 23 september 2026.",
            "Privacy and browser-storage notice for the live international beta and paid accounts. Version 23 September 2026.",
          )}
        </p>
      </header>
      <Card className="surface">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <Policy title={text("1. Verwerkingsverantwoordelijke", "1. Controller")}>
            <span>
              GlobeTrotr
              <br />
              {text("Postadres (geen bezoekadres):", "Postal address (not a visiting address):")}
              <br />
              Gedempte Oude Gracht 95
              <br />
              2011 GT Haarlem
              <br />
              <a className="text-primary underline" href="mailto:privacy@globetrotr.nl">
                privacy@globetrotr.nl
              </a>
            </span>
          </Policy>
          <Policy
            title={text("2. Gegevens, doelen en grondslagen", "2. Data, purposes and legal bases")}
          >
            <ul className="list-disc space-y-2 pl-5">
              <li>
                {text(
                  "Account-, profiel- en authenticatiegegevens, waaronder je naam en optioneel telefoonnummer en profielfoto na sociale registratie: om je account te leveren, reisgenoten je te laten herkennen en je account te beveiligen; uitvoering van de overeenkomst.",
                  "Account, profile and authentication data, including your name and optional phone number and profile photo after social sign-up: to provide your account, help travel companions recognise you and secure your account; performance of the agreement.",
                )}
              </li>
              <li>
                {text(
                  "Reizen, routes, planning, reisleden, boekingen, uitgaven, paklijsten, reisvergelijkerkandidaten, reacties, peilingen, stemmen en uploads: om de gekozen functies en samenwerking te leveren; uitvoering van de overeenkomst. Reacties en stemmen zijn alleen zichtbaar voor bevoegde reisleden. Reacties verdwijnen wanneer hun kandidaat wordt verwijderd; een afgesloten peiling bewaart de keuze en stemtotalen als reisbesluit.",
                  "Trips, routes, itinerary, members, bookings, expenses, packing lists, trip-comparison candidates, comments, polls, votes and uploads: to provide selected features and collaboration; performance of the agreement. Comments and votes are visible only to authorised trip members. Comments are removed when their candidate is deleted; a closed poll retains the choice and vote totals as a trip decision.",
                )}
              </li>
              <li>
                {text(
                  "IP-adres, serverlogs, fout- en misbruikgegevens: beveiliging, foutonderzoek en fraudepreventie; gerechtvaardigd belang, afgewogen tegen jouw privacy.",
                  "IP address, server logs, error and abuse data: security, troubleshooting and fraud prevention; legitimate interests balanced against your privacy.",
                )}
              </li>
              <li>
                {text(
                  "E-mailberichten en bezorggegevens: accountbevestigingen, uitnodigingen, beveiligingsmeldingen en noodzakelijke servicecommunicatie verzenden; uitvoering van de overeenkomst en beveiliging. Marketingmail vereist een afzonderlijke geldige grondslag.",
                  "Email messages and delivery data: sending account confirmations, invitations, security notices and necessary service communications; performance of the agreement and security. Marketing email requires a separate valid legal basis.",
                )}
              </li>
              <li>
                {text(
                  "Browserpush is optioneel en per apparaat: na jouw toestemming bewaren we het push-endpoint, technische versleutelingssleutels, beperkte apparaatinfo en bezorgstatus. De zichtbare push bevat alleen dat er een nieuwe melding klaarstaat; inhoud blijft achter de GlobeTrotr-login. Je kunt het apparaat vanuit het meldingenpaneel intrekken.",
                  "Browser push is optional and device-specific: after your consent, we store the push endpoint, technical encryption keys, limited device information and delivery status. The visible push only says that a new notification is ready; its content remains behind your GlobeTrotr sign-in. You can revoke the device from the notifications panel.",
                )}
              </li>
              <li>
                {text(
                  "Bedrijfsmail: postvakadressen, toegang van medewerkers, inkomende en uitgaande berichtinhoud, HTML-opmaak, bijlagen, concepten, gespreksgegevens en bezorgstatus om de gekozen postvakdienst te leveren; uitvoering van de overeenkomst. Bijlagen worden daarnaast op schadelijke software gecontroleerd om de dienst en ontvangers te beveiligen; gerechtvaardigd belang.",
                  "Company mail: mailbox addresses, staff access, incoming and outgoing message content, HTML formatting, attachments, drafts, conversation details and delivery status to provide the selected mailbox service; performance of the agreement. Attachments are also checked for malware to protect the service and recipients; legitimate interests.",
                )}
              </li>
              <li>
                {text(
                  "Boekingsmail per reis: als je een bevestiging naar een uniek reisadres stuurt, verwerken we afzender, onderwerp, bericht en bijlagen om type en basisvelden te herkennen. GlobeTrotr maakt eerst een controleerbaar concept en voegt niets automatisch aan de reis toe.",
                  "Booking email per trip: when you send a confirmation to a unique trip address, we process sender, subject, message and attachments to recognise its type and basic fields. GlobeTrotr first creates a reviewable draft and does not add anything to the trip automatically.",
                )}
              </li>
              <li>
                {text(
                  "Agency-klantformulieren: vragen, het doel per veld, de gekozen klant en reis, antwoorden, controle- en verwerkingsstatus en auditgegevens om reiswensen gecontroleerd te verzamelen; uitvoering van de overeenkomst. Vul nooit wachtwoorden, betaalkaartgegevens of authenticatiecodes in.",
                  "Agency client forms: questions, each field's purpose, selected client and trip, answers, review and processing status, and audit data to collect travel requirements in a controlled way; performance of the agreement. Never enter passwords, payment-card details or authentication codes.",
                )}
              </li>
              <li>
                {text(
                  "Externe afbeeldingen in ontvangen bedrijfsmail worden standaard niet geladen. Als je ze zelf inschakelt, maakt je browser rechtstreeks verbinding met de afbeeldingsserver; die kan je IP-adres en het ophaaltijdstip zien. Zo'n server kan buiten de EU staan. Open ze alleen bij een vertrouwde afzender.",
                  "External images in received company email are blocked by default. If you choose to load them, your browser connects directly to the image server, which may see your IP address and the time of the request. That server may be outside the EU. Load them only for a sender you trust.",
                )}
              </li>
              <li>
                {text(
                  "Vertaalconcepten: alleen wanneer een bevoegde gebruiker vertalen kiest, wordt de ingevoerde tekst tijdelijk naar de eigen vertaalservice op de Duitse server gestuurd. Het resultaat wordt pas gebruikt nadat de gebruiker het heeft gecontroleerd; uitvoering van de overeenkomst.",
                  "Translation drafts: only when an authorised user chooses to translate is the entered text temporarily sent to the self-hosted translation service on the German server. The result is used only after the user reviews it; performance of the agreement.",
                )}
              </li>
              <li>
                {text(
                  "Abonnements-, transactie- en factuurgegevens die Paddle met ons deelt: toegang activeren, abonnementen beheren, ondersteuning bieden en voldoen aan administratieplichten; uitvoering van de overeenkomst en wettelijke verplichting. GlobeTrotr ontvangt geen volledige betaalkaartgegevens.",
                  "Subscription, transaction and invoice data shared with us by Paddle: activating access, managing subscriptions, providing support and meeting record-keeping duties; performance of the agreement and legal obligation. GlobeTrotr does not receive full payment card details.",
                )}
              </li>
              <li>
                {text(
                  "Openbaar delen en optionele voorkeursopslag: jouw actieve keuze of toestemming. Je kunt die keuze altijd terugdraaien.",
                  "Public sharing and optional preference storage: your active choice or consent. You can reverse that choice at any time.",
                )}
              </li>
              <li>
                {text(
                  "Gegevens die wettelijk moeten worden bewaard of verstrekt: wettelijke verplichting.",
                  "Data that must legally be retained or disclosed: legal obligation.",
                )}
              </li>
            </ul>
          </Policy>
          <Policy
            title={text(
              "3. Ontvangers, hosting en leveranciers",
              "3. Recipients, hosting and suppliers",
            )}
          >
            <div className="space-y-3">
              <p>
                {text(
                  "Gegevens zijn beschikbaar voor jou, reisleden binnen hun rol, bezoekers van een reis die jij openbaar maakt en leveranciers die de dienst uitvoeren. GlobeTrotr verkoopt geen persoonsgegevens.",
                  "Data is available to you, trip members within their role, visitors to a trip you publish and suppliers that provide the service. GlobeTrotr does not sell personal data.",
                )}
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  {text(
                    "De GlobeTrotr-applicatie en achtergrondtaken draaien op eigen servers bij Hetzner in Duitsland. Daarbij worden technisch IP-adressen, verzoeken, tijdelijke gegevens en beveiligingslogs verwerkt.",
                    "The GlobeTrotr application and background tasks run on dedicated servers at Hetzner in Germany. This technically processes IP addresses, requests, temporary data and security logs.",
                  )}
                </li>
                <li>
                  {text(
                    "Supabase verzorgt database, authenticatie en bestandsopslag vanuit Central EU (Frankfurt, eu-central-1) in Duitsland. Primaire account-, reis- en documentgegevens staan daardoor binnen de Europese Unie zolang GlobeTrotr deze configuratie gebruikt. Andere leveranciers en optionele koppelingen kunnen gegevens buiten de EU verwerken; zie hieronder.",
                    "Supabase provides database, authentication and file storage from Central EU (Frankfurt, eu-central-1) in Germany. Primary account, trip and document data is therefore stored within the European Union while GlobeTrotr uses this configuration. Other providers and optional integrations may process data outside the EU; see below.",
                  )}
                </li>
                <li>
                  {text(
                    "ZXCS verzorgt tijdens de gecontroleerde overgang de bestaande mailboxen, IMAP en SMTP. GlobeTrotr bouwt daarnaast een eigen Stalwart-mailserver op de Duitse Node-02 voor nieuwe, gemigreerde en automatische reispostvakken. De afgeschermde relay verwerkt adres, naam, inhoud, bijlagen en bezorgstatus. Beheer- en postvakgeheimen staan uitsluitend op de server; afzonderlijke postvakwachtwoorden worden versleuteld in de database bewaard en zijn niet zichtbaar voor postvakgebruikers in de browser.",
                    "During the controlled transition, ZXCS continues to provide existing mailboxes, IMAP and SMTP. GlobeTrotr is also deploying a self-hosted Stalwart mail server on German Node-02 for new, migrated and automated trip mailboxes. The protected relay processes addresses, names, content, attachments and delivery status. Management and mailbox secrets remain server-side; individual mailbox passwords are stored encrypted in the database and are not exposed to mailbox users in the browser.",
                  )}
                </li>
                <li>
                  {text(
                    "Bedrijfsmailbijlagen staan in een niet-openbare Supabase Storage-bucket. Alleen bevoegde postvakgebruikers krijgen een kort geldige downloadlink. De eigen ClamAV-service op de Duitse server onderzoekt bijlagen bij ontvangst en verzending; bij een detectie of onbeschikbare scanner wordt de bijlage tegengehouden. De scaninhoud wordt niet in de scanlogs opgeslagen. Een scan kan geen volledige veiligheid garanderen.",
                    "Company-mail attachments are stored in a private Supabase Storage bucket. Only authorised mailbox users receive a short-lived download link. Our self-hosted ClamAV service on the German server checks attachments on receipt and before sending; detected malware or an unavailable scanner blocks the attachment. The scan content is not stored in scan logs. A scan cannot guarantee complete safety.",
                  )}
                </li>
                <li>
                  {text(
                    "Cloudflare Turnstile beschermt openbare registratie en het contactformulier tegen geautomatiseerd misbruik. Bij het openen en gebruiken van dat formulier kan Cloudflare technische browser-, netwerk- en interactiegegevens verwerken om vast te stellen of een verzoek menselijk en betrouwbaar is.",
                    "Cloudflare Turnstile protects public registration and the contact form against automated abuse. When opening and using that form, Cloudflare may process technical browser, network and interaction data to determine whether a request is human and trustworthy.",
                  )}
                </li>
                <li>
                  {text(
                    "Google Search Console wordt gebruikt om het eigendom en de vindbaarheid van het domein te beheren en geaggregeerde zoekprestaties te bekijken. De huidige koppeling voegt geen Google Analytics-script of advertentiecookies aan GlobeTrotr toe.",
                    "Google Search Console is used to manage domain ownership and discoverability and to review aggregated search performance. The current connection does not add a Google Analytics script or advertising cookies to GlobeTrotr.",
                  )}
                </li>
                <li>
                  {text(
                    "Paddle treedt bij betaalde aankopen op als Merchant of Record en zelfstandig verwerkingsverantwoordelijke voor checkout, betaling, belasting, facturatie, fraude- en compliancecontroles. Paddle kan noodzakelijke koper- en transactiegegevens aan GlobeTrotr verstrekken voor levering en ondersteuning. Op de checkout gelden ook de actuele privacyverklaring en kopersvoorwaarden van Paddle.",
                    "For paid purchases, Paddle acts as Merchant of Record and an independent controller for checkout, payment, tax, invoicing, fraud and compliance checks. Paddle may provide necessary buyer and transaction data to GlobeTrotr for fulfilment and support. Paddle's current privacy notice and buyer terms also apply at checkout.",
                  )}
                </li>
                <li>
                  {text(
                    "OpenStreetMap levert kaarttegels rechtstreeks aan je browser en kan daarbij je IP-adres en browsergegevens ontvangen. Locatiezoeken via Nominatim, weer via Open-Meteo en MET Norway en vluchtinformatie via SkyLink kunnen via onze server lopen: deze leveranciers zien dan het serveradres, maar ontvangen de noodzakelijke zoek- of reisgegevens. Wisselkoersen van Frankfurter kunnen rechtstreeks door je browser worden opgehaald; die aanbieder kan dan ook je IP-adres zien.",
                    "OpenStreetMap serves map tiles directly to your browser and may receive your IP address and browser information. Location searches through Nominatim, weather through Open-Meteo and MET Norway, and flight information through SkyLink may run through our server: those providers then see the server address but receive the necessary search or trip details. Exchange rates from Frankfurter may be fetched directly by your browser; that provider may also see your IP address.",
                  )}
                </li>
              </ul>
            </div>
          </Policy>
          <Policy
            title={text(
              "4. Europese opslag en beperkte doorgifte",
              "4. European storage and limited transfers",
            )}
          >
            {text(
              "De primaire GlobeTrotr-opslag staat in de Europese Unie. Als je vrijwillig inlogt via Google of Discord, verwerkt die aanbieder de aanmelding en deelt deze je account-ID en, afhankelijk van de verleende rechten, je naam, e-mailadres of profielfoto met Supabase Auth. De aanbieder kan gegevens buiten de EER verwerken volgens zijn eigen privacyvoorwaarden. GlobeTrotr ontvangt nooit je wachtwoord van die aanbieder. Ook gekozen functies zoals vluchtinformatie, locatiezoekopdrachten en betaling kunnen noodzakelijke gegevens aan een leverancier buiten de EER doorgeven. Voor doorgiften die GlobeTrotr zelf beheert, beoordelen we de toepasselijke doorgiftegrondslag en aanvullende maatregelen.",
              "GlobeTrotr's primary storage is located in the European Union. If you voluntarily sign in through Google or Discord, that provider processes the sign-in and shares your account ID and, depending on the permissions granted, your name, email address or profile image with Supabase Auth. The provider may process data outside the EEA under its own privacy terms. GlobeTrotr never receives your provider password. Selected features such as flight information, location searches and payments may also transfer necessary data to a supplier outside the EEA. For transfers managed by GlobeTrotr, we assess the applicable transfer mechanism and supplementary measures.",
            )}
          </Policy>
          <Policy title={text("5. Bewaren", "5. Retention")}>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                {text(
                  "Account- en reisgegevens: zolang je account actief is of totdat je ze verwijdert.",
                  "Account and trip data: while your account is active or until you delete it.",
                )}
              </li>
              <li>
                {text(
                  "Uitnodigingen en samenwerking: zolang de uitnodiging of reisrelatie nodig is.",
                  "Invitations and collaboration: while the invitation or trip relationship is needed.",
                )}
              </li>
              <li>
                {text(
                  "Lokale reiscache en bewust opgeslagen offline dagoverzichten: totdat je uitlogt, het pakket verwijdert, je account verwijdert of browseropslag wist. Het reispakket bevat route, planning en praktische boekingsinformatie, maar geen bestaande bedragen, boekingscodes of documenten. Uitgaven die je zelf offline invoert bevatten omschrijving, datum, categorie, bedrag, valuta en betaler en blijven lokaal totdat je ze bewust synchroniseert.",
                  "Local trip cache and explicitly saved offline day views: until you sign out, remove the pack, delete your account or clear browser storage. The trip pack contains the route, schedule and practical booking information, but excludes existing amounts, booking references and documents. Expenses you enter offline contain a description, date, category, amount, currency and payer and remain local until you explicitly sync them.",
                )}
              </li>
              <li>
                {text(
                  "Logs en back-ups: gedurende de technisch of juridisch noodzakelijke herstel-, beveiligings- of bewaartermijn; daarna worden ze verwijderd of overschreven.",
                  "Logs and backups: for the technically or legally necessary recovery, security or retention period; they are then deleted or overwritten.",
                )}
              </li>
              <li>
                {text(
                  "Transactionele e-mail en bezorgmetadata: deze kunnen in de verzendwachtrij en het log blijven voor bezorging, opnieuw proberen, foutonderzoek en ondersteuning. Neem contact op voor verwijdering waar mogelijk; wettelijke bewaarplichten en back-ups kunnen een uitzondering vormen.",
                  "Transactional email and delivery metadata: these may remain in the sending queue and log for delivery, retries, troubleshooting and support. Contact us to request deletion where possible; statutory retention duties and backups may be exceptions.",
                )}
              </li>
              <li>
                {text(
                  "Bedrijfspostvakken: berichten, bijlagen en concepten blijven beschikbaar zolang het postvak bestaat of totdat een bevoegde gebruiker ze verwijdert, behoudens back-ups en wettelijke bewaarplichten. Een nog niet gekoppelde uploadreservering vervalt na twee uur; de worker ruimt de reservering en het bijbehorende bestand vervolgens op. Vertaaltekst wordt tijdelijk verwerkt op de eigen server; een verstuurd of opgeslagen concept kan de vertaalde tekst bevatten.",
                  "Company mailboxes: messages, attachments and drafts remain available while the mailbox exists or until an authorised user removes them, subject to backups and legal retention duties. An unattached upload reservation expires after two hours; the worker then removes the reservation and its file. Translation text is processed temporarily on our own server; a sent or saved draft may contain the translated text.",
                )}
              </li>
              <li>
                {text(
                  "Boekingsmailconcepten: de reisplanner kiest een bewaartermijn van 1 tot 365 dagen. Daarna verwijdert de worker het concept, het bronbericht en gekoppelde bijlagen. Intrekken van het reisadres stopt nieuwe verwerking.",
                  "Booking email drafts: the trip planner selects a retention period from 1 to 365 days. The worker then removes the draft, source message and linked attachments. Revoking the trip address stops new processing.",
                )}
              </li>
              <li>
                {text(
                  "Agency-klantformulieren: de Agency kiest per sjabloon een bewaartermijn van 1 tot 730 dagen na het verlopen van de link. Daarna verwijdert de worker het verzoek en de gekoppelde antwoorden automatisch. Een bevoegde medewerker kan de link eerder intrekken of het antwoord archiveren.",
                  "Agency client forms: the Agency selects a retention period of 1 to 730 days after the link expires for each template. The worker then automatically removes the request and its answers. An authorised employee can revoke the link or archive the response earlier.",
                )}
              </li>
              <li>
                {text(
                  "Abonnements- en financiële administratie: gedurende de toepasselijke wettelijke bewaartermijn, ook nadat een account is verwijderd. Paddle bewaart eigen transactiegegevens volgens zijn wettelijke plichten en privacyverklaring.",
                  "Subscription and financial records: for the applicable statutory retention period, including after account deletion. Paddle retains its own transaction data under its legal obligations and privacy notice.",
                )}
              </li>
            </ul>
          </Policy>
          <Policy title={text("6. Openbare reizen", "6. Public trips")}>
            {text(
              "Reizen zijn standaard privé. Publiceer alleen gegevens die je mag delen. Een openbare link kan worden doorgestuurd en informatie kan worden gekopieerd. Boekingsnummers, prijzen, notities en live vluchtgegevens worden niet via de publieke reis-API vrijgegeven. Schakel delen uit zodra het niet meer nodig is.",
              "Trips are private by default. Publish only data you are allowed to share. A public link can be forwarded and information can be copied. Booking references, prices, notes and live flight data are not released through the public trip API. Disable sharing when no longer needed.",
            )}
          </Policy>
          <Policy title={text("7. Jouw AVG-rechten", "7. Your GDPR rights")}>
            {text(
              "Je kunt, waar van toepassing, vragen om informatie, inzage, correctie, verwijdering, beperking, overdraagbaarheid of bezwaar. Je kunt toestemming altijd intrekken zonder dat eerdere verwerking daardoor onrechtmatig wordt. Er is geen uitsluitend geautomatiseerde besluitvorming met juridische of vergelijkbaar belangrijke gevolgen. We kunnen je identiteit controleren en reageren normaal binnen één maand; verzoeken zijn doorgaans gratis. Je kunt een klacht indienen bij de Autoriteit Persoonsgegevens of de toezichthouder waar je woont of werkt.",
              "Where applicable, you can request information, access, correction, deletion, restriction, portability or object. You can withdraw consent at any time without making earlier processing unlawful. There is no solely automated decision-making with legal or similarly significant effects. We may verify your identity and normally respond within one month; requests are generally free. You may complain to the Dutch Data Protection Authority or the authority where you live or work.",
            )}
          </Policy>
          <section id="browseropslag">
            <h2 className="font-display text-lg font-semibold">
              {text("8. Cookies en browseropslag", "8. Cookies and browser storage")}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">{text("Naam", "Name")}</th>
                    <th className="p-2">{text("Doel", "Purpose")}</th>
                    <th className="p-2">{text("Categorie", "Category")}</th>
                    <th className="p-2">{text("Bewaring", "Retention")}</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <StorageRow
                    name="sb-…-auth-token"
                    purpose={text(
                      "Inlogsessie en tokenvernieuwing",
                      "Sign-in session and token refresh",
                    )}
                    category={text("Noodzakelijk", "Necessary")}
                    retention={text("Tot uitloggen of verlopen", "Until sign-out or expiry")}
                  />
                  <StorageRow
                    name="globetrotr.workspace.v1.…"
                    purpose={text(
                      "Lokale reiscache en herstel bij verbindingsverlies",
                      "Local trip cache and recovery after connection loss",
                    )}
                    category={text("Noodzakelijk", "Necessary")}
                    retention={text(
                      "Tot uitloggen, verwijderen of browser wissen",
                      "Until sign-out, deletion or browser clearing",
                    )}
                  />
                  <StorageRow
                    name="IndexedDB: globetrotr-offline-v1"
                    purpose={text(
                      "Een door jou gekozen reis zonder netwerk als alleen-lezen dagoverzicht openen",
                      "Open a trip you selected as a read-only day view without a network",
                    )}
                    category={text("Functionele voorkeur", "Functional preference")}
                    retention={text(
                      "Tot uitloggen, handmatig verwijderen, account verwijderen of browser wissen",
                      "Until sign-out, manual removal, account deletion or browser clearing",
                    )}
                  />
                  <StorageRow
                    name="globetrotr.privacy-choice.v1"
                    purpose={text("Je privacykeuze onthouden", "Remember your privacy choice")}
                    category={text("Noodzakelijk", "Necessary")}
                    retention={text("Tot wissen of vervangen", "Until cleared or replaced")}
                  />
                  <StorageRow
                    name="globetrotr.theme"
                    purpose={text(
                      "De gekozen lichte, donkere of systeemweergave vóór de eerste schermweergave toepassen",
                      "Apply the selected light, dark or system appearance before the first screen is painted",
                    )}
                    category={text("Functionele voorkeur", "Functional preference")}
                    retention={text(
                      "Tot wijzigen of browser wissen",
                      "Until changed or browser clearing",
                    )}
                  />
                  <StorageRow
                    name="globetrotr.locale"
                    purpose={text("Je taalkeuze onthouden", "Remember your language choice")}
                    category={text("Optionele voorkeur", "Optional preference")}
                    retention={text(
                      "Tot intrekken of browser wissen",
                      "Until withdrawal or browser clearing",
                    )}
                  />
                  <StorageRow
                    name="sidebar_state"
                    purpose={text(
                      "Onthouden of de navigatiebalk geopend of ingeklapt is",
                      "Remember whether the navigation sidebar is expanded or collapsed",
                    )}
                    category={text("Functionele voorkeur", "Functional preference")}
                    retention={text("7 dagen", "7 days")}
                  />
                  <StorageRow
                    name={text("Turnstile-beveiligingsgegevens", "Turnstile security data")}
                    purpose={text(
                      "Misbruik van registratie en het contactformulier herkennen en blokkeren",
                      "Detect and block abuse of registration and the contact form",
                    )}
                    category={text("Noodzakelijke beveiliging", "Necessary security")}
                    retention={text(
                      "Volgens de actuele Cloudflare Turnstile-instellingen",
                      "Under the current Cloudflare Turnstile settings",
                    )}
                  />
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {text(
                "De inventaris omvat localStorage, functionele cookies en vergelijkbare browseropslag. De website op globetrotr.nl en het accountportaal op portal.globetrotr.nl hebben gescheiden browseropslag. Je inlogsessie en lokale reiscache staan op de portalhost. Daardoor kan opnieuw inloggen nodig zijn wanneer je vanaf de website naar het portaal gaat; inloggegevens worden niet via de URL tussen domeinen gekopieerd. GlobeTrotr gebruikt geen advertentie-, marketing- of gedragsprofileringcookies. De taalvoorkeur wordt alleen na jouw privacykeuze bewaard; thema en zijbalkstand worden bewaard wanneer je die functies zelf instelt. Turnstile kan noodzakelijke beveiligingsgegevens gebruiken. Kies je voor Google of Discord, dan kan die aanbieder op zijn eigen domein cookies of opslag gebruiken volgens zijn eigen beleid.",
                "The inventory covers localStorage, functional cookies and similar browser storage. The website at globetrotr.nl and account portal at portal.globetrotr.nl have separate browser storage. Your sign-in session and local trip cache live on the portal host. You may therefore need to sign in again when moving from the website to the portal; credentials are not copied between domains through the URL. GlobeTrotr uses no advertising, marketing or behavioural-profiling cookies. The language preference is stored only after your privacy choice; theme and sidebar state are stored when you choose those functions. Turnstile may use necessary security data. If you choose Google or Discord, that provider may use cookies or storage on its own domain under its own policy.",
              )}
            </p>
          </section>
          <Policy
            title={text(
              "9. Beveiliging, kinderen en wijzigingen",
              "9. Security, children and changes",
            )}
          >
            {text(
              "We gebruiken onder meer toegangsrollen, afgeschermde serverfuncties, beperkte publieke velden, versleuteld transport, versleutelde postvakwachtwoorden, beperkte secrets en serverlogs voor beveiliging. VPS- en SMTP-toegang is beperkt tot bevoegde beheerders. Geen beveiliging is absoluut. De dienst is niet gericht op kinderen jonger dan 16 jaar. Als leveranciers, doelen, bewaartermijnen of gebruikte browsertechnieken wezenlijk veranderen, werken we deze verklaring bij en informeren we actieve gebruikers waar dat nodig is.",
              "We use access roles, protected server functions, limited public fields, encrypted transport, encrypted mailbox passwords, restricted secrets and server logs for security. VPS and SMTP access is limited to authorised administrators. No security is absolute. The service is not directed at children under 16. If suppliers, purposes, retention periods or browser technologies materially change, we update this notice and inform active users where required.",
            )}
          </Policy>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={openPrivacyChoices}>
          {text("Privacykeuzes wijzigen", "Change privacy choices")}
        </Button>
        {user && (
          <Button asChild>
            <Link to="/account">
              <FileDown className="size-4" />{" "}
              {text("Exporteren of verwijderen", "Export or delete")}
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <a
            href="https://autoriteitpersoonsgegevens.nl/een-tip-of-klacht-indienen-bij-de-ap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Scale className="size-4" /> Autoriteit Persoonsgegevens
          </a>
        </Button>
      </div>
    </div>
  );
}

function Policy({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
function StorageRow({
  name,
  purpose,
  category,
  retention,
}: {
  name: string;
  purpose: string;
  category: string;
  retention: string;
}) {
  return (
    <tr className="border-b align-top">
      <td className="p-2 font-mono text-foreground">{name}</td>
      <td className="p-2">{purpose}</td>
      <td className="p-2">{category}</td>
      <td className="p-2">{retention}</td>
    </tr>
  );
}
