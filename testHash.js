const db = require('./config/db');
const bcrypt = require('bcrypt');

async function testLogin() {
    try {
        const email = 'demoR@gmail.com';
        const password = 'password123'; // assuming they typed this, or maybe they typed something else? We will just check if hash exists and length
        const [users] = await db.query('SELECT password_hash FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            console.log("Password hash found. Length:", users[0].password_hash.length);
            console.log("Hash starts with $2b$?", users[0].password_hash.startsWith('$2b$'));
        } else {
            console.log("User not found");
        }
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
testLogin();
