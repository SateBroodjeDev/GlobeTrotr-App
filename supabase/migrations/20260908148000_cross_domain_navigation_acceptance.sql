BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES ('public.cross-domain-navigation','Publiek',
  'Vanaf portal: logo, Website/Home en publieke links openen globetrotr.nl; registratie en Reizen blijven op portal; controleer op telefoon ook merknamen, navigatie, modals, aanraakvlakken en CTA''s zonder overlap',
  'From portal: logo, Website/Home and public links open globetrotr.nl; registration and Trips stay on portal; on mobile also verify brand names, navigation, dialogs, touch targets and CTAs without overlap',460)
ON CONFLICT (item_key) DO UPDATE SET
  category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
