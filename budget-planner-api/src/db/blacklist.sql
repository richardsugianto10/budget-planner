-- Create blacklisted_tokens table
CREATE TABLE blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create index for faster token lookups
CREATE INDEX idx_blacklisted_tokens_token ON blacklisted_tokens(token);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM blacklisted_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (runs every day)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 0 * * *', $$SELECT cleanup_expired_tokens()$$); 