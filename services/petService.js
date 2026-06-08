const db = require('../config/db');
const crypto = require('crypto');

class PetService {
    async getAllPets() {
        const query = `
            SELECT p.*, o.name as ownerName
            FROM Pets p
            JOIN Pet_Owners o ON p.owner_id = o.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async getPetById(id) {
        const query = `
            SELECT p.*, o.name as ownerName
            FROM Pets p
            JOIN Pet_Owners o ON p.owner_id = o.id
            WHERE p.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    async createPet(data) {
        const id = `PET-2026-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const { 
            ownerId, microchip, name, species, breed, gender, 
            neuteredStatus, age, weight, prevHistory, 
            lastVaccination, lastDeworming, photo 
        } = data;
        
        const query = `
            INSERT INTO Pets (
                id, owner_id, microchip_number, name, species, breed, gender, 
                neutered_status, age, weight, previous_medical_history, 
                last_vaccination, last_deworming, photo_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            id, ownerId, microchip || null, name, species, breed || null, 
            gender || 'Male', neuteredStatus === 'Yes' ? true : false, 
            age || null, weight || null, prevHistory || null, 
            lastVaccination || null, lastDeworming || null, photo || null
        ]);
        
        return await this.getPetById(id);
    }

    async updatePet(id, data) {
        const { 
            ownerId, microchip, name, species, breed, gender, 
            neuteredStatus, age, weight, prevHistory, 
            lastVaccination, lastDeworming, photo 
        } = data;
        
        const query = `
            UPDATE Pets SET 
                owner_id = ?, microchip_number = ?, name = ?, species = ?, 
                breed = ?, gender = ?, neutered_status = ?, age = ?, weight = ?, 
                previous_medical_history = ?, last_vaccination = ?, 
                last_deworming = ?, photo_url = ?
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [
            ownerId, microchip || null, name, species, breed || null, 
            gender || 'Male', neuteredStatus === 'Yes' ? true : false, 
            age || null, weight || null, prevHistory || null, 
            lastVaccination || null, lastDeworming || null, photo || null, id
        ]);
        
        if (result.affectedRows === 0) return null;
        return await this.getPetById(id);
    }

    async deletePet(id) {
        const [result] = await db.query('DELETE FROM Pets WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new PetService();
