CREATE OR REPLACE FUNCTION get_active_vendors()
RETURNS TABLE (
  id uuid,
  business_name text,
  contact text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.business_name,
    v.contact
  FROM 
    vendors v
  WHERE 
    v.business_name IS NOT NULL
  ORDER BY 
    v.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;