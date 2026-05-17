-- Allow price = 0 (free items) while still requiring at least one price to be set
-- and preventing negative prices.
ALTER TABLE items DROP CONSTRAINT at_least_one_price;

ALTER TABLE items ADD CONSTRAINT at_least_one_price CHECK (
  price_hourly >= 0 OR price_daily >= 0 OR
  price_weekly >= 0 OR price_monthly >= 0
);
