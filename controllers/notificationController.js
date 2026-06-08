const db = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch specific user notifications or general clinic broadcasts (user_id IS NULL)
        const [rows] = await db.query(
            `SELECT 
                id,
                user_id,
                title,
                message,
                type,
                is_read,
                created_at
             FROM notifications 
             WHERE user_id = ? OR user_id IS NULL 
             ORDER BY created_at DESC 
             LIMIT 15`,
            [userId]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Notification not found' });
        }
        res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update notification' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? OR user_id IS NULL',
            [userId]
        );
        res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
    }
};
