const invoiceService = require('../services/invoiceService');

exports.getInvoices = async (req, res) => {
    try {
        const invoices = await invoiceService.getAllInvoices();
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server error while fetching invoices' });
    }
};

exports.getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await invoiceService.getInvoiceById(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice details:', error);
        res.status(500).json({ message: 'Server error while fetching invoice' });
    }
};

exports.getUnbilled = async (req, res) => {
    try {
        // Admin, Manager, Receptionist, and Doctor can see unbilled queue
        if (!['Admin', 'Manager', 'Receptionist', 'Doctor'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to view unbilled records' });
        }

        const unbilled = await invoiceService.getUnbilledRecords();
        res.json(unbilled);
    } catch (error) {
        console.error('Error fetching unbilled records:', error);
        res.status(500).json({ message: 'Server error while fetching unbilled queue' });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const { owner_id, pet_id, subtotal, grand_total, lineItems } = req.body;

        if (!owner_id || !pet_id || subtotal === undefined || grand_total === undefined) {
            return res.status(400).json({ message: 'Missing required invoice summary fields' });
        }

        // Only Admin, Manager, Receptionist, Doctor can generate invoices
        if (!['Admin', 'Manager', 'Receptionist', 'Doctor'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to generate invoices' });
        }

        const invoice = await invoiceService.createInvoice(req.body);
        res.status(201).json({ message: 'Invoice created successfully', id: invoice.id });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Server error while generating invoice' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Missing required status field' });
        }

        // Only Admin, Manager, Receptionist can update invoice payment status
        if (!['Admin', 'Manager', 'Receptionist'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to update invoice status' });
        }

        const result = await invoiceService.updateInvoiceStatus(id, status);
        res.json({ message: `Invoice status updated to ${status} successfully`, id: result.id });
    } catch (error) {
        console.error('Error updating invoice status:', error);
        if (error.message.includes('cannot be modified') || error.message.includes('Invalid invoice status transition')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while updating invoice' });
    }
};
