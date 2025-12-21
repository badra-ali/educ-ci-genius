-- Fix search_path for new functions
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(xp::NUMERIC / 100)) + 1)::INTEGER;
END;
$$;

CREATE OR REPLACE FUNCTION public.xp_for_level(lvl INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN ((lvl - 1) * (lvl - 1) * 100)::INTEGER;
END;
$$;