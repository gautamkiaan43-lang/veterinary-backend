const db = require('../config/db');

class ReportService {
    async getRevenueAnalytics(startDate, endDate) {
        // Daily revenue trend (defaults to last 30 days)
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // 1. Line chart monthly revenue trend
        const [monthlyRows] = await db.query(`
            SELECT 
                DATE_FORMAT(invoice_date, '%b') as month,
                DATE_FORMAT(invoice_date, '%Y-%m') as sortKey,
                SUM(grand_total) as revenue
            FROM Invoices
            WHERE status = 'Paid'
            GROUP BY DATE_FORMAT(invoice_date, '%b'), DATE_FORMAT(invoice_date, '%Y-%m')
            ORDER BY sortKey ASC
            LIMIT 12
        `);

        // If no records, return a minimal fallback structure
        const revenueTrend = monthlyRows.length > 0 ? monthlyRows.map(r => ({
            month: r.month,
            revenue: parseFloat(r.revenue) || 0
        })) : [
            { month: 'Current', revenue: 0 }
        ];

        // 2. Summary KPI calculation
        const [kpiRows] = await db.query(`
            SELECT 
                COALESCE(SUM(grand_total), 0) as grossYield,
                COALESCE(SUM(grand_total) / NULLIF(COUNT(id), 0), 0) as averageTicket,
                COUNT(id) as totalInvoices
            FROM Invoices
            WHERE status = 'Paid'
        `);

        const [activePatientsRows] = await db.query(`
            SELECT COUNT(*) as count FROM Pets
        `);

        return {
            revenueTrend,
            grossYield: parseFloat(kpiRows[0].grossYield),
            averageTicket: parseFloat(kpiRows[0].averageTicket),
            totalInvoices: kpiRows[0].totalInvoices,
            activePatients: activePatientsRows[0].count
        };
    }

    async getAppointmentAnalytics() {
        // Aggregate completed vs upcoming vs cancelled by weekday (Mon to Sun)
        const [rows] = await db.query(`
            SELECT 
                WEEKDAY(appointment_date) as weekdayIdx,
                CASE WEEKDAY(appointment_date)
                    WHEN 0 THEN 'Mon'
                    WHEN 1 THEN 'Tue'
                    WHEN 2 THEN 'Wed'
                    WHEN 3 THEN 'Thu'
                    WHEN 4 THEN 'Fri'
                    WHEN 5 THEN 'Sat'
                    WHEN 6 THEN 'Sun'
                END as dayName,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status IN ('Upcoming', 'Confirmed', 'Pending') THEN 1 ELSE 0 END) as upcoming,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM Appointments
            GROUP BY WEEKDAY(appointment_date)
            ORDER BY weekdayIdx ASC
        `);

        // Guarantee all weekdays exist to avoid layout desyncs
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekdayMap = {};
        weekdays.forEach(day => {
            weekdayMap[day] = { day, completed: 0, upcoming: 0, cancelled: 0 };
        });

        rows.forEach(r => {
            if (r.dayName && weekdayMap[r.dayName]) {
                weekdayMap[r.dayName].completed = parseInt(r.completed) || 0;
                weekdayMap[r.dayName].upcoming = parseInt(r.upcoming) || 0;
                weekdayMap[r.dayName].cancelled = parseInt(r.cancelled) || 0;
            }
        });

        // Slice Sunday if needed, but returning Mon-Sat is standard for veterinary hours
        return weekdays.map(day => weekdayMap[day]).slice(0, 6);
    }

    async getPatientDemographics() {
        const [totalRows] = await db.query('SELECT COUNT(*) as total FROM Pets');
        const total = totalRows[0].total || 1;

        const [rows] = await db.query(`
            SELECT species, COUNT(*) as count 
            FROM Pets 
            GROUP BY species 
            ORDER BY count DESC
        `);

        const colors = {
            'Dog': '#3b82f6',
            'Cat': '#14b8a6',
            'Bird': '#f59e0b',
            'Other': '#6366f1'
        };

        let mapped = rows.map(r => {
            const name = r.species ? r.species.charAt(0).toUpperCase() + r.species.slice(1) : 'Other';
            const value = Math.round((r.count / total) * 100);
            const color = colors[name] || '#6366f1';
            return { name, value, color };
        });

        if (mapped.length === 0) {
            mapped = [{ name: 'No Pets', value: 100, color: '#cbd5e1' }];
        }

        return mapped;
    }

    async getDoctorAudit() {
        const [rows] = await db.query(`
            SELECT 
                u.name,
                COALESCE((SELECT COUNT(DISTINCT pet_id) FROM Clinical_Encounters WHERE doctor_id = u.id), 0) as patients,
                COALESCE((SELECT COUNT(*) FROM Clinical_Encounters WHERE doctor_id = u.id), 0) as consultations,
                COALESCE((SELECT COUNT(*) FROM Home_Visits WHERE doctor_id = u.id AND visit_status = 'Completed'), 0) as home_visits,
                COALESCE((SELECT SUM(grand_total) FROM Invoices WHERE doctor_id = u.id AND status = 'Paid'), 0) as revenue,
                COALESCE((SELECT SUM(working_hours) FROM Attendance WHERE user_id = u.id AND status = 'Present'), 0) as hours
            FROM Users u
            WHERE u.role = 'Doctor' AND u.status = 'Active'
            ORDER BY consultations DESC, home_visits DESC
        `);

        return rows.map(r => ({
            name: r.name,
            patients: parseInt(r.patients) || 0,
            consultations: parseInt(r.consultations) || 0,
            home_visits: parseInt(r.home_visits) || 0,
            revenue: parseFloat(r.revenue) || 0,
            hours: parseFloat(r.hours) ? parseFloat(r.hours).toFixed(0) : '0',
            rating: 4.8 // Default static rating since it is not database tracked
        }));
    }

    async getInventoryResourceAlerts() {
        const [rows] = await db.query(`
            SELECT 
                id as sku,
                name,
                category,
                quantity as qty,
                selling_price as price,
                DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry,
                CASE 
                    WHEN quantity <= 0 THEN 'Out of Stock'
                    ELSE 'Low Stock'
                END as status
            FROM Inventory
            WHERE quantity <= low_stock_threshold OR expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            ORDER BY quantity ASC
        `);
        return rows;
    }
}

module.exports = new ReportService();
