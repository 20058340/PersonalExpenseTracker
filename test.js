const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

beforeEach(() => {
    db.run("DELETE FROM categories");
    db.run("DELETE FROM expenses");
    db.run("DELETE FROM budgets");
});

// Set up the Express app
const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.json());
app.use(cors());

// Initialize tables for tests
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
});

// Categories Routes
app.get('/categories', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) {
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
            return res.status(500).json({ error: 'Failed to add category.' });
        }
        res.status(201).json({ id: this.lastID, name });
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
            return res.status(500).json({ error: 'Failed to retrieve expenses.' });
        }
        res.json({ expenses: rows });
    });
});

app.post('/expenses', (req, res) => {
    const { amount, date, category_id, description } = req.body;
    if (!amount || !date || !category_id) {
        return res.status(400).json({ error: 'Amount, date, and category ID are required.' });
    }
    const sql = 'INSERT INTO expenses (amount, date, category_id, description) VALUES (?, ?, ?, ?)';
    db.run(sql, [amount, date, category_id, description || ''], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add expense.' });
        }
        res.status(201).json({ id: this.lastID, amount, date, category_id, description });
    });
});

// Budgets Routes
app.get('/budgets', (req, res) => {
    const sql = `
        SELECT b.id, b.category_id, b.limit_amount, c.name as category_name
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
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
    const sql = 'INSERT INTO budgets (category_id, limit_amount) VALUES (?, ?)';
    db.run(sql, [category_id, limit_amount], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add budget.' });
        }
        res.status(201).json({ category_id, limit_amount });
    });
});

// Test the Express app
describe('Expense Tracker API Tests', () => {

    // Test POST /categories
    test('POST /categories - success', async () => {
        const response = await request(app)
            .post('/categories')
            .send({ name: 'Food' });
        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Food');
    });

    // Test GET /categories
    test('GET /categories - success', async () => {
        await db.run("INSERT INTO categories (name) VALUES ('Food')");
        const response = await request(app).get('/categories');
        expect(response.status).toBe(200);
        expect(response.body.categories).toHaveLength(1);
    });

    // Test POST /expenses
    test('POST /expenses - success', async () => {
        const category = await new Promise((resolve, reject) => {
            db.run("INSERT INTO categories (name) VALUES ('Food')", function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
        const response = await request(app)
            .post('/expenses')
            .send({ amount: 20, date: '2024-12-12', category_id: category, description: 'Groceries' });
        expect(response.status).toBe(201);
        expect(response.body.amount).toBe(20);
        expect(response.body.description).toBe('Groceries');
    });

    // Test GET /expenses
    test('GET /expenses - success', async () => {
        await db.run("INSERT INTO categories (name) VALUES ('Food')");
        const category = await new Promise((resolve, reject) => {
            db.run("INSERT INTO categories (name) VALUES ('Food')", function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
        await db.run("INSERT INTO expenses (amount, date, category_id, description) VALUES (50, '2024-12-12', ?, 'Lunch')", category);
        const response = await request(app).get('/expenses');
        expect(response.status).toBe(200);
        expect(response.body.expenses).toHaveLength(1);
    });

    // Test POST /budgets
    test('POST /budgets - success', async () => {
        const category = await new Promise((resolve, reject) => {
            db.run("INSERT INTO categories (name) VALUES ('Food')", function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
        const response = await request(app)
            .post('/budgets')
            .send({ category_id: category, limit_amount: 100 });
        expect(response.status).toBe(201);
        expect(response.body.limit_amount).toBe(100);
    });

    // Test GET /budgets
    test('GET /budgets - success', async () => {
        const category = await new Promise((resolve, reject) => {
            db.run("INSERT INTO categories (name) VALUES ('Food')", function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
        await db.run("INSERT INTO budgets (category_id, limit_amount) VALUES (?, 100)", category);
        const response = await request(app).get('/budgets');
        expect(response.status).toBe(200);
        expect(response.body.budgets).toHaveLength(1);
    });
});
