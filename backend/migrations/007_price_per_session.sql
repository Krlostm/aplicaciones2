ALTER TABLE publications ALTER COLUMN price_unit SET DEFAULT 'session';
UPDATE publications SET price_unit='session' WHERE price_cents IS NULL;
