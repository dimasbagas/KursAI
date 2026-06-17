-- Add extra settings fields to public.businesses table

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS legal_entity text default 'Personal',
ADD COLUMN IF NOT EXISTS npwp text,
ADD COLUMN IF NOT EXISTS use_tax_scheme boolean default true,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS description text;
