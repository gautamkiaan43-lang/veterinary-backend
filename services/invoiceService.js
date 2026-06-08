const db = require('../config/db');
const crypto = require('crypto');

exports.getAllInvoices = async () => {
    const [rows] = await db.query(`
        SELECT i.*, po.name as ownerName, p.name as petName, u.name as doctorName
        FROM Invoices i
        LEFT JOIN Pet_Owners po ON i.owner_id = po.id
        LEFT JOIN Pets p ON i.pet_id = p.id
        LEFT JOIN Users u ON i.doctor_id = u.id
        ORDER BY i.invoice_date DESC, i.id DESC
    `);
    return rows;
};

exports.getInvoiceById = async (id) => {
    const [invoices] = await db.query(`
        SELECT i.*, po.name as ownerName, p.name as petName, u.name as doctorName
        FROM Invoices i
        LEFT JOIN Pet_Owners po ON i.owner_id = po.id
        LEFT JOIN Pets p ON i.pet_id = p.id
        LEFT JOIN Users u ON i.doctor_id = u.id
        WHERE i.id = ?
    `, [id]);
    
    if (invoices.length === 0) return null;
    
    const invoice = invoices[0];
    const [lineItems] = await db.query(`
        SELECT ili.*, inv.name, inv.category
        FROM Invoice_Line_Items ili
        LEFT JOIN Inventory inv ON ili.inventory_id = inv.id
        WHERE ili.invoice_id = ?
    `, [id]);
    
    invoice.lineItems = lineItems;
    return invoice;
};

exports.getUnbilledRecords = async () => {
    // 1. Clinical Encounters not billed
    const [encounters] = await db.query(`
        SELECT ce.*, p.name as petName, p.breed as petBreed, po.name as ownerName, po.id as ownerId, u.name as doctorName
        FROM Clinical_Encounters ce
        JOIN Pets p ON ce.pet_id = p.id
        JOIN Pet_Owners po ON p.owner_id = po.id
        LEFT JOIN Users u ON ce.doctor_id = u.id
        LEFT JOIN Invoices i ON ce.id = i.encounter_id AND i.status != 'Cancelled'
        WHERE i.id IS NULL
        ORDER BY ce.encounter_date DESC
    `);

    // Populate prescriptions and diagnostic reports
    for (const enc of encounters) {
        const [prescriptions] = await db.query(`
            SELECT p.*, inv.sku, inv.selling_price
            FROM Prescriptions p
            LEFT JOIN Inventory inv ON p.inventory_id = inv.id
            WHERE p.encounter_id = ?
        `, [enc.id]);
        enc.prescriptions = prescriptions;

        const [reports] = await db.query(`
            SELECT * FROM Diagnostic_Reports WHERE encounter_id = ?
        `, [enc.id]);
        enc.reports = reports;
    }

    // 2. Completed Home Visits not billed
    const [homeVisits] = await db.query(`
        SELECT hv.*, p.name as petName, p.breed as petBreed, po.name as ownerName, po.id as ownerId, u.name as doctorName
        FROM Home_Visits hv
        JOIN Pets p ON hv.pet_id = p.id
        JOIN Pet_Owners po ON hv.owner_id = po.id
        LEFT JOIN Users u ON hv.doctor_id = u.id
        LEFT JOIN Invoices i ON hv.id = i.home_visit_id AND i.status != 'Cancelled'
        WHERE hv.visit_status = 'Completed' AND i.id IS NULL
        ORDER BY hv.id DESC
    `);

    return { encounters, homeVisits };
};

