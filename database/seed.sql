-- veterinary_db Seed Data
USE veterinary_db;

-- 1. Users (Staff)
-- Note: password_hash is a dummy bcrypt hash. Real app will hash actual passwords.
INSERT INTO Users (id, name, email, password_hash, role, phone, status) VALUES
('u1-admin', 'Dr. Sarah Jenkins', 'admin@veterinary.com', '$2b$10$hashedpassworddummy', 'Admin', '555-0100', 'Active'),
('u2-manager', 'Michael Ross', 'manager@veterinary.com', '$2b$10$hashedpassworddummy', 'Manager', '555-0101', 'Active'),
('u3-doctor1', 'Dr. Alan Grant', 'agrant@veterinary.com', '$2b$10$hashedpassworddummy', 'Doctor', '555-0102', 'Active'),
('u4-doctor2', 'Dr. Ellie Sattler', 'esattler@veterinary.com', '$2b$10$hashedpassworddummy', 'Doctor', '555-0103', 'Active'),
('u5-recept', 'Jessica Day', 'reception@veterinary.com', '$2b$10$hashedpassworddummy', 'Receptionist', '555-0104', 'Active'),
('u6-vetasst', 'Todd Chavez', 'assistant@veterinary.com', '$2b$10$hashedpassworddummy', 'Vet Assistant', '555-0105', 'Active');

-- 2. Pet Owners
-- No initial pet owners seeded

-- 3. Pets (Patients)
-- No initial pets seeded

-- 4. Appointments
-- No initial appointments seeded

-- 5. Home Visits
-- No initial home visits seeded

-- 6. Clinical Encounters
-- No initial clinical encounters seeded

-- 7. Prescriptions
-- No initial prescriptions seeded

-- 8. Diagnostic Reports
-- No initial diagnostic reports seeded

-- 9. Inventory
-- INSERT INTO Inventory (id, sku, name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date) VALUES
-- ('inv-1', 'MED-OTO-001', 'Otomax Ear Drops 15g', 'Medicine', 'VetPharma Inc.', 24, 10, 15.00, 28.50, TRUE, '2028-01-01'),
-- ('inv-2', 'VACC-RAB-01', 'Rabies Vaccine (Defensor 3)', 'Medicine', 'Zoetis', 50, 15, 8.50, 20.00, FALSE, '2027-06-30'),
-- ('inv-3', 'FOOD-RC-001', 'Royal Canin Gastrointestinal 2kg', 'Food & Snacks', 'Royal Canin', 12, 5, 22.00, 35.00, TRUE, '2027-12-15'),
-- ('inv-4', 'SRV-CONSULT', 'Standard General Consultation', 'Service', 'Internal', NULL, NULL, 0.00, 45.00, FALSE, NULL),
-- ('inv-5', 'SRV-HOMEFEE', 'Home Visit Travel Fee', 'Service', 'Internal', NULL, NULL, 0.00, 25.00, FALSE, NULL);

-- 10. Invoices
-- No initial invoices seeded

-- 11. Invoice Line Items
-- No initial invoice line items seeded

-- 12. Attendance
INSERT INTO Attendance (id, user_id, attendance_date, check_in, check_out, working_hours, status) VALUES
('att-1', 'u3-doctor1', '2026-06-03', '08:45:00', '17:15:00', 8.5, 'Present'),
('att-2', 'u4-doctor2', '2026-06-03', '09:00:00', '17:00:00', 8.0, 'Present'),
('att-3', 'u5-recept', '2026-06-03', '08:30:00', '17:30:00', 9.0, 'Present');

-- 13. Notifications
INSERT INTO Notifications (id, user_id, title, message, type, is_read) VALUES
('notif-1', 'u1-admin', 'Low Stock Alert', 'Royal Canin Gastrointestinal 2kg is running low (Current: 12, Threshold: 5).', 'Inventory', FALSE);

-- 14. Email Reminders
-- No initial email reminders seeded

