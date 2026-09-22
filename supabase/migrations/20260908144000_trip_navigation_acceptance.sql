BEGIN;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('dashboard.focus-trip','Reizen',
 'Dashboard: lopende of eerstvolgende reis vooraan, aanmaak in venster, overige reizen in status- en datumvolgorde testen',
 'Dashboard: test current or next trip first, creation in a dialog, and remaining trips ordered by status and date',452),
('trip.mobile-navigation','Reizen',
 'Reisplanner op telefoon: gegroepeerde onderdeellijst, alle tabs bereikbaar, juiste standaard Vandaag of Routekaart en toetsenbordbediening testen',
 'On mobile, test grouped trip sections, access to every tab, Today or Map default and keyboard navigation',453)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

COMMIT;
