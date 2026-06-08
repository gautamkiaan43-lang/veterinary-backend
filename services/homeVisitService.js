const db = require('../config/db');
const crypto = require('crypto');

class HomeVisitService {
    async getAllHomeVisits(filters = {}) {
        let query = `
            SELECT hv.*, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, a.appointment_time, 
                   p.name as petName, u.name as doctorName, 
                   o.id as ownerId, o.name as ownerName, o.mobile as ownerMobile
            FROM Home_Visits hv
            JOIN Appointments a ON hv.appointment_id = a.id
            JOIN Pets p ON hv.pet_id = p.id
            JOIN Pet_Owners o ON hv.owner_id = o.id
            LEFT JOIN Users u ON hv.doctor_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.ownerId) {
            query += ` AND hv.owner_id = ?`;
            params.push(filters.ownerId);
        }
        if (filters.petId) {
            query += ` AND hv.pet_id = ?`;
            params.push(filters.petId);
        }
        if (filters.doctorId) {
            query += ` AND hv.doctor_id = ?`;
            params.push(filters.doctorId);
        }
        if (filters.status) {
            query += ` AND hv.visit_status = ?`;
            params.push(filters.status);
        }
        
        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
        
        const [rows] = await db.query(query, params);
        return rows;
    }

    async getHomeVisitById(id) {
        const query = `
            SELECT hv.*, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, a.appointment_time, 
                   p.name as petName, u.name as doctorName, 
                   o.id as ownerId, o.name as ownerName, o.mobile as ownerMobile
            FROM Home_Visits hv
            JOIN Appointments a ON hv.appointment_id = a.id
            JOIN Pets p ON hv.pet_id = p.id
            JOIN Pet_Owners o ON hv.owner_id = o.id
            LEFT JOIN Users u ON hv.doctor_id = u.id
            WHERE hv.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    async createHomeVisit(data) {
        const { petId, ownerId, doctorId, appointmentDate, appointmentTime, address, travelFee, notes } = data;
        
        // Travel Fee Validation
        const parsedFee = parseFloat(travelFee);
        if (isNaN(parsedFee) || parsedFee < 0) {
            throw new Error("Travel fee must be a numeric value greater than or equal to 0.");
        }

        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 1. Double booking prevention
            if (doctorId) {
                const conflictQuery = `
                    SELECT id FROM Appointments 
                    WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'
                `;
                const [conflicts] = await connection.query(conflictQuery, [doctorId, appointmentDate, appointmentTime]);
                if (conflicts.length > 0) {
                    throw new Error("Double booking detected: Doctor is already booked at this date and time.");
                }
            }

            // 2. Create Appointment
            const appointmentId = `APT-2026-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            const aptQuery = `
                INSERT INTO Appointments (
                    id, pet_id, doctor_id, appointment_date, appointment_time, 
                    appointment_type, status, notes
                ) VALUES (?, ?, ?, ?, ?, 'Home Visit', 'Pending', ?)
            `;
            await connection.query(aptQuery, [
                appointmentId, petId, doctorId || null, appointmentDate, appointmentTime, notes || null
            ]);

            // 3. Create Home Visit
            const visitId = `HV-2026-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            const hvQuery = `
                INSERT INTO Home_Visits (
                    id, appointment_id, pet_id, owner_id, doctor_id, 
                    address, travel_fee, visit_status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
            `;
            await connection.query(hvQuery, [
                visitId, appointmentId, petId, ownerId, doctorId || null,
                address, parsedFee, notes || null
            ]);

            await connection.commit();
            return await this.getHomeVisitById(visitId);
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async updateHomeVisit(id, data) {
        const { doctorId, address, travelFee, visitStatus, notes, appointmentDate, appointmentTime } = data;
        
        // Retrieve current visit to apply business rules
        const currentVisit = await this.getHomeVisitById(id);
        if (!currentVisit) {
            throw new Error("Home Visit not found");
        }

        if (currentVisit.visit_status === 'Completed') {
            throw new Error("Completed visits cannot be edited or have their status changed.");
        }
        if (currentVisit.visit_status === 'Cancelled') {
             throw new Error("Cancelled visits cannot be edited.");
        }

        // Status transition rules
        if (visitStatus && visitStatus !== currentVisit.visit_status) {
            const validTransitions = {
                'Scheduled': ['In Progress', 'Cancelled'],
                'In Progress': ['Completed', 'Cancelled'],
                'Completed': [],
                'Cancelled': []
            };
            
            if (!validTransitions[currentVisit.visit_status].includes(visitStatus)) {
                throw new Error(`Invalid status transition from ${currentVisit.visit_status} to ${visitStatus}`);
            }
        }

        // Doctor reassignment rules
        if (doctorId !== undefined && doctorId !== currentVisit.doctor_id) {
            if (currentVisit.visit_status !== 'Scheduled') {
                 throw new Error("Doctor reassignment is only allowed when status is 'Scheduled'.");
            }
        }

        const parsedFee = travelFee !== undefined ? parseFloat(travelFee) : parseFloat(currentVisit.travel_fee);
        if (isNaN(parsedFee) || parsedFee < 0) {
            throw new Error("Travel fee must be a numeric value greater than or equal to 0.");
        }

        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Double booking prevention for updates
            const targetDoctorId = doctorId !== undefined ? doctorId : currentVisit.doctor_id;
            const targetDate = appointmentDate !== undefined ? appointmentDate : currentVisit.appointment_date;
            const targetTime = appointmentTime !== undefined ? appointmentTime : currentVisit.appointment_time;

            if (targetDoctorId && targetDate && targetTime && (targetDoctorId !== currentVisit.doctor_id || targetDate !== currentVisit.appointment_date || targetTime !== currentVisit.appointment_time)) {
                const conflictQuery = `
                    SELECT id FROM Appointments 
                    WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND id != ? AND status != 'Cancelled'
                `;
                const [conflicts] = await connection.query(conflictQuery, [targetDoctorId, targetDate, targetTime, currentVisit.appointment_id]);
                if (conflicts.length > 0) {
                    throw new Error("Double booking detected: Doctor is already booked at this date and time.");
                }
            }

            // Update Appointment first (Date/Time/Doctor)
            const aptQuery = `
                UPDATE Appointments SET 
                    doctor_id = COALESCE(?, doctor_id), 
                    appointment_date = COALESCE(?, appointment_date), 
                    appointment_time = COALESCE(?, appointment_time)
                WHERE id = ?
            `;
            await connection.query(aptQuery, [doctorId, appointmentDate, appointmentTime, currentVisit.appointment_id]);

            // Update Home Visit
            const hvQuery = `
                UPDATE Home_Visits SET 
                    doctor_id = COALESCE(?, doctor_id), 
                    address = COALESCE(?, address), 
                    travel_fee = ?, 
                    visit_status = COALESCE(?, visit_status), 
                    notes = COALESCE(?, notes)
                WHERE id = ?
            `;
            await connection.query(hvQuery, [doctorId, address, parsedFee, visitStatus, notes, id]);

            // Synchronize status with appointment if necessary
            if (visitStatus === 'Cancelled') {
                 await connection.query(`UPDATE Appointments SET status = 'Cancelled' WHERE id = ?`, [currentVisit.appointment_id]);
            } else if (visitStatus === 'Completed') {
                 await connection.query(`UPDATE Appointments SET status = 'Completed' WHERE id = ?`, [currentVisit.appointment_id]);
            } else if (visitStatus === 'In Progress') {
                 await connection.query(`UPDATE Appointments SET status = 'Confirmed' WHERE id = ?`, [currentVisit.appointment_id]);
            }

            await connection.commit();
            return await this.getHomeVisitById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deleteHomeVisit(id) {
        // No physical deletes. Change status to Cancelled.
        const currentVisit = await this.getHomeVisitById(id);
        if (!currentVisit) return false;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const queryHV = `UPDATE Home_Visits SET visit_status = 'Cancelled' WHERE id = ?`;
            await connection.query(queryHV, [id]);

            const queryApt = `UPDATE Appointments SET status = 'Cancelled' WHERE id = ?`;
            await connection.query(queryApt, [currentVisit.appointment_id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new HomeVisitService();
