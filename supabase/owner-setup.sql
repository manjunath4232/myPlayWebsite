-- First create the owner's email/password user in Authentication > Users.
-- Replace OWNER_EMAIL with the exact email you used, then run as postgres in SQL Editor.
-- Never put a password in this file. Disable public signups in Authentication settings.
insert into public.owners(user_id)
select id from auth.users where email = 'OWNER_EMAIL'
on conflict do nothing;
-- Verify that the expected user was added:
select u.email from public.owners o join auth.users u on u.id=o.user_id;
