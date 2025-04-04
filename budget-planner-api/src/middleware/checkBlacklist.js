const pool = require('../config/db');

const checkBlacklist = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM blacklisted_tokens WHERE token = $1)',
      [token]
    );

    if (result.rows[0].exists) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }

    next();
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = checkBlacklist; 