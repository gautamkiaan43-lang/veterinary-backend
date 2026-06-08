const db = require('../config/db');
const crypto = require('crypto');

exports.createEncounter = async (encounterData, doctorId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const encounterId = crypto.randomUUID();
        const date = new Date().toISOString().split('T')[0];

        // Insert Encounter
        await conn.query(
            `INSERT INTO Clinical_Encounters 
            (id, pet_id, doctor_id, encounter_date, complaint, duration, symptoms, diagnosis, treatment, follow_up) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                encounterId,
                encounterData.pet_id,
                doctorId,
                date,
                encounterData.complaint,
                encounterData.duration || null,
                encounterData.symptoms || null,
                encounterData.diagnosis,
                encounterData.treatment || null,
                encounterData.follow_up || null
            ]
        );

        // Insert Prescriptions if any
        if (encounterData.prescriptions && encounterData.prescriptions.length > 0) {
            for (const rx of encounterData.prescriptions) {
                const rxId = crypto.randomUUID();
                
                // Look up matching inventory item (Category: Medicine)
                let inventoryId = null;
                const [inv] = await conn.query(
                    `SELECT id FROM inventory WHERE category = 'Medicine' AND ? LIKE CONCAT('%', name, '%') LIMIT 1`,
                    [rx.medicine_name]
                );
                if (inv.length > 0) {
                    inventoryId = inv[0].id;
                }

                await conn.query(
                    `INSERT INTO Prescriptions 
                    (id, encounter_id, medicine_name, dosage, frequency, duration, instructions, inventory_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rxId,
                        encounterId,
                        rx.medicine_name,
                        rx.dosage || null,
                        rx.frequency || null,
                        rx.duration || null,
                        rx.instructions || null,
                        inventoryId
                    ]
                );
            }
        }

        // Insert Diagnostic Reports if any
        if (encounterData.reports && encounterData.reports.length > 0) {
            for (const rep of encounterData.reports) {
                const repId = crypto.randomUUID();
                await conn.query(
                    `INSERT INTO Diagnostic_Reports 
                    (id, encounter_id, report_type, file_url, uploaded_by) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        repId,
                        encounterId,
                        rep.report_type,
                        rep.file_url,
                        doctorId // the uploader
                    ]
                );
            }
        }

        await conn.commit();
        return { id: encounterId };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getEncountersByPet = async (petId) => {
    // Get encounters
    const [encounters] = await db.query(
        `SELECT ce.*, u.name as doctor_name 
         FROM Clinical_Encounters ce 
         LEFT JOIN users u ON ce.doctor_id = u.id 
         WHERE ce.pet_id = ? 
         ORDER BY ce.encounter_date DESC`,
        [petId]
    );

    // Get all related records and map them
    for (const enc of encounters) {
        const [prescriptions] = await db.query(
            `SELECT * FROM Prescriptions WHERE encounter_id = ?`,
            [enc.id]
        );
        enc.prescriptions = prescriptions;

        const [reports] = await db.query(
            `SELECT * FROM Diagnostic_Reports WHERE encounter_id = ?`,
            [enc.id]
        );
        enc.reports = reports;
    }

    return encounters;
};

exports.getAllEncounters = async () => {
    const [encounters] = await db.query(
        `SELECT ce.*, p.name as pet_name, po.name as owner_name, u.name as doctor_name 
         FROM Clinical_Encounters ce 
         JOIN pets p ON ce.pet_id = p.id
         JOIN pet_owners po ON p.owner_id = po.id
         LEFT JOIN users u ON ce.doctor_id = u.id 
         ORDER BY ce.encounter_date DESC`
    );
    return encounters;
};
