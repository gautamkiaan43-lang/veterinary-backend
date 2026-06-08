const db = require('../config/db');
const crypto = require('crypto');

class AttendanceService {
    async getDailyAttendance(date) {
        // Get all active users and left join their attendance for the date
        const [rows] = await db.query(`
            SELECT 
                u.id, u.name, u.role,
                a.check_in, a.check_out, a.working_hours, a.status,
                (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.id AND DATE(appointment_date) = ?) as aptCount,
                (SELECT COUNT(*) FROM invoices WHERE doctor_id = u.id AND invoice_date = ?) as invoiceCount,
                (SELECT COUNT(*) FROM Clinical_Encounters WHERE doctor_id = u.id AND encounter_date = ?) as encounterCount,
                (SELECT COUNT(*) FROM home_visits hv JOIN appointments apt ON hv.appointment_id = apt.id WHERE hv.doctor_id = u.id AND DATE(apt.appointment_date) = ?) as hvCount
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date = ?
            WHERE u.status = 'Active' OR u.status = 'On Leave'
            ORDER BY u.name ASC
        `, [date, date, date, date, date]);
        
        return rows.map(r => {
            // Compute activity text based on role
            let activity = '';
            if (r.role === 'Doctor') {
                activity = `${r.encounterCount} Consults, ${r.hvCount} Home Visits`;
            } else if (r.role === 'Receptionist') {
                activity = `${r.aptCount} Appts, ${r.invoiceCount} Bills`;
            } else if (r.role === 'Vet Assistant') {
                activity = `${r.encounterCount} Assisted, ${r.hvCount} HV`;
            } else {
                activity = 'System Oversight';
            }
            
            return {
                id: r.id,
                name: r.name,
                role: r.role,
                checkIn: r.check_in || '--',
                checkOut: r.check_out || '--',
                status: r.status || 'Absent',
                hours: r.working_hours ? parseFloat(r.working_hours).toFixed(1) : '0.0',
                activity
            };
        });
    }

    async getPersonalHistory(userId) {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(attendance_date, '%Y-%m-%d') as date, check_in as checkIn, check_out as checkOut, working_hours as hours, status
            FROM attendance
            WHERE user_id = ?
            ORDER BY attendance_date DESC
            LIMIT 30
        `, [userId]);
        
        return rows.map(r => ({
            ...r,
            checkIn: r.checkIn || '--',
            checkOut: r.checkOut || '--',
            hours: r.hours ? parseFloat(r.hours).toFixed(1) : '0.0',
        }));
    }

    async checkIn(userId, date, time) {
        // Check if already checked in
        const [existing] = await db.query('SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?', [userId, date]);
        if (existing.length > 0) throw new Error('Already checked in today');
        
        const id = 'att-' + crypto.randomUUID().slice(0, 8);
        await db.query(`
            INSERT INTO attendance (id, user_id, attendance_date, check_in, status)
            VALUES (?, ?, ?, ?, 'Present')
        `, [id, userId, date, time]);
        
        return { success: true };
    }

    async checkOut(userId, date, time) {
        const [existing] = await db.query('SELECT id, check_in FROM attendance WHERE user_id = ? AND attendance_date = ?', [userId, date]);
        if (existing.length === 0) throw new Error('No check-in found for today');
        if (!existing[0].check_in) throw new Error('No check-in time recorded');
        
        // Calculate hours
        const [checkInHours, checkInMins] = existing[0].check_in.split(':').map(Number);
        const [checkOutHours, checkOutMins] = time.split(':').map(Number);
        
        let diffHours = checkOutHours - checkInHours;
        let diffMins = checkOutMins - checkInMins;
        if (diffMins < 0) {
            diffHours -= 1;
            diffMins += 60;
        }
        let totalHours = diffHours + (diffMins / 60);
        if (totalHours < 0) totalHours = 0;

        await db.query(`
            UPDATE attendance 
            SET check_out = ?, working_hours = ?
            WHERE id = ?
        `, [time, totalHours, existing[0].id]);
        
        return { success: true, workingHours: totalHours.toFixed(2) };
    }
}

module.exports = new AttendanceService();
