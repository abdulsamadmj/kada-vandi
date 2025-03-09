-- Drop both versions of the function (with and without parameters)
DROP FUNCTION IF EXISTS get_all_vendors();

CREATE OR REPLACE FUNCTION get_all_vendors()
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
  WITH vendor_status AS (
    -- Get the most recent status for each vendor
    SELECT DISTINCT ON (vl.vendor_id)
      vl.vendor_id,
      vl.is_active
    FROM 
      vendor_locations vl
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
    0 as distance_meters, -- Set to 0 since we don't need distance for this view
    COALESCE(vs.is_active, false) as is_active,
    COALESCE(vr.avg_rating, 0) as avg_rating,
    COALESCE(vr.review_count, 0) as review_count,
    COALESCE(rp.products, '[]'::jsonb) as recent_products
  FROM 
    vendors v
    LEFT JOIN vendor_status vs ON v.id = vs.vendor_id
    LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
    LEFT JOIN recent_products rp ON v.id = rp.vendor_id
  WHERE 
    v.business_name IS NOT NULL
  ORDER BY 
    v.business_name ASC;
END;
$$ LANGUAGE plpgsql; 