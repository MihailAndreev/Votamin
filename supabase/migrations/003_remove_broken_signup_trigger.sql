-- ================================================================
-- Migration 003: Remove broken duplicate signup trigger
-- Purpose: Fixes 500 Internal Server Error on user signup caused by 
--          unqualified table reference in create_profile_on_signup
-- ================================================================

DROP TRIGGER IF EXISTS profile_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_on_signup();
