const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
//const cors = require('cors');

const app = express();
const PORT = 4000;

app.use((req, res, next) => { 
    const allowedOrigins = ['http://127.0.0.1:5500', 'https://20058340.github.io']; 
    const origin = req.headers.origin; 
    if (allowedOrigins.includes(origin)) { 
        res.header('Access-Control-Allow-Origin', origin); 
    } 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); 
    next(); });

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database('./expense_tracker.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const corsOptions = {
    origin: 'http://127.0.0.1:5500',  // Allow only this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Initialize tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        category_id INTEGER,
        description TEXT DEFAULT '',
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER UNIQUE,
        limit_amount REAL NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

    console.log('Tables created successfully (or already exist).');
});

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Personal Expense Tracker API!');
});

// Categories Routes
app.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve categories.' });
        }
        res.json({ categories: rows });
    });
});

app.post('/categories', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }

    const sql = 'INSERT INTO categories (name) VALUES (?)';
    db.run(sql, [name], function (err) {
        if (err) {
            console.error('Error adding category:', err.message);
            return res.status(500).json({ error: 'Failed to add category.' });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});

app.delete('/categories/:id', (req, res) => {
    const categoryId = req.params.id;
    db.run('DELETE FROM categories WHERE id = ?', [categoryId], function (err) {
        if (err) {
            console.error('Error deleting category:', err.message);
            return res.status(500).json({ error: 'Failed to delete category.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        res.status(200).send('Category deleted successfully.');
    });
});

// Expenses Routes
app.get('/expenses', (req, res) => {
    const sql = `
        SELECT e.id, e.amount, e.date, e.description, c.name as category_name
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching expenses:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve expenses.' });
        }
        res.json({ expenses: rows });
    });
});

// Get a single expense by ID
app.get('/expenses/:id', (req, res) => {
    const expenseId = req.params.id;
    const sql = `
        SELECT e.id, e.amount, e.date, e.description, c.name as category_name
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
    `;
    db.get(sql, [expenseId], (err, row) => {
        if (err) {
            console.error('Error fetching expense:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve expense.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Expense not found.' });
        }
        res.json(row);
    });
});

// Add a new expense
app.post('/expenses', (req, res) => {
    const { amount, date, category_id, description } = req.body;

    if (!amount || !date || !category_id) {
        return res.status(400).json({ error: 'Amount, date, and category ID are required.' });
    }

    const sql = 'INSERT INTO expenses (amount, date, category_id, description) VALUES (?, ?, ?, ?)';
    db.run(sql, [amount, date, category_id, description || ''], function (err) {
        if (err) {
            console.error('Error adding expense:', err.message);
            return res.status(500).json({ error: 'Failed to add expense.' });
        }
        res.status(201).json({ id: this.lastID, amount, date, category_id, description });
    });
});

// Update an expense by ID
app.put('/expenses/:id', (req, res) => {
    const expenseId = req.params.id;
    const { amount, date, category_id, description } = req.body;

    if (!amount || !date || !category_id) {
        return res.status(400).json({ error: 'Amount, date, and category ID are required.' });
    }

    const sql = `
        UPDATE expenses
        SET amount = ?, date = ?, category_id = ?, description = ?
        WHERE id = ?
    `;
    db.run(sql, [amount, date, category_id, description || '', expenseId], function (err) {
        if (err) {
            console.error('Error updating expense:', err.message);
            return res.status(500).json({ error: 'Failed to update expense.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Expense not found.' });
        }
        res.json({ message: 'Expense updated successfully.' });
    });
});

// Delete an expense by ID
app.delete('/expenses/:id', (req, res) => {
    const expenseId = req.params.id;

    db.run('DELETE FROM expenses WHERE id = ?', [expenseId], function (err) {
        if (err) {
            console.error('Error deleting expense:', err.message);
            return res.status(500).json({ error: 'Failed to delete expense.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Expense not found.' });
        }
        res.status(200).json({ message: 'Expense deleted successfully.' });
    });
});

// Budgets Routes
app.get('/budgets', (req, res) => {
    const sql = `
        SELECT 
            b.id, 
            b.category_id, 
            b.limit_amount, 
            c.name as category_name,
            IFNULL(SUM(e.amount), 0) AS total_spent,
            CASE 
                WHEN IFNULL(SUM(e.amount), 0) > b.limit_amount THEN 'Over Budget'
                ELSE 'Under Budget'
            END AS status
        FROM budgets b
        LEFT JOIN expenses e ON b.category_id = e.category_id
        LEFT JOIN categories c ON b.category_id = c.id
        GROUP BY b.category_id
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching budgets:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve budgets.' });
        }
        res.json({ budgets: rows });
    });
});

app.post('/budgets', (req, res) => {
    const { category_id, limit_amount } = req.body;

    if (!category_id || !limit_amount) {
        return res.status(400).json({ error: 'Category ID and limit amount are required.' });
    }

    const sql = `
        INSERT INTO budgets (category_id, limit_amount) 
        VALUES (?, ?)
        ON CONFLICT(category_id) 
        DO UPDATE SET limit_amount = excluded.limit_amount
    `;

    db.run(sql, [category_id, limit_amount], function (err) {
        if (err) {
            console.error('Error adding/updating budget:', err.message);
            return res.status(500).json({ error: 'Failed to set or update budget.' });
        }
        res.status(201).json({ category_id, limit_amount });
    });
});

// DELETE budget
app.delete('/budgets/:id', (req, res) => {
    const budgetId = parseInt(req.params.id);
    const sql = 'DELETE FROM budgets WHERE id = ?';
    db.run(sql, [budgetId], function (err) {
        if (err) {
            console.error('Error deleting budget:', err.message);
            return res.status(500).json({ error: 'Failed to delete budget.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Budget not found.' });
        }
        res.status(200).send('Budget deleted successfully.');
    });
});

// PUT (update) budget
app.put('/budgets/:id', (req, res) => {
    const budgetId = parseInt(req.params.id);
    const { limit_amount } = req.body;

    if (!limit_amount) {
        return res.status(400).json({ error: 'Limit amount is required.' });
    }

    const sql = 'UPDATE budgets SET limit_amount = ? WHERE id = ?';
    db.run(sql, [limit_amount, budgetId], function (err) {
        if (err) {
            console.error('Error updating budget:', err.message);
            return res.status(500).json({ error: 'Failed to update budget.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Budget not found.' });
        }
        res.status(200).json({ message: 'Budget updated successfully.' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
