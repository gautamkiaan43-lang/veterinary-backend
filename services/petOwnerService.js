const db = require('../config/db');
const crypto = require('crypto');

class PetOwnerService {
    async getAllOwners() {
        const query = `
            SELECT po.*, COUNT(p.id) as petsCount
            FROM pet_owners po
            LEFT JOIN pets p ON po.id = p.owner_id
            GROUP BY po.id
            ORDER BY po.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async getOwnerById(id) {
        const query = `
            SELECT po.*, COUNT(p.id) as petsCount
            FROM pet_owners po
            LEFT JOIN pets p ON po.id = p.owner_id
            WHERE po.id = ?
            GROUP BY po.id
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    async createOwner(data) {
        const id = `own-${crypto.randomUUID()}`;
        const { name, nic, email, telephone, mobile, address } = data;
        
        const query = `
            INSERT INTO pet_owners (id, name, nic, email, telephone, mobile, address) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [id, name, nic, email || null, telephone || null, mobile, address || null]);
        return await this.getOwnerById(id);
    }

    async updateOwner(id, data) {
        const { name, nic, email, telephone, mobile, address } = data;
        const query = `
            UPDATE pet_owners 
            SET name = ?, nic = ?, email = ?, telephone = ?, mobile = ?, address = ?
            WHERE id = ?
        `;
        const [result] = await db.query(query, [name, nic, email || null, telephone || null, mobile, address || null, id]);
        if (result.affectedRows === 0) return null;
        return await this.getOwnerById(id);
    }

    async deleteOwner(id) {
        const [result] = await db.query('DELETE FROM pet_owners WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new PetOwnerService();
