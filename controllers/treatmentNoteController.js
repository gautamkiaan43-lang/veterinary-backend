const treatmentNoteService = require('../services/treatmentNoteService');
const db = require('../config/db');

exports.createNote = async (req, res) => {
    try {
        let { encounter_id, pet_id, note_type, note_text } = req.body;
        
        if (!note_type || !note_text) {
            return res.status(400).json({ message: 'Missing required fields (note_type, note_text)' });
        }

        // If frontend passes pet_id but no encounter_id, find the latest encounter
        if (!encounter_id && pet_id) {
            const [encounters] = await db.query(
                `SELECT id FROM Clinical_Encounters WHERE pet_id = ? ORDER BY encounter_date DESC LIMIT 1`,
                [pet_id]
            );
            if (encounters.length > 0) {
                encounter_id = encounters[0].id;
            } else {
                return res.status(400).json({ message: 'No clinical encounter found for this pet to attach notes to. Please create an encounter first.' });
            }
        }

        if (!encounter_id) {
             return res.status(400).json({ message: 'encounter_id or pet_id is required' });
        }

        req.body.encounter_id = encounter_id;

        const note = await treatmentNoteService.createNote(req.body, req.user.id);
        res.status(201).json({ message: 'Note added successfully', id: note.id });
    } catch (error) {
        console.error('Error creating treatment note:', error);
        res.status(500).json({ message: 'Server error while creating note' });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const { petId, encounterId } = req.query;
        let notes = [];
        
        if (encounterId) {
            notes = await treatmentNoteService.getNotesByEncounter(encounterId);
        } else if (petId) {
            notes = await treatmentNoteService.getNotesByPet(petId);
        } else {
            return res.status(400).json({ message: 'Must provide petId or encounterId query parameter' });
        }
        
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error while fetching notes' });
    }
};
