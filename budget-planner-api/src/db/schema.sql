-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense'))
);

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, color, type) VALUES
    ('Salary', '#48BB78', 'income'),
    ('Freelance', '#4299E1', 'income'),
    ('Investments', '#9F7AEA', 'income'),
    ('Other Income', '#ED8936', 'income'),
    ('Housing', '#F56565', 'expense'),
    ('Transportation', '#ED8936', 'expense'),
    ('Food', '#48BB78', 'expense'),
    ('Utilities', '#4299E1', 'expense'),
    ('Healthcare', '#9F7AEA', 'expense'),
    ('Entertainment', '#ECC94B', 'expense'),
    ('Shopping', '#ED64A6', 'expense'),
    ('Education', '#667EEA', 'expense'),
    ('Other Expenses', '#718096', 'expense')
ON CONFLICT (id) DO NOTHING; 