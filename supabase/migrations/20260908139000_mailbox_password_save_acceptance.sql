BEGIN;

UPDATE public.release_checklist_items
SET label_nl = 'Postvakwachtwoord opslaan en vervangen: geen fout na geslaagde opslag, opgeslagen status met sterretjes, geen geheim in de browser; Node-01 en Node-02 gebruiken dezelfde mailboxsleutel',
    label_en = 'Save and replace a mailbox password: no error after a successful save, masked stored status, no secret in the browser; Node-01 and Node-02 use the same mailbox key',
    updated_at = now()
WHERE item_key = 'corporate.mailbox-credentials';

COMMIT;
