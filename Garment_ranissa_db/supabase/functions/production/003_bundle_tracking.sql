/*
===============================================================================
003_bundle_tracking.sql

Purpose:
    Bundle Tracking Functions

Tracks bundle movement through production operations.

Workflow

Bundle Created
        ↓
Operation Started
        ↓
Operation Completed
        ↓
Transferred to Next Operation
        ↓
Finished Goods

===============================================================================
*/

-- ============================================================================
-- Create Bundle
-- ============================================================================

CREATE OR REPLACE FUNCTION create_bundle(

    p_company_id UUID,
    p_production_order_id UUID,
    p_bundle_number TEXT,
    p_item_id UUID,
    p_operation_id UUID,
    p_quantity NUMERIC,
    p_created_by UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_bundle_id UUID;

BEGIN

    INSERT INTO production_bundle(

        company_id,
        production_order_id,
        bundle_number,
        item_id,
        current_operation_id,
        quantity,
        status,
        created_by

    )

    VALUES(

        p_company_id,
        p_production_order_id,
        p_bundle_number,
        p_item_id,
        p_operation_id,
        p_quantity,
        'CREATED',
        p_created_by

    )

    RETURNING id
    INTO v_bundle_id;

    RETURN v_bundle_id;

END;

$$;

-- ============================================================================
-- Start Bundle Operation
-- ============================================================================

CREATE OR REPLACE FUNCTION start_bundle_operation(

    p_bundle_id UUID,
    p_operation_id UUID,
    p_operator_id UUID,
    p_machine_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO production_bundle_history(

        bundle_id,
        operation_id,
        operator_id,
        machine_id,
        started_at,
        status

    )

    VALUES(

        p_bundle_id,
        p_operation_id,
        p_operator_id,
        p_machine_id,
        NOW(),
        'IN_PROGRESS'

    );

END;

$$;

-- ============================================================================
-- Complete Bundle Operation
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_bundle_operation(

    p_bundle_history_id UUID,
    p_good_quantity NUMERIC,
    p_reject_quantity NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle_history

    SET

        completed_at = NOW(),

        good_quantity = p_good_quantity,

        reject_quantity = p_reject_quantity,

        status = 'COMPLETED'

    WHERE id = p_bundle_history_id;

END;

$$;

-- ============================================================================
-- Transfer Bundle
-- ============================================================================

CREATE OR REPLACE FUNCTION transfer_bundle(

    p_bundle_id UUID,
    p_next_operation_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        current_operation_id = p_next_operation_id,

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Complete Bundle
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_bundle(

    p_bundle_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        status = 'COMPLETED',

        completed_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Current Bundle Status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bundle_status(

    p_bundle_id UUID

)

RETURNS TEXT

LANGUAGE plpgsql

AS
$$

DECLARE

    v_status TEXT;

BEGIN

    SELECT status

    INTO v_status

    FROM production_bundle

    WHERE id = p_bundle_id;

    RETURN v_status;

END;

$$;

-- ============================================================================
-- Current Operation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bundle_current_operation(

    p_bundle_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_operation UUID;

BEGIN

    SELECT current_operation_id

    INTO v_operation

    FROM production_bundle

    WHERE id = p_bundle_id;

    RETURN v_operation;

END;

$$;

-- ============================================================================
-- Bundle Progress (%)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bundle_progress(

    p_bundle_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_completed NUMERIC;

    v_total NUMERIC;

BEGIN

    SELECT COUNT(*)
    INTO v_completed
    FROM production_bundle_history
    WHERE bundle_id = p_bundle_id
      AND status = 'COMPLETED';

    SELECT COUNT(*)
    INTO v_total
    FROM bill_of_material_operation bo
    JOIN production_bundle pb
      ON pb.item_id = bo.item_id
    WHERE pb.id = p_bundle_id;

    IF COALESCE(v_total,0) = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((v_completed / v_total) * 100,2);

END;

$$;
