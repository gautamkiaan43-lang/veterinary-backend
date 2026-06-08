const inventoryService = require('../services/inventoryService');

// @desc    Get all inventory items
// @route   GET /api/v1/inventory
// @access  Private (All Roles)
const getInventory = async (req, res) => {
    try {
        const items = await inventoryService.getAllItems();
        res.json({ status: 'success', data: items });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch inventory items' });
    }
};

// @desc    Get single inventory item
// @route   GET /api/v1/inventory/:id
// @access  Private (All Roles)
const getInventoryItem = async (req, res) => {
    try {
        const item = await inventoryService.getItemById(req.params.id);
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'inventory item not found' });
        }
        res.json({ status: 'success', data: item });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch inventory item' });
    }
};

// @desc    Create new inventory item
// @route   POST /api/v1/inventory
// @access  Private (Admin, Manager)
const createInventoryItem = async (req, res) => {
    try {
        const { sku, name, category, selling_price } = req.body;
        
        // Validation layer
        if (!sku || !name || !category || selling_price === undefined) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'SKU, name, category, and selling_price are required fields' 
            });
        }

        const newItem = await inventoryService.createItem(req.body);
        res.status(201).json({ status: 'success', data: newItem });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'An item with this SKU already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create inventory item' });
    }
};

// @desc    Update inventory item
// @route   PUT /api/v1/inventory/:id
// @access  Private (Admin, Manager)
const updateInventoryItem = async (req, res) => {
    try {
        const updatedItem = await inventoryService.updateItem(req.params.id, req.body);
        if (!updatedItem) {
            return res.status(404).json({ status: 'error', message: 'inventory item not found' });
        }
        res.json({ status: 'success', data: updatedItem });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update inventory item' });
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/v1/inventory/:id
// @access  Private (Admin, Manager)
const deleteInventoryItem = async (req, res) => {
    try {
        const deleted = await inventoryService.deleteItem(req.params.id);
        if (!deleted) {
            return res.status(404).json({ status: 'error', message: 'inventory item not found' });
        }
        res.json({ status: 'success', message: 'inventory item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete inventory item' });
    }
};

module.exports = {
    getInventory,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
};
