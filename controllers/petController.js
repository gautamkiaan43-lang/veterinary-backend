const petService = require('../services/petService');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const getPets = async (req, res) => {
    try {
        const pets = await petService.getAllPets();
        res.json({ status: 'success', data: pets });
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch pets' });
    }
};

const getPet = async (req, res) => {
    try {
        const pet = await petService.getPetById(req.params.id);
        if (!pet) return res.status(404).json({ status: 'error', message: 'Pet not found' });
        res.json({ status: 'success', data: pet });
    } catch (error) {
        console.error('Error fetching pet:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch pet' });
    }
};

const createPet = async (req, res) => {
    try {
        const { ownerId, name, species, weight } = req.body;
        if (!ownerId || !name || !species) {
            return res.status(400).json({ status: 'error', message: 'Owner, Pet Name, and Species are mandatory' });
        }
        if (weight && isNaN(Number(weight))) {
            return res.status(400).json({ status: 'error', message: 'Weight must be a valid number' });
        }
        const newPet = await petService.createPet(req.body);
        res.status(201).json({ status: 'success', data: newPet });
    } catch (error) {
        console.error('Error creating pet:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'A pet with this Microchip Number already exists' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ status: 'error', message: 'The selected Owner does not exist' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to register pet' });
    }
};

const updatePet = async (req, res) => {
    try {
        const { ownerId, name, species, weight } = req.body;
        if (!ownerId || !name || !species) {
            return res.status(400).json({ status: 'error', message: 'Owner, Pet Name, and Species are mandatory' });
        }
        if (weight && isNaN(Number(weight))) {
            return res.status(400).json({ status: 'error', message: 'Weight must be a valid number' });
        }
        const updated = await petService.updatePet(req.params.id, req.body);
        if (!updated) return res.status(404).json({ status: 'error', message: 'Pet not found' });
        res.json({ status: 'success', data: updated });
    } catch (error) {
        console.error('Error updating pet:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'A pet with this Microchip Number already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update pet profile' });
    }
};

const deletePet = async (req, res) => {
    try {
        const deleted = await petService.deletePet(req.params.id);
        if (!deleted) return res.status(404).json({ status: 'error', message: 'Pet not found' });
        res.json({ status: 'success', message: 'Pet archived successfully' });
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete pet' });
    }
};

const uploadPetPhoto = async (req, res) => {
    try {
        const { base64Data, fileName } = req.body;
        if (!base64Data) {
            return res.status(400).json({ status: 'error', message: 'No image data provided' });
        }

        // Clean base64 prefix
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let ext = '.png';

        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
            else if (mimeType.includes('gif')) ext = '.gif';
            else if (mimeType.includes('webp')) ext = '.webp';
        } else {
            buffer = Buffer.from(base64Data, 'base64');
        }

        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueName = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, buffer);

        const publicUrl = `http://localhost:5000/uploads/${uniqueName}`;
        res.status(200).json({ status: 'success', data: { url: publicUrl } });
    } catch (error) {
        console.error('Error uploading pet photo:', error);
        res.status(500).json({ status: 'error', message: 'Failed to upload image file' });
    }
};

module.exports = { getPets, getPet, createPet, updatePet, deletePet, uploadPetPhoto };
