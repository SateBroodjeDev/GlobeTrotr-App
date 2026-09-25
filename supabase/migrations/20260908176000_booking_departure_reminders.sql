BEGIN;

-- De worker roept dit ieder uur aan. De unieke event_key maakt iedere
-- herinnering idempotent en de bestaande boekingsvoorkeur filtert ontvangers.
CREATE OR REPLACE FUNCTION public.run_booking_departure_reminders(
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_count INTEGER;
BEGIN
  INSERT INTO public.notifications(user_id,kind,title,body,trip_uuid,event_key,link)
  SELECT recipient.user_id,
    'trip_booking',
    CASE
      WHEN recipient.english AND item.item_type='flight' THEN 'Flight departs within 24 hours'
      WHEN recipient.english AND item.item_type='lodging' THEN 'Accommodation check-in within 24 hours'
      WHEN recipient.english AND item.item_type='car_rental' THEN 'Rental car collection within 24 hours'
      WHEN recipient.english THEN 'Transport departs within 24 hours'
      WHEN item.item_type='flight' THEN 'Vlucht vertrekt binnen 24 uur'
      WHEN item.item_type='lodging' THEN 'Inchecken bij verblijf binnen 24 uur'
      WHEN item.item_type='car_rental' THEN 'Huurauto ophalen binnen 24 uur'
      ELSE 'Vervoer vertrekt binnen 24 uur'
    END,
    CASE WHEN recipient.english
      THEN left(item.title,120) || '. Check the booking details before departure.'
      ELSE left(item.title,120) || '. Controleer voor vertrek de boekingsgegevens.'
    END,
    item.trip_uuid,
    'booking-reminder:' || item.trip_uuid::TEXT || ':' || item.id,
    '/trips/' || trip.id
  FROM public.trip_travel_items item
  JOIN public.trips trip ON trip.trip_uuid=item.trip_uuid AND NOT trip.archived
  CROSS JOIN LATERAL (
    SELECT member.user_id,
      COALESCE(profile.locale='en-GB',false) AS english,
      COALESCE(NULLIF(profile.timezone,''),'UTC') AS timezone
    FROM (
      SELECT trip.workspace_user_id AS user_id
      UNION
      SELECT trip_member.user_id FROM public.trip_members trip_member
      WHERE trip_member.trip_uuid=item.trip_uuid AND trip_member.status='active'
        AND trip_member.user_id IS NOT NULL
      UNION
      SELECT workspace_member.user_id FROM public.workspace_members workspace_member
      WHERE workspace_member.workspace_uuid=trip.workspace_uuid
        AND workspace_member.status='active' AND workspace_member.user_id IS NOT NULL
        AND private.agency_actor_has_permission(
          trip.workspace_uuid,workspace_member.user_id,'trips_view'
        )
    ) member
    LEFT JOIN public.profiles profile ON profile.id=member.user_id
  ) recipient
  CROSS JOIN LATERAL (
    SELECT (
      item.start_date::TEXT || ' ' ||
      CASE WHEN item.details->>'startTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        THEN item.details->>'startTime' ELSE '09:00' END
    )::TIMESTAMP AT TIME ZONE
      CASE WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names zone
        WHERE zone.name=recipient.timezone) THEN recipient.timezone ELSE 'UTC' END
      AS starts_at
  ) schedule
  WHERE item.item_type IN('flight','lodging','transport','car_rental')
    AND schedule.starts_at>p_now
    AND schedule.starts_at<=p_now+interval '24 hours'
  ON CONFLICT(user_id,event_key) DO NOTHING;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.run_booking_departure_reminders(TIMESTAMPTZ)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_booking_departure_reminders(TIMESTAMPTZ)
  TO service_role;

INSERT INTO public.release_checklist_items(item_key,category,label_nl,label_en,position)
VALUES('trip.booking-reminders','Communicatie',
  'Boeking met en zonder tijd testen: maximaal één NL/EN vertrek-, check-in- of ophaalherinnering binnen 24 uur, boekingsvoorkeur uit en geen boekingscode in webpush',
  'Test a booking with and without a time: at most one NL/EN departure, check-in or collection reminder within 24 hours, booking preference off and no booking reference in web push',476)
ON CONFLICT(item_key) DO UPDATE SET category=EXCLUDED.category,
  label_nl=EXCLUDED.label_nl,label_en=EXCLUDED.label_en,
  position=EXCLUDED.position,updated_at=now();

NOTIFY pgrst,'reload schema';
COMMIT;
