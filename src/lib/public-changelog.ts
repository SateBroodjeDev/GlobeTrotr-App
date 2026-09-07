export type PublicChangeKind = "new" | "improved" | "fixed" | "secure";

export type PublicChange = {
  title: string;
  description: string;
  kind: PublicChangeKind;
};

export type PublicRelease = {
  id: string;
  version: string;
  publishedAt: string;
  title: string;
  summary: string;
  changes: PublicChange[];
};

export const PUBLIC_BETA_STATUS = {
  label: "Voorbereiding testopening",
  description:
    "De kern van GlobeTrotr wordt klaargemaakt voor de eerste groep testers. Reizen plannen, kosten bijhouden en openbaar delen staan centraal in deze test.",
  unavailable: [
    "Inloggen met Apple, Google of Microsoft",
    "Automatische app-e-mails en reisuitnodigingen per e-mail",
  ],
} as const;

/** Public-safe release notes. Never include secrets, private data or internal identifiers. */
export const PUBLIC_RELEASES: PublicRelease[] = [
  {
    id: "2026-09-07-public-trips",
    version: "Beta 0.3",
    publishedAt: "2026-09-07T18:40:00+02:00",
    title: "Openbare reizen komen tot leven",
    summary:
      "Een gedeelde reis voelt nu als een echt reisverhaal, met route, planning en heldere details.",
    changes: [
      {
        kind: "new",
        title: "Interactieve routekaart",
        description:
          "Bekijk de volledige route, selecteer een bestemming en volg de genummerde stops op de kaart.",
      },
      {
        kind: "improved",
        title: "Dagplanning in overzichtelijke kaarten",
        description:
          "Activiteiten zijn per dag gegroepeerd in een rustige tijdlijn die ook op telefoon prettig leest.",
      },
      {
        kind: "improved",
        title: "Een sterkere eerste indruk",
        description:
          "Reisnaam, periode, eigenaar en bestemmingen staan samen in een nieuwe visuele introductie.",
      },
      {
        kind: "secure",
        title: "Alleen gedeelde gegevens",
        description:
          "Privé-uitgaven, betalers, bonnetjes en boekingsdetails blijven buiten de openbare reisweergave.",
      },
    ],
  },
  {
    id: "2026-09-07-reliable-saving",
    version: "Beta 0.2",
    publishedAt: "2026-09-07T17:30:00+02:00",
    title: "Betrouwbaarder opslaan en beter op mobiel",
    summary:
      "Uitgaven en reiswijzigingen worden veiliger bewaard en formulieren passen beter op kleine schermen.",
    changes: [
      {
        kind: "fixed",
        title: "Uitgaven weer bijwerken",
        description:
          "Bestaande uitgaven kunnen weer worden aangepast en na herladen correct worden teruggelezen.",
      },
      {
        kind: "fixed",
        title: "Vluchtvelden binnen beeld",
        description: "Vertrek- en aankomsttijd vallen op telefoons niet meer buiten het formulier.",
      },
      {
        kind: "improved",
        title: "Uitgavenoverzicht op telefoon",
        description:
          "Brede kostengegevens blijven bereikbaar via een nette horizontale weergave binnen het overzicht.",
      },
      {
        kind: "secure",
        title: "Bescherming tegen overschrijven",
        description:
          "Bij wijzigingen vanuit twee tabbladen wordt een conflict gemeld voordat nieuwere gegevens verloren kunnen gaan.",
      },
    ],
  },
  {
    id: "2026-09-07-account",
    version: "Beta 0.1",
    publishedAt: "2026-09-07T16:30:00+02:00",
    title: "Meer inzicht in je account",
    summary:
      "Je ziet nu direct welk plan actief is en hoeveel reizen binnen je account worden gebruikt.",
    changes: [
      {
        kind: "new",
        title: "Plan en reisgebruik",
        description:
          "Accountinstellingen tonen je plan, planlimiet en het aantal actieve en totale reizen.",
      },
      {
        kind: "improved",
        title: "Slimme abonnementsknop",
        description:
          "Ga vanuit je account direct naar upgrades of naar het beheer van je huidige abonnement.",
      },
      {
        kind: "fixed",
        title: "Juiste actie op gedeelde reizen",
        description:
          "Ben je al ingelogd, dan ga je vanuit een openbare reis direct naar je eigen reizen.",
      },
    ],
  },
];
