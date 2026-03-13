-- Delete the duplicate member record (keep the first one created)
DELETE FROM members WHERE id = '569259fb-3e29-4a46-9c39-21272fe9f31b';

-- Add unique constraint to prevent duplicate member records per user
ALTER TABLE members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);