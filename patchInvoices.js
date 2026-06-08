const db = require('./config/db');

async function patchInvoices() {
    try {
        console.log("Adding columns to Invoices table...");
        await db.query(`
            ALTER TABLE Invoices
            ADD COLUMN encounter_id VARCHAR(36) NULL,
            ADD COLUMN home_visit_id VARCHAR(36) NULL,
            ADD CONSTRAINT fk_invoices_encounter
              FOREIGN KEY (encounter_id) REFERENCES Clinical_Encounters(id) ON DELETE SET NULL,
            ADD CONSTRAINT fk_invoices_homevisit
              FOREIGN KEY (home_visit_id) REFERENCES Home_Visits(id) ON DELETE SET NULL;
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

patchInvoices();
