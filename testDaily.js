const db = require('./config/db');
async function test() {
    const date = new Date().toISOString().split('T')[0];
    console.log("Using date:", date);
    const [rows] = await db.query(`
        SELECT 
            u.id, u.name, u.role,
            a.check_in, a.check_out, a.working_hours, a.status
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date = ?
        WHERE u.status = 'Active' OR u.status = 'On Leave'
        ORDER BY u.name ASC
    `, [date]);
    console.table(rows);
    process.exit();
}
test();
