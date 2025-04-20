const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const checkBlacklist = require('../middleware/checkBlacklist');

// Validation middleware
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Apply blacklist check to all routes
router.use(checkBlacklist);

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register route
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 }).trim().escape()
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, username } = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        const field = existingUser.rows[0].email === email ? 'email' : 'username';
        return res.status(400).json({ message: `User with this ${field} already exists` });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = await pool.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username',
        [email, username, hashedPassword]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.rows[0].id, email, username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser.rows[0].id,
          email: newUser.rows[0].email,
          username: newUser.rows[0].username
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Logout route
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    
    // Get token expiration from JWT
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000); // Convert Unix timestamp to Date

    // Add token to blacklist
    await pool.query(
      'INSERT INTO blacklisted_tokens (token, expires_at) VALUES ($1, $2)',
      [token, expiresAt]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user route
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, username, display_picture FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile route
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { username, password, display_picture } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push(`password_hash = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (display_picture) {
      updates.push(`display_picture = $${paramCount}`);
      values.push(display_picture);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    values.push(req.user.userId);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING id, email, username, display_picture`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 