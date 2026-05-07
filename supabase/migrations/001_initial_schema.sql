-- ============================================================
-- Rental Marketplace MVP - Initial Schema
-- ============================================================

-- ENUMS
CREATE TYPE item_status AS ENUM ('draft', 'available', 'paused', 'deleted', 'rented_out');
CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'good', 'fair');
CREATE TYPE booking_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'active',
  'completed',
  'cancelled'
);
CREATE TYPE duration_unit AS ENUM ('hourly', 'daily', 'weekly', 'monthly');
CREATE TYPE reviewer_role AS ENUM ('borrower', 'lender');
CREATE TYPE notification_type AS ENUM (
  'booking_request',
  'booking_accepted',
  'booking_rejected',
  'booking_cancelled',
  'rental_starting',
  'rental_completed',
  'review_received',
  'payment_reminder'
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  locality      TEXT NOT NULL DEFAULT 'Diamond District',
  upi_id        TEXT,                        -- for manual payment instructions
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  avg_rating    NUMERIC(3,2),
  total_reviews INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  condition     item_condition NOT NULL DEFAULT 'good',
  images        TEXT[] NOT NULL DEFAULT '{}',
  inventory     INT NOT NULL DEFAULT 1 CHECK (inventory >= 0),
  price_hourly  NUMERIC(10,2),
  price_daily   NUMERIC(10,2),
  price_weekly  NUMERIC(10,2),
  price_monthly NUMERIC(10,2),
  locality      TEXT NOT NULL DEFAULT 'Diamond District',
  address_hint  TEXT,
  status        item_status NOT NULL DEFAULT 'available',
  avg_rating    NUMERIC(3,2),
  total_reviews INT NOT NULL DEFAULT 0,
  view_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT at_least_one_price CHECK (
    price_hourly IS NOT NULL OR price_daily IS NOT NULL OR
    price_weekly IS NOT NULL OR price_monthly IS NOT NULL
  )
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  borrower_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  lender_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  duration_unit     duration_unit NOT NULL,
  duration_count    INT NOT NULL CHECK (duration_count > 0),
  start_datetime    TIMESTAMPTZ NOT NULL,
  end_datetime      TIMESTAMPTZ NOT NULL,
  price_per_unit    NUMERIC(10,2) NOT NULL,
  total_price       NUMERIC(10,2) NOT NULL,
  status            booking_status NOT NULL DEFAULT 'pending',
  lender_note       TEXT,
  borrower_note     TEXT,
  payment_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_booking CHECK (borrower_id <> lender_id),
  CONSTRAINT end_after_start CHECK (end_datetime > start_datetime)
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES items(id) ON DELETE SET NULL,
  role        reviewer_role NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES items(id) ON DELETE SET NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_items_browse ON items(locality, category, status, created_at DESC)
  WHERE status IN ('available', 'rented_out');
CREATE INDEX idx_items_owner ON items(owner_id, status);
CREATE INDEX idx_items_inventory ON items(id, inventory, status);

CREATE INDEX idx_bookings_borrower ON bookings(borrower_id, status, created_at DESC);
CREATE INDEX idx_bookings_lender ON bookings(lender_id, status, created_at DESC);
CREATE INDEX idx_bookings_item ON bookings(item_id, status, start_datetime);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id, created_at DESC);
CREATE INDEX idx_reviews_item ON reviews(item_id, created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (id = auth.uid());

-- items
CREATE POLICY "items_select_public"  ON items FOR SELECT
  USING (status IN ('available', 'paused', 'rented_out') OR owner_id = auth.uid());
CREATE POLICY "items_insert_own"     ON items FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "items_update_own"     ON items FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "items_delete_own"     ON items FOR DELETE USING (owner_id = auth.uid());

-- bookings
CREATE POLICY "bookings_select_parties"   ON bookings FOR SELECT
  USING (borrower_id = auth.uid() OR lender_id = auth.uid());
CREATE POLICY "bookings_insert_borrower"  ON bookings FOR INSERT
  WITH CHECK (borrower_id = auth.uid());
CREATE POLICY "bookings_update_parties"   ON bookings FOR UPDATE
  USING (borrower_id = auth.uid() OR lender_id = auth.uid());

-- reviews
CREATE POLICY "reviews_select_all"  ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"  ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- notifications
CREATE POLICY "notifications_own"   ON notifications FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Decrement inventory when booking is accepted; auto-set status to rented_out when 0
CREATE OR REPLACE FUNCTION handle_booking_accepted() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE items
    SET
      inventory = GREATEST(inventory - 1, 0),
      status = CASE WHEN inventory - 1 <= 0 THEN 'rented_out' ELSE status END
    WHERE id = NEW.item_id;

    -- Auto-reject overlapping pending bookings for the same item
    UPDATE bookings
    SET
      status      = 'rejected',
      lender_note = 'Item already booked for this period',
      updated_at  = now()
    WHERE item_id = NEW.item_id
      AND id <> NEW.id
      AND status = 'pending'
      AND start_datetime < NEW.end_datetime
      AND end_datetime   > NEW.start_datetime;
  END IF;

  -- Restore inventory when booking ends (completed or rejected after being active)
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status IN ('accepted', 'active') THEN
    UPDATE items
    SET
      inventory = inventory + 1,
      status    = CASE WHEN status = 'rented_out' THEN 'available' ELSE status END
    WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_booking_inventory
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_booking_accepted();

-- Denormalized item rating
CREATE OR REPLACE FUNCTION update_item_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE items SET
    avg_rating    = (SELECT AVG(rating) FROM reviews WHERE item_id = NEW.item_id),
    total_reviews = (SELECT COUNT(*)    FROM reviews WHERE item_id = NEW.item_id)
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_item_rating
  AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_item_rating();

-- Denormalized profile rating
CREATE OR REPLACE FUNCTION update_profile_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating    = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*)    FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_profile_rating
  AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
