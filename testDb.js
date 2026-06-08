const db = require('./config/db');
db.query("SELECT u.name, a.attendance_date, a.check_in FROM users u LEFT JOIN attendance a ON u.id = a.user_id")
  .then(([r]) => console.table(r))
  .catch(console.error)
  .finally(() => process.exit());
