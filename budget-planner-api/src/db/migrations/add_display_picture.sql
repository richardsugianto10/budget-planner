-- Add display_picture column to users table
ALTER TABLE users
ADD COLUMN display_picture TEXT;

-- Update the updated_at trigger to include this new column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql'; 