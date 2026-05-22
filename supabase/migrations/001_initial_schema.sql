-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- FLIGHTS TABLE
-- ========================
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_no TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departs_at TIMESTAMPTZ NOT NULL,
  arrives_at TIMESTAMPTZ NOT NULL,
  aircraft_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delayed', 'cancelled', 'completed')),
  base_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- SEATS TABLE
-- ========================
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('economy', 'business', 'first')),
  is_available BOOLEAN DEFAULT TRUE,
  extra_fee NUMERIC(10,2) DEFAULT 0,
  UNIQUE(flight_id, seat_number)
);

-- ========================
-- BOOKINGS TABLE
-- ========================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES flights(id),
  seat_id UUID NOT NULL REFERENCES seats(id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'rescheduled', 'cancelled')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  total_price NUMERIC(10,2) NOT NULL,
  pnr_code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8))
);

-- ========================
-- PASSENGERS TABLE
-- ========================
CREATE TABLE passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  passport_no TEXT NOT NULL,
  nationality TEXT NOT NULL,
  dob DATE NOT NULL
);

-- ========================
-- RESCHEDULES TABLE
-- ========================
CREATE TABLE reschedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES flights(id),
  new_flight_id UUID NOT NULL REFERENCES flights(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fee_charged NUMERIC(10,2) DEFAULT 0
);

-- ========================
-- RLS ENABLE
-- ========================
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- ========================
-- RLS POLICIES
-- ========================

-- Flights: everyone can view
CREATE POLICY "flights_read" ON flights FOR SELECT USING (true);

-- Seats: everyone can view
CREATE POLICY "seats_read" ON seats FOR SELECT USING (true);

-- Bookings: users can only see their own
CREATE POLICY "bookings_read" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Passengers: users can only see their own booking passengers
CREATE POLICY "passengers_read" ON passengers FOR SELECT
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "passengers_insert" ON passengers FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

-- Reschedules: users can only see their own
CREATE POLICY "reschedules_read" ON reschedules FOR SELECT
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));
CREATE POLICY "reschedules_insert" ON reschedules FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

-- ========================
-- SEAT LOCK RPC (prevent double booking)
-- ========================
CREATE OR REPLACE FUNCTION reserve_seat(p_seat_id UUID, p_flight_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  SELECT is_available INTO v_available
  FROM seats
  WHERE id = p_seat_id AND flight_id = p_flight_id
  FOR UPDATE;

  IF v_available THEN
    UPDATE seats SET is_available = FALSE WHERE id = p_seat_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- CANCEL BOOKING RPC (atomic)
-- ========================
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
  v_seat_id UUID;
  v_user_id UUID;
BEGIN
  -- Get booking details
  SELECT b.seat_id, b.user_id, f.departs_at
  INTO v_seat_id, v_user_id, v_departs_at
  FROM bookings b
  JOIN flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id;

  -- Check user owns this booking
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2 hour rule check
  IF v_departs_at - NOW() < INTERVAL '2 hours' THEN
    RAISE EXCEPTION 'Cannot cancel within 2 hours of departure';
  END IF;

  -- Cancel booking and free seat atomically
  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE seats SET is_available = TRUE WHERE id = v_seat_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- 2 HOUR CANCELLATION TRIGGER
-- ========================
CREATE OR REPLACE FUNCTION check_cancellation_time()
RETURNS TRIGGER AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT f.departs_at INTO v_departs_at
    FROM flights f
    WHERE f.id = NEW.flight_id;

    IF v_departs_at - NOW() < INTERVAL '2 hours' THEN
      RAISE EXCEPTION 'Cancellation not allowed within 2 hours of departure';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_cancellation_window
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_cancellation_time();