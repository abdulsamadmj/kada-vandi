-- Drop both versions of the function (with and without parameters)
DROP FUNCTION IF EXISTS get_active_vendors();
DROP FUNCTION IF EXISTS get_active_vendors(double precision, double precision, integer);

CREATE OR REPLACE FUNCTION get_active_vendors(
  user_lat double precision,
  user_lng double precision,
  max_distance_meters integer default 30000 -- 30km default
)
RETURNS TABLE (
  id uuid,
  business_name text,
  contact text,
  distance_meters integer
) AS $$
BEGIN
  RETURN QUERY
  WITH active_vendors AS (
    -- First get the most recent status for each vendor
    SELECT DISTINCT ON (vl.vendor_id)
      vl.vendor_id,
      vl.location
    FROM 
      vendor_locations vl
    WHERE 
      vl.is_active = true
      AND vl.location IS NOT NULL
    ORDER BY 
      vl.vendor_id,
      vl.updated_at DESC
  )
  SELECT 
    v.id,
    v.business_name,
    v.contact,
    cast(ST_Distance(
      av.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) as integer) as distance_meters
  FROM 
    active_vendors av
    INNER JOIN vendors v ON v.id = av.vendor_id
  WHERE 
    v.business_name IS NOT NULL
    AND ST_DWithin(
      av.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      max_distance_meters
    )
  ORDER BY 
    av.location::geography <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;