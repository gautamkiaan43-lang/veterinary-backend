const db = require('../config/db');
const crypto = require('crypto');

class AppointmentService {
    async getAllAppointments(filters = {}) {
        let query = `
            SELECT a.*, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, p.name as petName, u.name as doctorName, o.id as ownerId, o.name as ownerName
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            LEFT JOIN pet_owners o ON p.owner_id = o.id
            LEFT JOIN users u ON a.doctor_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.ownerId) {
            query += ` AND o.id = ?`;
            params.push(filters.ownerId);
        }
        if (filters.petId) {
            query += ` AND a.pet_id = ?`;
            params.push(filters.petId);
        }
        if (filters.doctorId) {
            query += ` AND a.doctor_id = ?`;
            params.push(filters.doctorId);
        }
        
        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
        
        const [rows] = await db.query(query, params);
        return rows;
    }

    async getAppointmentById(id) {
        const query = `
            SELECT a.*, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, p.name as petName, u.name as doctorName, o.id as ownerId, o.name as ownerName
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            LEFT JOIN pet_owners o ON p.owner_id = o.id
            LEFT JOIN users u ON a.doctor_id = u.id
            WHERE a.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    async createAppointment(data) {
        const id = `APT-2026-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const { petId, doctorId, appointmentDate, appointmentTime, appointmentType, notes } = data;
        
        // Double booking prevention
        if (doctorId) {
            const conflictQuery = `
                SELECT id FROM appointments 
                WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'
            `;
            const [conflicts] = await db.query(conflictQuery, [doctorId, appointmentDate, appointmentTime]);
            if (conflicts.length > 0) {
                throw new Error("Double booking detected: Doctor is already booked at this date and time.");
            }
        }
        
        const query = `
            INSERT INTO appointments (
                id, pet_id, doctor_id, appointment_date, appointment_time, 
                appointment_type, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
        `;
        
        await db.query(query, [
            id, petId, doctorId || null, appointmentDate, appointmentTime, 
            appointmentType, notes || null
        ]);
        
        return await this.getAppointmentById(id);
    }

    async updateAppointment(id, data) {
        const { petId, doctorId, appointmentDate, appointmentTime, appointmentType, status, notes } = data;
        
        if (doctorId && appointmentDate && appointmentTime) {
            const conflictQuery = `
                SELECT id FROM appointments 
                WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND id != ? AND status != 'Cancelled'
            `;
            const [conflicts] = await db.query(conflictQuery, [doctorId, appointmentDate, appointmentTime, id]);
            if (conflicts.length > 0) {
                throw new Error("Double booking detected: Doctor is already booked at this date and time.");
            }
        }

        const query = `
            UPDATE appointments SET 
                pet_id = COALESCE(?, pet_id), 
                doctor_id = COALESCE(?, doctor_id), 
                appointment_date = COALESCE(?, appointment_date), 
                appointment_time = COALESCE(?, appointment_time), 
                appointment_type = COALESCE(?, appointment_type), 
                status = COALESCE(?, status), 
                notes = COALESCE(?, notes)
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [
            petId, doctorId, appointmentDate, appointmentTime, appointmentType, status, notes, id
        ]);
        
        if (result.affectedRows === 0) return null;
        return await this.getAppointmentById(id);
    }

    async deleteAppointment(id) {
        // Soft delete implementation: change status to Cancelled instead of deleting
        const query = `UPDATE appointments SET status = 'Cancelled' WHERE id = ?`;
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }

    async getUpcomingReminders() {
        const query = `
            SELECT a.id, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, a.appointment_time, a.status, a.notes, a.reminder_sent,
                   p.name as petName, p.breed as petBreed,
                   o.name as ownerName, o.email as ownerEmail, o.mobile as ownerMobile, o.id as ownerId,
                   u.name as doctorName
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN pet_owners o ON p.owner_id = o.id
            LEFT JOIN users u ON a.doctor_id = u.id
            WHERE a.appointment_date >= CURRENT_DATE() AND a.status IN ('Pending', 'Upcoming')
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async sendReminder(appointmentId, customMessageBody, customRecipientEmail) {
        // Retrieve full appointment details
        const query = `
            SELECT a.*, p.name as petName, o.name as ownerName, o.email as ownerEmail, o.id as ownerId
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN pet_owners o ON p.owner_id = o.id
            WHERE a.id = ?
        `;
        const [rows] = await db.query(query, [appointmentId]);
        if (rows.length === 0) {
            throw new Error('Appointment not found.');
        }

        const apt = rows[0];
        const emailToUse = (customRecipientEmail && customRecipientEmail.trim() !== '') ? customRecipientEmail.trim() : apt.ownerEmail;

        if (!emailToUse || emailToUse.trim() === '') {
            throw new Error('No recipient email address specified.');
        }

        // If the email is edited/updated, update the Pet_Owners table with the new email
        if (customRecipientEmail && customRecipientEmail.trim() !== '' && customRecipientEmail.trim() !== apt.ownerEmail) {
            await db.query(`UPDATE pet_owners SET email = ? WHERE id = ?`, [customRecipientEmail.trim(), apt.ownerId]);
        }

        const emailService = require('./emailService');
        await emailService.sendEmail({
            to: emailToUse,
            subject: `Appointment Reminder: ${apt.petName} at VetCare Pro`,
            text: customMessageBody
        });

        // Log to Email_Reminders
        const reminderId = 'rem-' + crypto.randomUUID().slice(0, 8);
        await db.query(
            `INSERT INTO email_reminders (id, appointment_id, recipient_email, scheduled_at, sent_at, status) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Sent')`,
            [reminderId, appointmentId, emailToUse]
        );

        // Update Appointment reminder status
        await db.query(
            `UPDATE appointments SET reminder_sent = TRUE WHERE id = ?`,
            [appointmentId]
        );

        return { success: true };
    }
}

module.exports = new AppointmentService();
