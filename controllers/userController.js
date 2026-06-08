const userService = require('../services/userService');

exports.getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedUser = await userService.updateProfile(req.user.id, req.body);
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update profile' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const filters = {
            role: req.query.role,
            status: req.query.status
        };
        const users = await userService.getAllUsers(filters);
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
    }
};

exports.createUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Admins can register new staff members' });
        }
        
        const { fullName, email, password, role } = req.body;
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ status: 'error', message: 'Missing required fields' });
        }
        
        const newUser = await userService.createUser(req.body);
        res.status(201).json({ status: 'success', data: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'Email or username already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create staff member' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Admins can modify staff members' });
        }
        
        const { id } = req.params;
        const updatedUser = await userService.updateUser(id, req.body);
        
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found' });
        }
        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'Email or username already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update staff member' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Admins can remove staff members' });
        }
        
        const { id } = req.params;
        
        // Prevent self-deletion
        if (req.user.id === id) {
            return res.status(400).json({ status: 'error', message: 'You cannot delete your own account' });
        }

        const success = await userService.deleteUser(id);
        if (!success) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found' });
        }
        res.status(200).json({ status: 'success', message: 'Staff member removed successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ status: 'error', message: 'Failed to remove staff member' });
    }
};
