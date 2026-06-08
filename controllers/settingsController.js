const db = require('../config/db');

const ensureTableExists = async () => {
    // Create Clinic_Settings table if not exists
    await db.query(`
        CREATE TABLE IF NOT EXISTS Clinic_Settings (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(255) NOT NULL,
            address TEXT NOT NULL,
            primaryThemeColor VARCHAR(50) NOT NULL,
            logo VARCHAR(255),
            autoEmail BOOLEAN DEFAULT TRUE,
            reminderTime VARCHAR(10) DEFAULT '24h'
        )
    `);

    // Check if the default settings row exists, insert if empty
    const [rows] = await db.query('SELECT * FROM Clinic_Settings WHERE id = 1');
    if (rows.length === 0) {
        await db.query(`
            INSERT INTO Clinic_Settings (id, name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime)
            VALUES (1, 'VetCare Pro Animal Hospital', 'info@vetcarepro.com', '+94 11 234 5678', 'No. 45, Temple Road, Colombo 07, Sri Lanka', '#14b8a6', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150', TRUE, '24h')
        `);
    }
};

let tableChecked = false;
const checkTable = async () => {
    if (tableChecked) return;
    try {
        await ensureTableExists();
        tableChecked = true;
    } catch (err) {
        console.error('Failed to initialize Clinic_Settings table:', err);
    }
};

exports.getSettings = async (req, res) => {
    try {
        await checkTable();
        const [rows] = await db.query('SELECT * FROM Clinic_Settings WHERE id = 1');
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        await checkTable();
        const [current] = await db.query('SELECT * FROM Clinic_Settings WHERE id = 1');
        const currentSettings = current[0];

        const name = req.body.name !== undefined ? req.body.name : currentSettings.name;
        const email = req.body.email !== undefined ? req.body.email : currentSettings.email;
        const phone = req.body.phone !== undefined ? req.body.phone : currentSettings.phone;
        const address = req.body.address !== undefined ? req.body.address : currentSettings.address;
        const primaryThemeColor = req.body.primaryThemeColor !== undefined ? req.body.primaryThemeColor : currentSettings.primaryThemeColor;
        const logo = req.body.logo !== undefined ? req.body.logo : currentSettings.logo;
        const autoEmail = req.body.autoEmail !== undefined ? req.body.autoEmail : currentSettings.autoEmail;
        const reminderTime = req.body.reminderTime !== undefined ? req.body.reminderTime : currentSettings.reminderTime;

        await db.query(
            `UPDATE Clinic_Settings 
             SET name = ?, email = ?, phone = ?, address = ?, primaryThemeColor = ?, logo = ?, autoEmail = ?, reminderTime = ? 
             WHERE id = 1`,
            [name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime]
        );

        const [rows] = await db.query('SELECT * FROM Clinic_Settings WHERE id = 1');
        res.status(200).json({ status: 'success', message: 'settings updated successfully', data: rows[0] });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update settings' });
    }
};
