CREATE TABLE item_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert item requests"
  ON item_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);
