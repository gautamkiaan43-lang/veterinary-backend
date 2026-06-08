const petOwnerService = require('../services/petOwnerService');

const getOwners = async (req, res) => {
    try {
        const owners = await petOwnerService.getAllOwners();
        res.json({ status: 'success', data: owners });
    } catch (error) {
        console.error('Error fetching owners:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch pet owners' });
    }
};

const getOwner = async (req, res) => {
    try {
        const owner = await petOwnerService.getOwnerById(req.params.id);
        if (!owner) return res.status(404).json({ status: 'error', message: 'Owner not found' });
        res.json({ status: 'success', data: owner });
    } catch (error) {
        console.error('Error fetching owner:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch pet owner' });
    }
};

const createOwner = async (req, res) => {
    try {
        const { name, nic, mobile } = req.body;
        if (!name || !nic || !mobile) {
            return res.status(400).json({ status: 'error', message: 'Name, NIC, and Mobile are required fields' });
        }
        const newOwner = await petOwnerService.createOwner(req.body);
        res.status(201).json({ status: 'success', data: newOwner });
    } catch (error) {
        console.error('Error creating owner:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'An owner with this NIC or Email already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create owner' });
    }
};

const updateOwner = async (req, res) => {
    try {
        const updated = await petOwnerService.updateOwner(req.params.id, req.body);
        if (!updated) return res.status(404).json({ status: 'error', message: 'Owner not found' });
        res.json({ status: 'success', data: updated });
    } catch (error) {
        console.error('Error updating owner:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'An owner with this NIC or Email already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update owner' });
    }
};

const deleteOwner = async (req, res) => {
    try {
        const deleted = await petOwnerService.deleteOwner(req.params.id);
        if (!deleted) return res.status(404).json({ status: 'error', message: 'Owner not found' });
        res.json({ status: 'success', message: 'Owner deleted successfully' });
    } catch (error) {
        console.error('Error deleting owner:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete owner' });
    }
};

module.exports = { getOwners, getOwner, createOwner, updateOwner, deleteOwner };
