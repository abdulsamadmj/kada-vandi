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
  distance_meters integer,
  is_active boolean,
  avg_rating numeric,
  review_count bigint,
  recent_products jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH active_vendors AS (
    -- First get the most recent status for each vendor
    SELECT DISTINCT ON (vl.vendor_id)
      vl.vendor_id,
      vl.location,
      vl.is_active
    FROM 
      vendor_locations vl
    WHERE 
      vl.location IS NOT NULL
    ORDER BY 
      vl.vendor_id,
      vl.updated_at DESC
  ),
  vendor_ratings AS (
    -- Calculate average rating and review count
    SELECT 
      vendor_id,
      COALESCE(AVG(rating), 0) as avg_rating,
      COUNT(*) as review_count
    FROM reviews
    GROUP BY vendor_id
  ),
  recent_products AS (
    -- Get latest 3 products for each vendor
    SELECT 
      vendor_id,
      jsonb_agg(
        jsonb_build_object(
          'name', name,
          'price', price
        )
      ) as products
    FROM (
      SELECT 
        vendor_id,
        name,
        price,
        row_number() OVER (PARTITION BY vendor_id) as rn
      FROM products
      WHERE inventory_count > 0
    ) p
    WHERE rn <= 3
    GROUP BY vendor_id
  )
  SELECT 
    v.id,
    v.business_name,
    v.contact,
    cast(ST_Distance(
      av.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) as integer) as distance_meters,
    av.is_active,
    COALESCE(vr.avg_rating, 0) as avg_rating,
    COALESCE(vr.review_count, 0) as review_count,
    COALESCE(rp.products, '[]'::jsonb) as recent_products
  FROM 
    active_vendors av
    INNER JOIN vendors v ON v.id = av.vendor_id
    LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
    LEFT JOIN recent_products rp ON v.id = rp.vendor_id
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