# Productcontrole — 22 september 2026

Deze controle vergelijkt de huidige routes en componenten met de bestaande roadmap en actuele officiële productpagina's van concurrenten. Het is een code- en inhoudscontrole; visuele weergave op echte telefoons, productiegegevens en betaalstromen moeten nog handmatig worden geaccepteerd.

## Nu verbeterd

- De bedrijfsmail-inbox toont geen handtekeningeditor meer. Corporate Admin beheert de handtekening per postvak en toont een voorbeeld. Uitgaande mail blijft de opgeslagen handtekening gebruiken.
- Passkeys, wachtwoord wijzigen en het indienen van privacyverzoeken openen vanuit Account in afzonderlijke vensters. De eigen verzoekgeschiedenis blijft zichtbaar op de pagina.
- De publieke homepage gebruikt geen verouderde beta-belofte meer. Het dashboard telt actieve reizen zonder gearchiveerde reizen mee te rekenen.

## Huidige ervaring en volgende verbeteringen

| Gebied | Huidige code | Volgende verbetering | Prioriteit |
| --- | --- | --- | --- |
| Homepage | Waardepropositie, voorbeeldreis, sociale bewijskracht en openbare reizen staan op één lange pagina. | Maak de eerste schermhoogte compacter en toets de conversieroute op mobiel; gebruik een echte screenshot of korte interactieve preview in plaats van alleen voorbeeldcijfers. | P1 |
| Dashboard | Reiskaarten, filters en reisvergelijking bestaan. De lopende of eerstvolgende reis staat nu vooraan en aanmaken opent in een venster. | Vergelijken staat nog vóór de reiskaarten; toets met echte data of ook die actie naar een venster moet. | P1 |
| Reisplanner | Vandaag, route, reisschema, bewerken, uitgaven, geldtools, paklijst, documenten en instellingen zijn bereikbaar. Telefoons krijgen nu één gegroepeerde onderdeellijst. | Test de nieuwe bediening op kleine schermen en met een toetsenbord; controleer dat terugkeren tussen onderdelen logisch voelt. | P1 |
| Reisschema | Boeking- en dagplanningbewerking hebben al een eigen subtab. | Geef een duidelijke primaire actie “Voeg onderdeel toe” en plaats secundaire formulieren in vensters; toets eerst met gebruikers voor verdere verbouwing. | P2 |
| Publieke reis | Openbare reisroute, kaart en deelpagina bestaan. | Maak privacykeuze en zichtbare details vooraf duidelijk met een voorbeeld van de gepubliceerde pagina. | P2 |
| Account | Beveiligingsmethoden en abonnement zijn gescheiden kaarten, met enkele langere formulieren. | Controleer de nieuwe vensters met toetsenbord, screenreader en kleine telefoons; TOTP eventueel in hetzelfde beveiligingsvenster onderbrengen. | P1 |
| Prestaties | De productiebuild slaagt, maar waarschuwt voor een initiële JavaScriptbundel van circa 619 kB vóór compressie. | Splits zware, niet direct zichtbare onderdelen gericht op en meet laadtijd op een langzame telefoon voordat extra functies worden toegevoegd. | P1 |

## Concurrenten: wat is al aanwezig, wat ontbreekt

De officiële [Wanderlog-productpagina](https://wanderlog.com/) noemt gezamenlijke planning, reserveringen, kaart, kostenverdeling, paklijsten, offline toegang, routeoptimalisatie en aanbevelingen. GlobeTrotr heeft de eerste vijf kernstromen grotendeels; echte offline modus, automatische optimalisatie en plaatsaanbevelingen staan al op de roadmap. Laat die als toekomstige functies staan totdat betrouwbare synchronisatie, kaartrechten, kosten en privacy zijn uitgewerkt.

[TripIt](https://www.tripit.com/web/free) bouwt reizen uit doorgestuurde boekingsmails, synchroniseert met agenda's en deelt plannen. GlobeTrotr heeft agenda-export en een live ICS-feed, maar de import van doorgestuurde bevestigingen ontbreekt. Dat is waarschijnlijk de nuttigste nieuwe functie voor minder handmatig werk. Begin met een uniek reisadres en een **controleerbaar concept**; lees geen persoonlijke mailbox zonder aparte toestemming.

[Polarsteps](https://www.polarsteps.com/) legt de nadruk op een visueel reisverhaal, foto's, route en instelbare zichtbaarheid. GlobeTrotr heeft openbare reizen en omslagfoto's, maar geen tijdlijn voor foto's/verhalen tijdens of na de reis. Een optionele reisdagboeklaag kan de publieke deelpagina sterker maken, mits documenten, kosten en privé-notities strikt gescheiden blijven.

## Geprioriteerde bouwkandidaten

1. Boekingsmail naar controleerbaar reisconcept: minder invoer, sterk onderscheidend naast bestaande planning; pas bouwen met veilige bijlageverwerking en toestemming.
2. Mobiele navigatie van de reisplanner vereenvoudigen en het dashboard op de eerstvolgende reis richten; dit levert waarschijnlijk eerder waarde op dan nog een extra tab.
3. Optioneel visueel reisdagboek met foto's en expliciete publicatiekeuze; geen automatische locatiepublicatie.
4. Echte offline modus met versiestatus en conflictbehandeling; groot werk en bestaande roadmapprioriteit.

Niet als “klaar” beschouwd: responsieve schermcontrole op echte apparaten, een volledige toegankelijkheidstest, productiebetalingen en live mail/ICS onder eigen domein. Die blijven in de releasechecklist.
