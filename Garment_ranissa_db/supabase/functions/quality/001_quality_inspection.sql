/*
===============================================================================
001_quality_inspection.sql

Purpose
-------
Quality Inspection Engine

Responsibilities

- Create Inspection
- Generate Inspection Checklist
- Record Inspection Result
- Calculate Inspection Result
- Raise Defects
- Generate CAPA
- Complete Inspection

===============================================================================
*/

-- ============================================================================
-- Create Quality Inspection
-- ============================================================================

CREATE OR REPLACE FUNCTION create_quality_inspection(

    p_company_id UUID,
    p_inspection_type_id UUID,
    p_reference_document_type TEXT,
    p_reference_document_id UUID,
    p_business_partner_id UUID,
    p_warehouse_id UUID,
    p_production_order_id UUID,
    p_inspector_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_inspection_id UUID;

    v_inspection_number TEXT;

BEGIN

    /*
        Replace with your
        generate_document_number()
        function.
    */

   /* v_inspection_number :=
        'QI-' || TO_CHAR(NOW(),'YYYYMMDDHH24MISS');
*/
      v_inspection_number :=
      generate_document_number(
         p_company_id,
        'QUALITY_INSPECTION'
      );
    INSERT INTO quality_inspection(

        company_id,
        inspection_number,
        inspection_type_id,
        inspection_date,
        reference_document_type,
        reference_document_id,
        business_partner_id,
        warehouse_id,
        production_order_id,
        inspector_id,
        created_by

    )

    VALUES(

        p_company_id,
        v_inspection_number,
        p_inspection_type_id,
        CURRENT_DATE,
        p_reference_document_type,
        p_reference_document_id,
        p_business_partner_id,
        p_warehouse_id,
        p_production_order_id,
        p_inspector_id,
        p_user_id

    )

    RETURNING id
    INTO v_inspection_id;

    RETURN v_inspection_id;

END;

$$;

-- ============================================================================
-- Generate Inspection Checklist
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_quality_checklist(

    p_quality_inspection_id UUID,
    p_quality_template_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO quality_inspection_line(

        quality_inspection_id,

        inspection_parameter,

        specification

    )

    SELECT

        p_quality_inspection_id,

        parameter_name,

        specification

    FROM quality_template_parameter

    WHERE quality_template_id =
        p_quality_template_id

    ORDER BY sequence_no;

END;

$$;

-- ============================================================================
-- Record Inspection Result
-- ============================================================================

CREATE OR REPLACE FUNCTION record_quality_result(

    p_inspection_line_id UUID,
    p_observed_value TEXT,
    p_result TEXT,
    p_remarks TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE quality_inspection_line

    SET

        observed_value = p_observed_value,

        result = p_result,

        remarks = p_remarks

    WHERE id = p_inspection_line_id;

END;

$$;

-- ============================================================================
-- Calculate Overall Result
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_quality_result(

    p_quality_inspection_id UUID

)

RETURNS TEXT

LANGUAGE plpgsql

AS
$$

DECLARE

    v_failed INTEGER;

BEGIN

    SELECT COUNT(*)

    INTO v_failed

    FROM quality_inspection_line

    WHERE quality_inspection_id =
        p_quality_inspection_id

    AND result = 'FAIL';

    IF v_failed > 0 THEN

        UPDATE quality_inspection

        SET overall_result = 'FAIL'

        WHERE id = p_quality_inspection_id;

        RETURN 'FAIL';

    ELSE

        UPDATE quality_inspection

        SET overall_result = 'PASS'

        WHERE id = p_quality_inspection_id;

        RETURN 'PASS';

    END IF;

END;

$$;

-- ============================================================================
-- Raise Defects
-- ============================================================================

CREATE OR REPLACE FUNCTION create_quality_defects(

    p_quality_inspection_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future

        Create entries in

        quality_inspection_defect

        from failed inspection lines.

    */

END;

$$;

-- ============================================================================
-- Generate CAPA
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_capa(

    p_quality_inspection_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future

        Generate corrective_action

        for Major / Critical defects.

    */

END;

$$;

-- ============================================================================
-- Complete Inspection
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_quality_inspection(

    p_quality_inspection_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM calculate_quality_result(

        p_quality_inspection_id

    );

    PERFORM create_quality_defects(

        p_quality_inspection_id

    );

    PERFORM generate_capa(

        p_quality_inspection_id

    );

    UPDATE quality_inspection

    SET

        status='COMPLETED',

        updated_by=p_user_id,

        updated_at=NOW()

    WHERE id=p_quality_inspection_id;

END;

$$;
