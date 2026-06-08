const db = require('../config/db');
const crypto = require('crypto');

class InventoryService {
    async getAllItems() {
        const [rows] = await db.query('SELECT * FROM inventory ORDER BY created_at DESC');
        return rows;
    }

    async getItemById(id) {
        const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
        return rows[0];
    }

    async createItem(data) {
        const id = crypto.randomUUID();
        const { sku, name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date } = data;
        
        const query = `
            INSERT INTO inventory (id, sku, name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            id, sku, name, category, supplier, 
            quantity || 0, low_stock_threshold || 5, 
            cost_price || null, selling_price, 
            is_taxable !== undefined ? is_taxable : true, 
            expiry_date || null
        ]);
        
        return await this.getItemById(id);
    }

    async updateItem(id, data) {
        const { name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date } = data;
        
        const query = `
            UPDATE inventory 
            SET name = ?, category = ?, supplier = ?, quantity = ?, low_stock_threshold = ?, cost_price = ?, selling_price = ?, is_taxable = ?, expiry_date = ?
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date, id]);
        if (result.affectedRows === 0) return null;
        
        return await this.getItemById(id);
    }

    async deleteItem(id) {
        const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new InventoryService();
