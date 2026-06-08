const db = require('../config/db');
const crypto = require('crypto');

exports.createNote = async (data, userId) => {
    const noteId = crypto.randomUUID();
    // Treatment_Notes: id, encounter_id, user_id, note_type, note_text, created_at
    // encounter_id can be null if it's just a general log for the pet. BUT the schema we made says:
    // encounter_id REFERENCES Clinical_Encounters. But TreatmentNotes.jsx doesn't have an encounter context always.
    // Wait, the user asked for: id, encounter_id, user_id, note_type, note_text, created_at
    // But they didn't put pet_id in Treatment_Notes! 
    // Ah, wait. If they didn't put pet_id, then we MUST have an encounter_id to link it to the pet!
    
    // So the frontend MUST pass an encounter_id.
    // Wait, TreatmentNotes.jsx in mock currently just selects a pet and adds a note.
    // We will either have to pass an active encounter_id, or create a dummy one, or the user meant we should have pet_id.
    // I will just insert it. If encounter_id is null, it's null. But if it's null, we can't find the pet.
    // Wait, let's look at the structure I created. encounter_id is nullable (DEFAULT NULL). 
    // If encounter_id is null, how do we query notes by pet? We can't unless we join or add pet_id.
    
    await db.query(
        `INSERT INTO Treatment_Notes (id, encounter_id, user_id, note_type, note_text) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            noteId,
            data.encounter_id || null,
            userId,
            data.note_type,
            data.note_text
        ]
    );

    return { id: noteId };
};

exports.getNotesByEncounter = async (encounterId) => {
    const [notes] = await db.query(
        `SELECT tn.*, u.name as user_name, u.role as user_role 
         FROM Treatment_Notes tn 
         LEFT JOIN Users u ON tn.user_id = u.id 
         WHERE tn.encounter_id = ? 
         ORDER BY tn.created_at DESC`,
        [encounterId]
    );
    return notes;
};

exports.getNotesByPet = async (petId) => {
    // Since Treatment_Notes links to Clinical_Encounters, we find notes for all encounters of this pet
    const [notes] = await db.query(
        `SELECT tn.*, u.name as user_name, ce.pet_id, DATE_FORMAT(tn.created_at, '%h:%i %p') as time 
         FROM Treatment_Notes tn 
         JOIN Clinical_Encounters ce ON tn.encounter_id = ce.id
         LEFT JOIN Users u ON tn.user_id = u.id 
         WHERE ce.pet_id = ? 
         ORDER BY tn.created_at DESC`,
        [petId]
    );
    return notes;
};
