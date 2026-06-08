const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Set user in request object
            req.user = decoded; // Contains { id, role, email }
            
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
    }
};

// Middleware to check roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `User role '${req.user ? req.user.role : 'Unknown'}' is not authorized to access this route` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