exports.createInvoice = async (invoiceData) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Generate sequential human-readable invoice ID: INV-YYYY-XXXX
        const year = new Date().getFullYear();
        const [countRows] = await conn.query(
            `SELECT COUNT(*) as count FROM Invoices WHERE invoice_date >= ?`,
            [`${year}-01-01`]
        );
        const sequence = countRows[0].count + 1;
        const invoiceId = `INV-${year}-${String(sequence).padStart(4, '0')}`;

        const invoiceDate = invoiceData.invoice_date || new Date().toISOString().split('T')[0];
        const status = invoiceData.status || 'Pending';

        // 2. Insert Invoices Row
        await conn.query(
            `INSERT INTO Invoices (
                id, owner_id, pet_id, doctor_id, invoice_date, 
                subtotal, tax_amount, discount_amount, grand_total, status,
                encounter_id, home_visit_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceId,
                invoiceData.owner_id,
                invoiceData.pet_id,
                invoiceData.doctor_id || null,
                invoiceDate,
                invoiceData.subtotal,
                invoiceData.tax_amount || 0.00,
                invoiceData.discount_amount || 0.00,
                invoiceData.grand_total,
                status,
                invoiceData.encounter_id || null,
                invoiceData.home_visit_id || null
            ]
        );

        // 3. Insert Invoice Line Items with pricing snapshots
        if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
            for (const item of invoiceData.lineItems) {
                const itemId = crypto.randomUUID();
                await conn.query(
                    `INSERT INTO Invoice_Line_Items (id, invoice_id, inventory_id, quantity, unit_price, total) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        itemId,
                        invoiceId,
                        item.inventory_id || null,
                        item.quantity,
                        item.unit_price,
                        item.total
                    ]
                );
            }
        }

        // 4. If immediately paid, deduct stock and check thresholds
        if (status === 'Paid') {
            await deductStock(conn, invoiceData.lineItems);
        }

        await conn.commit();
        return { id: invoiceId };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateInvoiceStatus = async (id, newStatus) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get current invoice status
        const [invoices] = await conn.query('SELECT status FROM Invoices WHERE id = ?', [id]);
        if (invoices.length === 0) {
            throw new Error('Invoice not found');
        }

        const currentStatus = invoices[0].status;

        // 2. Enforce immutable transitions: Pending -> Paid / Pending -> Cancelled
        if (currentStatus === 'Paid' || currentStatus === 'Cancelled') {
            throw new Error('Paid or Cancelled invoices cannot be modified');
        }
        if (newStatus !== 'Paid' && newStatus !== 'Cancelled') {
            throw new Error('Invalid invoice status transition');
        }

        // 3. Update Invoice status
        await conn.query('UPDATE Invoices SET status = ? WHERE id = ?', [newStatus, id]);

        // 4. If transition to Paid, deduct stock
        if (newStatus === 'Paid') {
            const [lineItems] = await conn.query('SELECT * FROM Invoice_Line_Items WHERE invoice_id = ?', [id]);
            await deductStock(conn, lineItems);
        }

        await conn.commit();
        return { id, status: newStatus };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// Helper function to deduct inventory levels and trigger notifications
async function deductStock(conn, lineItems) {
    if (!lineItems || lineItems.length === 0) return;

    for (const item of lineItems) {
        if (!item.inventory_id) continue;

        // Retrieve current quantity and low stock threshold
        const [invRows] = await conn.query(
            'SELECT name, quantity, low_stock_threshold FROM Inventory WHERE id = ?', 
            [item.inventory_id]
        );
        if (invRows.length === 0) continue;

        const invItem = invRows[0];
        // Only deduct stock if it has a tracking quantity (e.g. not services/untracked items)
        if (invItem.quantity === null) continue;

        const newQty = invItem.quantity - item.quantity;

        // Update Inventory level
        await conn.query('UPDATE Inventory SET quantity = ? WHERE id = ?', [newQty, item.inventory_id]);

        // Check low-stock threshold alert
        if (newQty <= invItem.low_stock_threshold) {
            const notifId = crypto.randomUUID();
            const title = 'Low Stock Alert';
            const message = `Inventory item "${invItem.name}" has run low. Current: ${newQty}, Threshold: ${invItem.low_stock_threshold}.`;
            
            // Insert notification for Admins
            await conn.query(
                `INSERT INTO Notifications (id, user_id, title, message, type, is_read) 
                 VALUES (?, NULL, ?, ?, 'Inventory', FALSE)`,
                [notifId, title, message]
            );
        }
    }
}
