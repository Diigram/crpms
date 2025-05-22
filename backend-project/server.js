// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'CRPMS'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected!');
});

// ==================== USERS ====================
app.get('/api/users', (req, res) => {
    db.query('SELECT * FROM Users', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/users', (req, res) => {
    const { UserName, Password } = req.body;
    db.query('INSERT INTO Users (UserName, Password) VALUES (?, ?)', [UserName, Password], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'User created', userId: result.insertId });
    });
});

// ==================== SERVICES ====================

// Get all services
app.get('/api/services', (req, res) => {
    db.query('SELECT * FROM Services', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
  
// Add service
app.post('/api/services', (req, res) => {
    const { ServiceCode, ServiceName, ServicePrice } = req.body;
    db.query('INSERT INTO Services (ServiceCode, ServiceName, ServicePrice) VALUES (?, ?, ?)',
        [ServiceCode, ServiceName, ServicePrice],
        (err, result) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'Service added', id: result.insertId });
        }
    );
});
  
// Update service
app.put('/api/services/:code', (req, res) => {
    const { code } = req.params;
    const { ServiceName, ServicePrice } = req.body;
    db.query('UPDATE Services SET ServiceName = ?, ServicePrice = ? WHERE ServiceCode = ?',
        [ServiceName, ServicePrice, code],
        (err, result) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'Service updated' });
        }
    );
});
  
// Delete service
app.delete('/api/services/:code', (req, res) => {
    const { code } = req.params;
    
    // First check if there are any service records
    db.query('SELECT COUNT(*) as count FROM ServiceRecord WHERE ServiceCode = ?', [code], (err, results) => {
        if (err) {
            console.error('Error checking service records:', err);
            return res.status(500).json({ error: 'Failed to check service records' });
        }

        const recordCount = results[0].count;
        console.log(`Found ${recordCount} service records for service code ${code}`);

        // If there are records, delete them
        if (recordCount > 0) {
            db.query('DELETE FROM ServiceRecord WHERE ServiceCode = ?', [code], (err, result) => {
                if (err) {
                    console.error('Error deleting service records:', err);
                    return res.status(500).json({ 
                        error: 'Failed to delete service records',
                        details: err.message 
                    });
                }
                console.log(`Successfully deleted ${result.affectedRows} service records`);
                
                // After deleting records, delete the service
                deleteService(code, res);
            });
        } else {
            // If no records exist, directly delete the service
            deleteService(code, res);
        }
    });
});

// Helper function to delete service
function deleteService(code, res) {
    db.query('DELETE FROM Services WHERE ServiceCode = ?', [code], (err, result) => {
        if (err) {
            console.error('Error deleting service:', err);
            return res.status(500).json({ 
                error: 'Failed to delete service',
                details: err.message 
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    });
}

// ==================== CARS ====================
app.get('/api/cars', (req, res) => {
    db.query('SELECT * FROM Car', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/cars', (req, res) => {
    const { PlateNumber, Type, Model, ManufacturingYear, DriverPhone, MechanicName } = req.body;
    db.query('INSERT INTO Car (PlateNumber, Type, Model, ManufacturingYear, DriverPhone, MechanicName) VALUES (?, ?, ?, ?, ?, ?)',
        [PlateNumber, Type, Model, ManufacturingYear, DriverPhone, MechanicName], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Car added' });
        });
});


// ==================== PAYMENTS ====================

//get payments
app.get('/api/payments', (req, res) => {
    db.query('SELECT * FROM Payment', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

//add payment
app.post('/api/payments', (req, res) => {
    const { AmountPaid, PaymentDate, RecordNumber } = req.body;
    db.query('INSERT INTO Payment (AmountPaid, PaymentDate, RecordNumber) VALUES (?, ?, ?)',
        [AmountPaid, PaymentDate, RecordNumber], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Payment recorded' });
        });
});

// ==================== SERVICE RECORDS ====================

// Get all service records
app.get('/api/records', (req, res) => {
    db.query('SELECT * FROM ServiceRecord', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Add service record
app.post('/api/records', (req, res) => {
    const { ServiceDate, PlateNumber, ServiceCode } = req.body;
    db.query('INSERT INTO ServiceRecord (ServiceDate, PlateNumber, ServiceCode) VALUES (?, ?, ?)',
        [ServiceDate, PlateNumber, ServiceCode], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Record added', recordNumber: result.insertId });
        });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
