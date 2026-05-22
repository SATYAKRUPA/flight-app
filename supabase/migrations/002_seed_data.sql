-- ========================
-- SEED FLIGHTS (8 flights, 4 routes)
-- ========================
INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price) VALUES
('AI-101', 'Delhi', 'Mumbai', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', 'Boeing 737', 'scheduled', 3500),
('AI-102', 'Mumbai', 'Delhi', NOW() + INTERVAL '2 days 4 hours', NOW() + INTERVAL '2 days 6 hours', 'Boeing 737', 'scheduled', 3500),
('AI-201', 'Bangalore', 'Hyderabad', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 1 hour', 'Airbus A320', 'scheduled', 2500),
('AI-202', 'Hyderabad', 'Bangalore', NOW() + INTERVAL '3 days 3 hours', NOW() + INTERVAL '3 days 4 hours', 'Airbus A320', 'scheduled', 2500),
('AI-301', 'Chennai', 'Kolkata', NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 3 hours', 'Boeing 737', 'scheduled', 4500),
('AI-302', 'Kolkata', 'Chennai', NOW() + INTERVAL '4 days 5 hours', NOW() + INTERVAL '4 days 8 hours', 'Boeing 737', 'scheduled', 4500),
('AI-401', 'Delhi', 'Bangalore', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours', 'Airbus A380', 'scheduled', 5500),
('AI-402', 'Bangalore', 'Delhi', NOW() + INTERVAL '5 days 6 hours', NOW() + INTERVAL '5 days 9 hours', 'Airbus A380', 'scheduled', 5500);

-- ========================
-- SEED SEATS (for each flight)
-- ========================
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN SELECT id FROM flights LOOP
    -- First Class (rows 1-2, seats A-D)
    INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
    SELECT f.id, row_num || seat_col, 'first', TRUE, 5000
    FROM generate_series(1,2) AS row_num,
         unnest(ARRAY['A','B','C','D']) AS seat_col;

    -- Business Class (rows 3-7, seats A-F)
    INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
    SELECT f.id, row_num || seat_col, 'business', TRUE, 2000
    FROM generate_series(3,7) AS row_num,
         unnest(ARRAY['A','B','C','D','E','F']) AS seat_col;

    -- Economy Class (rows 8-30, seats A-F)
    INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
    SELECT f.id, row_num || seat_col, 'economy', TRUE, 0
    FROM generate_series(8,30) AS row_num,
         unnest(ARRAY['A','B','C','D','E','F']) AS seat_col;
  END LOOP;
END $$;