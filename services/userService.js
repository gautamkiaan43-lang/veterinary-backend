const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class UserService {
    async getAllUsers(filters = {}) {
        let query = 'SELECT id, name, role, email, phone, username, department, status, profile_image, created_at FROM Users';
        let params = [];
        
        let conditions = [];
        if (filters.role && filters.role !== 'All') {
            conditions.push('role = ?');
            params.push(filters.role);
        }
        if (filters.status && filters.status !== 'All') {
            conditions.push('status = ?');
            params.push(filters.status);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY name ASC';
        
        const [users] = await db.query(query, params);
        return users;
    }

    async getUserById(id) {
        const [users] = await db.query('SELECT id, name, role, email, phone, username, department, status, profile_image, created_at FROM Users WHERE id = ?', [id]);
        return users.length > 0 ? users[0] : null;
    }

    async createUser(userData) {
        const { fullName, email, phone, username, password, role, department, status, photoUrl } = userData;
        
        const id = 'usr-' + crypto.randomUUID().slice(0, 8);
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const finalStatus = status || 'Active';
        
        const query = `
            INSERT INTO Users (id, name, email, password_hash, role, phone, username, department, profile_image, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [id, fullName, email, password_hash, role, phone, username, department, photoUrl || null, finalStatus]);
        return this.getUserById(id);
    }

    async updateUser(id, userData) {
        const { fullName, email, phone, username, password, role, department, status, photoUrl } = userData;
        
        let query = 'UPDATE Users SET name=?, email=?, role=?, phone=?, username=?, department=?, status=?, profile_image=?';
        let params = [fullName, email, role, phone, username, department, photoUrl || null, status];
        
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash=?';
            params.push(password_hash);
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) return null;
        
        return this.getUserById(id);
    }

    async updateProfile(id, profileData) {
        const { fullName, email, phone, password } = profileData;
        
        let query = 'UPDATE Users SET name=?, email=?, phone=?';
        let params = [fullName, email, phone];
        
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash=?';
            params.push(password_hash);
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) return null;
        
        return this.getUserById(id);
    }

    async deleteUser(id) {
        // Hard delete implementation
        const [result] = await db.query("DELETE FROM Users WHERE id = ?", [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new UserService();
