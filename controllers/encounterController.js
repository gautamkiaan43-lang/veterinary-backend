const encounterService = require('../services/encounterService');

exports.createEncounter = async (req, res) => {
    try {
        const { pet_id, complaint, diagnosis } = req.body;
        
        if (!pet_id || !complaint || !diagnosis) {
            return res.status(400).json({ message: 'Missing required fields (pet_id, complaint, diagnosis)' });
        }

        // Only Doctor, Admin, Vet Assistant can create encounters
        if (!['Admin', 'Doctor', 'Vet Assistant'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to create clinical encounters' });
        }

        // Vet Assistant cannot prescribe
        if (req.user.role === 'Vet Assistant' && req.body.prescriptions && req.body.prescriptions.length > 0) {
            return res.status(403).json({ message: 'Vet Assistants are restricted from writing prescriptions' });
        }

        const encounter = await encounterService.createEncounter(req.body, req.user.id);
        res.status(201).json({ message: 'Encounter created successfully', id: encounter.id });
    } catch (error) {
        console.error('Error creating encounter:', error);
        res.status(500).json({ message: 'Server error while creating encounter' });
    }
};

exports.getEncounters = async (req, res) => {
    try {
        const { petId } = req.query;
        let encounters;
        
        if (petId) {
            encounters = await encounterService.getEncountersByPet(petId);
        } else {
            encounters = await encounterService.getAllEncounters();
        }
        
        res.json(encounters);
    } catch (error) {
        console.error('Error fetching encounters:', error);
        res.status(500).json({ message: 'Server error while fetching encounters' });
    }
};
