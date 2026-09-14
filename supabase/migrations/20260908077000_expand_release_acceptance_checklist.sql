-- Vervang brede acceptatieregels door concrete, blijvende praktijktests.
BEGIN;
DELETE FROM public.release_checklist_items WHERE item_key IN(
 'auth.roles','auth.invites','trip.core','trip.money','agency.workflow','agency.branding',
 'notifications.all','public.website','backup.restore','providers.quotas','worker.runtime',
 'security.final','production.rollback'
);
INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position) VALUES
('public.home','Publieke website','Homepage: waardepropositie, dashboardvoorbeeld en acties in NL/EN op telefoon en desktop','Homepage: verify value proposition, dashboard preview and actions in NL/EN on mobile and desktop',100),
('public.demo','Publieke website','Demo: route, boekingen, dagplanning, paklijst en verrekening volledig doorlopen','Demo: complete route, bookings, itinerary, packing and settlement flow',110),
('public.features','Publieke website','Mogelijkheden: functieoverzicht, doelgroepen en alle links controleren','Features: verify feature overview, audiences and every link',120),
('public.about','Publieke website','Over GlobeTrotr: foto, oprichtersverhaal, principes en feedbacklinks controleren','About GlobeTrotr: verify photo, founder story, principles and feedback links',130),
('public.navigation','Publieke website','Gebundelde navigatie, Engelstalige slugs en oude redirects controleren','Verify grouped navigation, English slugs and legacy redirects',140),
('public.testimonials','Publieke website','Recensie toevoegen, publiceren, bewerken, archiveren en openbare weergave controleren','Verify adding, publishing, editing, archiving and public display of a testimonial',150),
('public.commerce','Betaling en recht','Free, Pro en Agency vergelijken; europrijzen, doelgroepadvies en checkouttekst controleren','Compare Free, Pro and Agency; verify euro prices, audience guidance and checkout copy',200),
('public.legal','Betaling en recht','Voorwaarden, privacy, cookies, beta en terugbetalingen volledig in NL/EN controleren','Review terms, privacy, cookies, beta and refunds completely in NL/EN',210),
('billing.paddle','Betaling en recht','Paddle checkout, belasting, verlenging, opzegging, webhook, factuur en terugbetaling end-to-end testen','Test Paddle checkout, tax, renewal, cancellation, webhook, invoice and refund end to end',220),
('public.contact','Contact en feedback','Contactcategorieën, Turnstile, ontvangst, beheerinbox, antwoord en statuswijziging controleren','Verify contact categories, Turnstile, receipt, admin inbox, reply and status change',300),
('feedback.lifecycle','Contact en feedback','In-appfeedback indienen, vertalen, wijzigen, archiveren en indiener informeren','Submit, translate, update and archive in-app feedback and notify its author',310),
('issues.lifecycle','Contact en feedback','Bekend probleem publiceren, GitHub synchroniseren, oplossen, archiveren en verwijderen','Publish, sync, resolve, archive and delete a known issue',320),
('account.lifecycle','Accounts en toegang','Registreren, bevestigen, inloggen, uitloggen, blokkeren, herstellen en Nederlandse foutmelding controleren','Verify sign-up, confirmation, sign-in, sign-out, blocking, recovery and Dutch error copy',400),
('account.privacy','Accounts en toegang','Gegevensexport, accountverwijdering, privacykeuzes en auditregistratie controleren','Verify data export, account deletion, privacy choices and audit logging',410),
('access.roles','Accounts en toegang','Eigenaar, reiziger, viewer, finance, client en Agency-rechten positief en negatief testen','Test owner, traveller, viewer, finance, client and Agency permissions positively and negatively',420),
('access.invites','Accounts en toegang','E-mailuitnodiging, accountmelding, link, accepteren, weigeren, intrekken en verwijderen testen','Test email invite, account notification, link, accept, decline, revoke and removal',430),
('ui.theme','Accounts en toegang','Dark mode zonder lichte flits, routekaart en mobiele schermen controleren','Verify dark mode without light flash, route map and mobile screens',440),
('trip.lifecycle','Reizen','Reis maken, meerdere velden tegelijk wijzigen, archiveren, herstellen en verwijderen','Create a trip, edit multiple fields, archive, restore and delete it',500),
('trip.content','Reizen','Route, activiteiten, vervoer, boekingen, documenten, paklijst en exports controleren','Verify route, activities, transport, bookings, documents, packing and exports',510),
('trip.money','Reizen','Uitgaven, deelnemerskoppeling, financiële privacy, bonnetjes, valuta en verrekening controleren','Verify expenses, participant links, financial privacy, receipts, currency and settlement',520),
('trip.public','Reizen','Openbare reis zonder en met PIN, gedeelde velden en Agency-branding controleren','Verify public trip without and with PIN, shared fields and Agency branding',530),
('trip.notifications','Reizen','Uitnodiging, rol, verwijdering, wijzigingen, boeking, document en verrekening zonder duplicaten melden','Verify deduplicated invite, role, removal, change, booking, document and settlement notifications',540),
('agency.team','Agency','Team uitnodigen en rollen, persoonlijke rechten, blokkade, herstel en verwijdering testen','Test team invitations and roles, personal permissions, blocking, recovery and removal',600),
('agency.clients','Agency','Klant maken, aan reis koppelen, toegang controleren, archiveren en herstellen','Create a client, link a trip, verify access, archive and restore',610),
('agency.operations','Agency','Leveranciers, taken, documenten, sjablonen en werkvoorraad met rechten testen','Test suppliers, tasks, documents, templates and work queue with permissions',620),
('agency.quotes','Agency','Offerte maken, delen, accepteren/weigeren, intrekken, vernieuwen en converteren','Create, share, accept/decline, revoke, renew and convert a quote',630),
('agency.branding','Agency','Naam, tagline, logo, reisbranding, publieke weergave en downgrade naar GlobeTrotr testen','Test name, tagline, logo, trip branding, public display and downgrade to GlobeTrotr',640),
('corporate.users','Corporate Admin','Gebruikersdetail, reizen, planwijziging, blokkade, herstel en auditactor controleren','Verify user detail, trips, plan changes, blocking, recovery and audit actor',700),
('corporate.operations','Corporate Admin','Status, platformbericht, banner, quota-reset, providerstop en infrastructuurbeheer testen','Test status, platform message, banner, quota reset, provider stop and infrastructure management',710),
('corporate.business','Corporate Admin','Medewerkersrechten, mailboxen, handtekeningen, facturen, statistieken en exports controleren','Verify staff permissions, mailboxes, signatures, invoices, statistics and exports',720),
('notifications.maintenance','Meldingen','Voorkeuren, vertaling, deduplicatie, banners en geplande onderhoudsmeldingen controleren','Verify preferences, translation, deduplication, banners and scheduled maintenance notifications',800),
('hosting.runtime','Hosting en productie','Web- en workercontainer, SMTP, domeinen, TLS, healthchecks, retries en veilige logs op staging testen','Test web and worker containers, SMTP, domains, TLS, health checks, retries and safe logs on staging',900),
('production.recovery','Hosting en productie','Back-up, herstel, monitoring, incidentmelding en rollback praktisch oefenen','Practise backup, recovery, monitoring, incident notification and rollback',910),
('security.final','Beveiliging','Finale deep securityscan uitvoeren, bevindingen registreren en alle kritieke en hoge risico’s oplossen','Run the final deep security scan, record findings and resolve every critical and high risk',1000)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,position=EXCLUDED.position,updated_at=now();
COMMIT;
