const db = require('./config/db');

async function patchUsersSchema() {
    try {
        console.log("Adding columns to users table...");
        await db.query(`
            ALTER TABLE users
            ADD COLUMN username VARCHAR(50) UNIQUE NULL,
            ADD COLUMN department VARCHAR(100) NULL
        `);
        console.log("Columns added successfully!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
        } else {
            console.error("Error updating schema:", e);
        }
    } finally {
        process.exit();
    }
}

patchUsersSchema();
