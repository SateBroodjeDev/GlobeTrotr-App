BEGIN;
CREATE TABLE public.contact_messages(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),name TEXT NOT NULL CHECK(char_length(name) BETWEEN 2 AND 100),email TEXT NOT NULL CHECK(char_length(email)<=254),subject TEXT NOT NULL CHECK(char_length(subject) BETWEEN 3 AND 160),message TEXT NOT NULL CHECK(char_length(message) BETWEEN 20 AND 3000),locale TEXT NOT NULL DEFAULT 'nl',status TEXT NOT NULL DEFAULT 'new' CHECK(status IN('new','reviewing','answered','closed')),created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.contact_messages FROM PUBLIC,anon,authenticated;GRANT ALL ON public.contact_messages TO service_role;
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('public.navigation','Publiek','Gebundelde publieke navigatie op telefoon en desktop controleren','Verify grouped public navigation on mobile and desktop',101),
('public.testimonials','Publiek','Recensie toevoegen, publiceren, bewerken en archiveren controleren','Verify adding, publishing, editing and archiving a testimonial',102),
('public.commerce','Publiek','Prijzen, betaalde betavoorwaarden, opzegging en terugbetaling controleren','Verify pricing, paid beta terms, cancellation and refunds',103),
('public.contact','Publiek','Contactformulier, spambeveiliging en ontvangst controleren','Verify contact form, spam protection and receipt',104),
('content.translation','Communicatie','Automatische vertaalconcepten en handmatige goedkeuring controleren','Verify automatic translation drafts and manual approval',105)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position;
COMMIT;
