const db = require('./config/db');
db.query("ALTER TABLE Users MODIFY COLUMN status ENUM('Active', 'Inactive', 'On Leave', 'Terminated') DEFAULT 'Active'")
    .then(() => console.log('Enum updated'))
    .catch(console.error)
    .finally(() => process.exit());
