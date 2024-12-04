//test for git

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

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
        description TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        limit_amount REAL NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

    console.log('Tables created successfully (or already exist).');
});

// ==================
// CRUD Operations
// ==================

// ---- CATEGORIES ----

// Get all categories
app.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.all(sql,[], (err, rows) => {
        if (err) {
            console.error("Error fetching categories:", err.message);
            return res.status(500).json({ error: 'Failed to retrieve categories.' });
        } 
        res.json({categories: rows});
        
    });
});

// Add a new category
app.post('/categories', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to add category.' });
        } else {
            res.status(201).json({ id: this.lastID, name });
        }
    });
});

// ---- EXPENSES ----

// Get all expenses (with category names)
app.get('/expenses', (req, res) => {
    const sql = `
        SELECT e.id, e.amount, e.date, e.description, c.name as category_name
        FROM expenses e
        JOIN categories c ON e.category_id = c.id`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching budgets:", err.message);
            res.status(500).json({ error: 'Failed to retrieve expenses.' });
        } else {
            res.json({ expenses: rows });
        }
    });
});

// Add a new expense
app.post('/expenses', (req, res) => {
    const { amount, date, category_id, description } = req.body;
    if (!amount || !date || !category_id) {
        return res.status(400).json({ error: 'Amount, date, and category ID are required.' });
    }
    const sql = 'INSERT INTO expenses (amount, date, category_id, description) VALUES (?, ?, ?, ?)';
    db.run(sql, [amount, date, category_id, description], function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to add expense.' });
        } else {
            res.status(201).json({ id: this.lastID, amount, date, category_id, description });
        }
    });
});

// Update an expense
app.put('/expenses/:id', (req, res) => {
    const { id } = req.params;
    const { amount, date, category_id, description } = req.body;
    

    const sql = `
        UPDATE expenses
        SET amount = ?, date = ?, category_id = ?, description = ?
        WHERE id = ?`;

    db.run(sql, [amount, date, category_id, description, id], function(err) {
        if (err) {
            return res.status(500).json({ error: "Failed to update expenses" });
        }
        res.json({ message: 'Expense updated successfully', id });
    });
});


// Delete an expense
app.delete('/expenses/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM expenses WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to delete expense.' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Expense not found.' });
        } else {
            res.json({ message: 'Expense deleted successfully.' });
        }
    });
});

// ---- BUDGETS ----


// Get all budgets

app.get('/budgets', (req, res) => {
    const sql = `
        SELECT 
        b.id, 
        b.category_id, 
        b.limit_amount, 
        c.name As category_name,
        IFNULL(SUM(e.amount), 0) AS total_spent  -- Calculate total spent for each category

    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN expenses e ON b.category_id = e.category_id
    GROUP BY b.id, b.category_id, b.limit_amount, c.name`;

    

    db.all(sql, [], (err, budgets) => {
        if (err) {
            console.error("Error fetching budgets: ", err.message); // Log error message
            return res.status(500).json({ error: 'Failed to retrieve budgets.' });
        }
        rows.forEach(budget => {
            budget.status = budget.total_spent > budget.limit_amount ? 'Over Budget' : 'Within Budget';
        })

        
        res.json({ budgets: rows });
    });
});


// Set or Update a Budget
app.post('/budgets', (req, res) => {
    const { category_id, limit_amount } = req.body;
    const sql= `INSERT INTO budgets (category_id, limit_amount)
    values(?, ?)
    ON CONFLICT(category_id) DO UPDATE SET limit_amount = excluded.limit_amount`;
    

    db.run(sql, [category_id, limit_amount], function(err) {
        if (err) {
            console.error("Error setting budgets:", err.message);
            return res.status(500).json({ error: "Failed to set or update the budget."});
        }
        res.json({ message: "Budget set or updated successfully.",category_id,limit_amount });
    });
});


// delete a budget

app.delete('/budgets/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM budgets WHERE id = ?';
    db.run(sql, [id], function (err) {
}

// ==================
// Start the Server
// ==================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
