-- Normalize admin authorization for lock/unlock RPC.
-- Previous version relied on app.current_user_name, which does not match set_user_context().

CREATE OR REPLACE FUNCTION toggle_name_locked_in(
	p_name_id UUID,
	p_locked_in BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_user_name TEXT;
	v_current_locked_in BOOLEAN;
BEGIN
	-- Keep audit attribution on current app user context.
	v_user_name := get_current_user_name();

	-- Enforce admin authorization through canonical role check.
	IF NOT is_admin() THEN
		RAISE EXCEPTION 'Admin access required to toggle locked_in status';
	END IF;

	SELECT locked_in INTO v_current_locked_in
	FROM cat_name_options
	WHERE id = p_name_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Name not found';
	END IF;

	IF v_current_locked_in IS DISTINCT FROM p_locked_in THEN
		UPDATE cat_name_options
		SET locked_in = p_locked_in
		WHERE id = p_name_id;

		INSERT INTO audit_log (
			table_name,
			operation,
			old_values,
			new_values,
			user_name
		) VALUES (
			'cat_name_options',
			CASE WHEN p_locked_in THEN 'LOCK_IN' ELSE 'UNLOCK_IN' END,
			jsonb_build_object('locked_in', v_current_locked_in),
			jsonb_build_object('locked_in', p_locked_in),
			v_user_name
		);
	END IF;

	RETURN p_locked_in;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_name_locked_in(UUID, BOOLEAN) TO authenticated;
