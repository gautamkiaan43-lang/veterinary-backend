const homeVisitService = require('../services/homeVisitService');

class HomeVisitController {
    async getAllHomeVisits(req, res) {
        try {
            const filters = {
                ownerId: req.query.ownerId,
                petId: req.query.petId,
                doctorId: req.query.doctorId,
                status: req.query.status
            };
            const visits = await homeVisitService.getAllHomeVisits(filters);
            res.status(200).json({ success: true, count: visits.length, data: visits });
        } catch (error) {
            console.error('Error fetching home visits:', error);
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    }

    async getHomeVisitById(req, res) {
        try {
            const visit = await homeVisitService.getHomeVisitById(req.params.id);
            if (!visit) {
                return res.status(404).json({ success: false, message: 'Home Visit not found' });
            }
            res.status(200).json({ success: true, data: visit });
        } catch (error) {
            console.error('Error fetching home visit by ID:', error);
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    }

    async createHomeVisit(req, res) {
        try {
            const { petId, ownerId, doctorId, appointmentDate, appointmentTime, address, travelFee, notes } = req.body;
            
            if (!petId || !ownerId || !appointmentDate || !appointmentTime || !address) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Please provide petId, ownerId, appointmentDate, appointmentTime, and address' 
                });
            }

            const visit = await homeVisitService.createHomeVisit(req.body);
            res.status(201).json({ success: true, data: visit });
        } catch (error) {
            console.error('Error creating home visit:', error);
            const status = error.message.includes('Double booking') || error.message.includes('Travel fee') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    async updateHomeVisit(req, res) {
        try {
            const visit = await homeVisitService.updateHomeVisit(req.params.id, req.body);
            if (!visit) {
                 return res.status(404).json({ success: false, message: 'Home Visit not found' });
            }
            res.status(200).json({ success: true, data: visit });
        } catch (error) {
            console.error('Error updating home visit:', error);
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    async deleteHomeVisit(req, res) {
        try {
            const success = await homeVisitService.deleteHomeVisit(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, message: 'Home Visit not found' });
            }
            res.status(200).json({ success: true, message: 'Home Visit cancelled successfully' });
        } catch (error) {
            console.error('Error deleting home visit:', error);
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    }
}

module.exports = new HomeVisitController();
