const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

// Function to get exchange rate
async function getExchangeRate(fromCurrency, toCurrency = 'IDR') {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/8e7aa834d1575590527837d4/pair/${fromCurrency}/${toCurrency}`);
    return response.data.conversion_rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

// Get all transactions for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.date DESC`,
      [req.user.userId]
    );

    // Convert all amounts to IDR
    const transactions = await Promise.all(
      result.rows.map(async (transaction) => {
        try {
          const rate = await getExchangeRate(transaction.currency);
          return {
            ...transaction,
            original_amount: transaction.amount,
            original_currency: transaction.currency,
            amount_idr: transaction.amount * rate,
            exchange_rate: rate
          };
        } catch (error) {
          return transaction;
        }
      })
    );

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { description, amount, type, categoryId, date, currency = 'IDR' } = req.body;
    
    // Get exchange rate for storing IDR equivalent
    const rate = currency === 'IDR' ? 1 : await getExchangeRate(currency);
    
    const result = await pool.query(
      `INSERT INTO transactions (description, amount, type, category_id, date, user_id, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [description, amount, type, categoryId, date, req.user.userId, currency]
    );

    // Fetch category details for the response
    if (result.rows[0].category_id) {
      const categoryResult = await pool.query(
        'SELECT name, color FROM categories WHERE id = $1',
        [result.rows[0].category_id]
      );
      if (categoryResult.rows.length > 0) {
        result.rows[0].category_name = categoryResult.rows[0].name;
        result.rows[0].category_color = categoryResult.rows[0].color;
      }
    }

    // Add conversion information to response
    const transaction = result.rows[0];
    transaction.original_amount = transaction.amount;
    transaction.original_currency = currency;
    transaction.amount_idr = currency === 'IDR' ? transaction.amount : transaction.amount * rate;
    transaction.exchange_rate = rate;

    res.json(transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { period } = req.query;
    let dateFilter = '';
    
    switch(period) {
      case 'week':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'1 month\'';
        break;
      case 'year':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = '';
    }

    // Get category-wise expenses with currency conversion
    const categoryStats = await pool.query(
      `SELECT c.name, c.color, t.type, t.currency,
              COUNT(*) as count,
              SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 ${dateFilter}
       GROUP BY c.name, c.color, t.type, t.currency
       ORDER BY total DESC`,
      [req.user.userId]
    );

    // Convert totals to IDR
    const categoriesWithConversion = await Promise.all(
      categoryStats.rows.map(async (stat) => {
        try {
          const rate = await getExchangeRate(stat.currency);
          return {
            ...stat,
            total_idr: stat.total * rate,
            exchange_rate: rate
          };
        } catch (error) {
          return stat;
        }
      })
    );

    // Get daily totals with currency conversion
    const dailyTotals = await pool.query(
      `SELECT date::date, currency,
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE user_id = $1 ${dateFilter}
       GROUP BY date::date, currency
       ORDER BY date::date`,
      [req.user.userId]
    );

    // Convert daily totals to IDR
    const dailyWithConversion = await Promise.all(
      dailyTotals.rows.map(async (day) => {
        try {
          const rate = await getExchangeRate(day.currency);
          return {
            ...day,
            income_idr: day.income * rate,
            expense_idr: day.expense * rate,
            exchange_rate: rate
          };
        } catch (error) {
          return day;
        }
      })
    );

    res.json({
      categories: categoriesWithConversion,
      daily: dailyWithConversion
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // First check if the transaction exists and belongs to the user
    const checkResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' })
    }

    // Delete the transaction
    await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    )

    res.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router; 