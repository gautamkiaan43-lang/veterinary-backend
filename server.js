const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const petOwnerRoutes = require('./routes/petOwnerRoutes');
const petRoutes = require('./routes/petRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const homeVisitRoutes = require('./routes/homeVisitRoutes');
const encounterRoutes = require('./routes/encounterRoutes');
const treatmentNoteRoutes = require('./routes/treatmentNoteRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/owners', petOwnerRoutes);
app.use('/api/v1/pets', petRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/home-visits', homeVisitRoutes);
app.use('/api/v1/encounters', encounterRoutes);
app.use('/api/v1/treatment-notes', treatmentNoteRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Basic Route to check if server is running
app.get('/', (req, res) => {
    res.send('Veterinary Clinic API is running...');
});

// Database Connection Test Route
app.get('/api/health', async (req, res) => {
    try {
        const db = require('./config/db');
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ status: 'Database connected successfully!', data: rows[0] });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ status: 'Database connection failed', error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
