-- Fix search_path for resources_search_text function
CREATE OR REPLACE FUNCTION public.resources_search_text(r public.resources)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_tsvector('simple', 
    r.title || ' ' || 
    r.author || ' ' || 
    COALESCE(array_to_string(r.tags, ' '), '') || ' ' || 
    COALESCE(r.summary, '')
  )
$$;