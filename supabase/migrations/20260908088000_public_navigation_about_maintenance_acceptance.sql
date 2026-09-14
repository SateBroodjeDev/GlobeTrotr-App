BEGIN;

UPDATE public.release_checklist_items SET
 label_nl='Rustige publieke hoofdnavigatie controleren; Contact en Status moeten ook ingelogd direct bereikbaar zijn',
 label_en='Verify the concise public navigation; Contact and Status must also be directly available when signed in',
 updated_at=now()
WHERE item_key='public.navigation';

UPDATE public.release_checklist_items SET
 label_nl='Over GlobeTrotr als doorlopend oprichtersverhaal, met foto, privacyvisie en duidelijke acties controleren',
 label_en='Verify About GlobeTrotr as a flowing founder story with photo, privacy vision and clear actions',
 updated_at=now()
WHERE item_key='public.about';

UPDATE public.release_checklist_items SET
 label_nl='Onderhoudspagina controleren op compacte kop, reden, countdown, gegevensuitleg en beheerderslogin',
 label_en='Verify the maintenance page has a compact heading, reason, countdown, data explanation and administrator sign-in',
 updated_at=now()
WHERE item_key='public.maintenance';

COMMIT;
