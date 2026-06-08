const fs = require('fs');
const path = require('path');

const tables = [
    'users', 'attendance', 'appointments', 'pets', 'pet_owners', 
    'home_visits', 'email_reminders', 'encounters', 'treatment_notes', 
    'invoices', 'invoice_items', 'payments', 'inventory', 
    'notifications', 'settings'
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules') {
                walkDir(dirPath, callback);
            }
        } else {
            if (dirPath.endsWith('.js')) {
                callback(dirPath);
            }
        }
    });
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    tables.forEach(table => {
        // We look for FROM/JOIN/INTO/UPDATE followed by the table name, case-insensitive for SQL keyword.
        // We will use a regex to match the table name exactly with capital letters and lowercase it.
        // E.g. FROM users -> FROM users
        // But also we need to catch it even if we just use a generic regex:
        let regex = new RegExp(`\\b${table}\\b`, 'g');
        content = content.replace(regex, table.toLowerCase());
    });
    
    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

walkDir(__dirname, fixFile);
console.log('Done!');
