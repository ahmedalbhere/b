const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.sqlite');

// إنشاء الجداول في قاعدة البيانات
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT UNIQUE,
            name TEXT,
            price REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            total REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// API للتعامل مع المنتجات
app.get('/api/products/:barcode', (req, res) => {
    db.get('SELECT * FROM products WHERE barcode = ?', [req.params.barcode], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || null);
    });
});

app.post('/api/products', (req, res) => {
    const { barcode, name, price } = req.body;
    db.run('INSERT INTO products (barcode, name, price) VALUES (?, ?, ?)', 
        [barcode, name, price], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        }
    );
});

// API للتعامل مع الفواتير
app.post('/api/invoices', (req, res) => {
    const { items, total } = req.body;
    
    db.serialize(() => {
        db.run('INSERT INTO invoices (total) VALUES (?)', [total], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const invoiceId = this.lastID;
            const stmt = db.prepare('INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
            
            items.forEach(item => {
                stmt.run([invoiceId, item.product_id, item.quantity, item.price]);
            });
            
            stmt.finalize();
            res.json({ invoiceId });
        });
    });
});

// API للحصول على التقارير
app.get('/api/reports/sales', (req, res) => {
    db.all(`
        SELECT 
            date(invoices.date) as date,
            SUM(invoices.total) as total_sales,
            COUNT(*) as transactions
        FROM invoices
        GROUP BY date(invoices.date)
        ORDER BY date(invoices.date) DESC
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
