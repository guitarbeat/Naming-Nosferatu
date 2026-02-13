-- RPC function to toggle locked_in status of a name (admin only)

CREATE OR REPLACE FUNCTION toggle_name_locked_in(
    p_name_id UUID,
    p_locked_in BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_name TEXT;
    v_is_admin BOOLEAN := FALSE;
    v_current_locked_in BOOLEAN;
BEGIN
    -- Get current user from context
    v_user_name := current_setting('app.current_user_name', true);
    
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_name = v_user_name 
        AND role = 'admin'
    ) INTO v_is_admin;
    
    -- Only admins can toggle locked_in status
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Admin access required to toggle locked_in status';
    END IF;
    
    -- Get current locked_in status
    SELECT locked_in INTO v_current_locked_in
    FROM cat_name_options
    WHERE id = p_name_id;
    
    -- Check if name exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Name not found';
    END IF;
    
    -- Only update if the status is actually changing
    IF v_current_locked_in IS DISTINCT FROM p_locked_in THEN
        -- Update the locked_in status
        UPDATE cat_name_options
        SET locked_in = p_locked_in
        WHERE id = p_name_id;
        
        -- Log the change in audit trail
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_name_locked_in TO authenticated;
