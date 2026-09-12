-- Uitvoeren na 20260908070000_corporate_staff_management.sql. Alles wordt teruggedraaid.
BEGIN;
DO $$ DECLARE v_user UUID:=gen_random_uuid();BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at)VALUES(v_user,'staff@example.invalid',now());
 INSERT INTO public.platform_admins(user_id,role,permissions)VALUES(v_user,'support','{"mail":true,"issues":true}');
 IF NOT EXISTS(SELECT 1 FROM public.platform_admins WHERE user_id=v_user AND permissions->>'mail'='true')THEN RAISE EXCEPTION 'Personeelsrechten ontbreken';END IF;
 IF has_table_privilege('authenticated','public.platform_admins','SELECT')THEN RAISE EXCEPTION 'Browserrol kan personeelsrechten lezen';END IF;
END $$;
ROLLBACK;
