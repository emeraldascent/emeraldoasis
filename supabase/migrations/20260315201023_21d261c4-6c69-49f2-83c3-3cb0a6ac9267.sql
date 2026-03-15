
ALTER TABLE public.members
ADD COLUMN authnet_customer_profile_id text DEFAULT NULL,
ADD COLUMN authnet_payment_profile_id text DEFAULT NULL,
ADD COLUMN saved_card_last4 text DEFAULT NULL;
