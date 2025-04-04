-- Increase the precision of the amount column to handle larger numbers
ALTER TABLE transactions ALTER COLUMN amount TYPE DECIMAL(20,2); 