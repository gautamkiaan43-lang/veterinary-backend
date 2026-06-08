const attendanceService = require('../services/attendanceService');

exports.getDailyAttendance = async (req, res) => {
    try {
        const date = req.query.date || new Date().toLocaleDateString('en-CA');
        const data = await attendanceService.getDailyAttendance(date);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch attendance' });
    }
};

exports.getPersonalHistory = async (req, res) => {
    try {
        const data = await attendanceService.getPersonalHistory(req.user.id);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch history' });
    }
};

exports.checkIn = async (req, res) => {
    try {
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const time = d.toLocaleTimeString('en-GB');
        
        await attendanceService.checkIn(req.user.id, date, time);
        res.status(200).json({ status: 'success', message: 'Checked in successfully' });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const time = d.toLocaleTimeString('en-GB');
        
        const result = await attendanceService.checkOut(req.user.id, date, time);
        res.status(200).json({ status: 'success', message: 'Checked out successfully', data: result });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
};
