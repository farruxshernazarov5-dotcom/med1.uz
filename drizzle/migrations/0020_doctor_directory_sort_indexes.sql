CREATE INDEX IF NOT EXISTS doctors_external_reviews_rating_idx ON public.doctors_external (reviews_count DESC NULLS LAST, rating);
CREATE INDEX IF NOT EXISTS doctors_external_experience_rating_idx ON public.doctors_external (experience DESC NULLS LAST, rating DESC);
CREATE INDEX IF NOT EXISTS doctors_external_created_idx ON public.doctors_external (created_at DESC);