const reportService = require('../services/reportService');

exports.getRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await reportService.getRevenueAnalytics(startDate, endDate);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching revenue reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch revenue analytics' });
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const data = await reportService.getAppointmentAnalytics();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching appointment reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch appointment analytics' });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const data = await reportService.getDoctorAudit();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching doctor performance reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch doctor performance audit' });
    }
};

exports.getPatients = async (req, res) => {
    try {
        const data = await reportService.getPatientDemographics();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching patient demographics reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch patient demographics' });
    }
};

exports.getInventory = async (req, res) => {
    try {
        const data = await reportService.getInventoryResourceAlerts();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching inventory reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch inventory reports' });
    }
};
