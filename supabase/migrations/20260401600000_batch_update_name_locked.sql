CREATE OR REPLACE FUNCTION public.batch_update_name_locked(
  p_name_ids UUID[],
  p_is_locked BOOLEAN
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can batch update name locked status';
  END IF;

  IF COALESCE(array_length(p_name_ids, 1), 0) = 0 THEN
    RETURN true;
  END IF;

  v_user_name := get_current_user_name();

  -- We need to audit log the changes, so we loop over the names that actually changed
  -- or we can do it in a single statement.
  -- We'll do a simple UPDATE and rely on the fact that audit logs for bulk actions
  -- might not need individual entries, but to match toggle_name_locked_in we should
  -- probably do individual entries or a single bulk entry.
  -- To be safe, we do an INSERT INTO SELECT for audit logs.

  WITH updated AS (
    UPDATE cat_names
    SET locked_in = p_is_locked
    WHERE id = ANY(p_name_ids)
      AND locked_in IS DISTINCT FROM p_is_locked
    RETURNING id, (NOT p_is_locked) AS old_locked_in
  )
  INSERT INTO public.cat_audit_log (
    table_name,
    operation,
    old_values,
    new_values,
    user_name
  )
  SELECT
    'cat_names',
    CASE WHEN p_is_locked THEN 'LOCK_IN_BATCH' ELSE 'UNLOCK_IN_BATCH' END,
    jsonb_build_object('locked_in', old_locked_in),
    jsonb_build_object('locked_in', p_is_locked),
    v_user_name
  FROM updated;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.batch_update_name_locked(UUID[], BOOLEAN) TO authenticated;
