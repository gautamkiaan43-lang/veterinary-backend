-- veterinary_db Schema
CREATE DATABASE IF NOT EXISTS veterinary_db;
USE veterinary_db;

-- 1. Users (Staff)
CREATE TABLE Users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager', 'Doctor', 'Receptionist', 'Vet Assistant') NOT NULL,
    phone VARCHAR(20),
    username VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    profile_image VARCHAR(255),
    status ENUM('Active', 'Inactive', 'On Leave', 'Terminated') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Pet Owners
CREATE TABLE Pet_Owners (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nic VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    telephone VARCHAR(20),
    mobile VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pets (Patients)
CREATE TABLE Pets (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36),
    microchip_number VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100),
    breed VARCHAR(100),
    gender ENUM('Male', 'Female'),
    age VARCHAR(50),
    weight DECIMAL(5,2),
    previous_medical_history TEXT,
    last_vaccination DATE,
    last_deworming DATE,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Pet_Owners(id) ON DELETE CASCADE
);

-- 4. Appointments
CREATE TABLE Appointments (
    id VARCHAR(36) PRIMARY KEY,
    pet_id VARCHAR(36),
    doctor_id VARCHAR(36),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type ENUM('Clinic Visit', 'Home Visit') NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    next_reminder_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 5. Home Visits
CREATE TABLE Home_Visits (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36),
    pet_id VARCHAR(36),
    owner_id VARCHAR(36),
    doctor_id VARCHAR(36),
    address TEXT NOT NULL,
    travel_fee DECIMAL(10,2) DEFAULT 0.00,
    visit_status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    notes TEXT,
    FOREIGN KEY (appointment_id) REFERENCES Appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES Pet_Owners(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 6. Clinical Encounters
CREATE TABLE Clinical_Encounters (
    id VARCHAR(36) PRIMARY KEY,
    pet_id VARCHAR(36),
    doctor_id VARCHAR(36),
    encounter_date DATE NOT NULL,
    complaint VARCHAR(255),
    duration VARCHAR(100),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    follow_up VARCHAR(255),
    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 7. Prescriptions
CREATE TABLE Prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    encounter_id VARCHAR(36),
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    FOREIGN KEY (encounter_id) REFERENCES Clinical_Encounters(id) ON DELETE CASCADE
);

-- 8. Diagnostic Reports
CREATE TABLE Diagnostic_Reports (
    id VARCHAR(36) PRIMARY KEY,
    encounter_id VARCHAR(36),
    report_type ENUM('Blood Test', 'X-Ray', 'Ultrasound', 'PDF Report') NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(36),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES Clinical_Encounters(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE SET NULL
);

-- 9. Inventory
CREATE TABLE Inventory (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category ENUM('Accessories & Toys', 'Hygiene Items', 'Food & Snacks', 'Vitamins & Supplements', 'Medicine', 'Service') NOT NULL,
    supplier VARCHAR(255),
    quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2) NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Invoices
CREATE TABLE Invoices (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36),
    pet_id VARCHAR(36),
    doctor_id VARCHAR(36),
    encounter_id VARCHAR(36),
    home_visit_id VARCHAR(36),
    invoice_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL,
    status ENUM('Paid', 'Pending', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (owner_id) REFERENCES Pet_Owners(id) ON DELETE SET NULL,
    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (encounter_id) REFERENCES Clinical_Encounters(id) ON DELETE SET NULL,
    FOREIGN KEY (home_visit_id) REFERENCES Home_Visits(id) ON DELETE SET NULL
);

-- 11. Invoice Line Items
CREATE TABLE Invoice_Line_Items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36),
    inventory_id VARCHAR(36),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES Invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES Inventory(id) ON DELETE SET NULL
);

-- 12. Attendance
CREATE TABLE Attendance (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    working_hours DECIMAL(5,2),
    status ENUM('Present', 'Absent', 'Leave', 'Half Day') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 13. Notifications
CREATE TABLE Notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Inventory', 'Appointment', 'Attendance', 'System') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 14. Email Reminders
CREATE TABLE Email_Reminders (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36),
    recipient_email VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,
    status ENUM('Pending', 'Sent', 'Failed') DEFAULT 'Pending',
    FOREIGN KEY (appointment_id) REFERENCES Appointments(id) ON DELETE CASCADE
);

-- 15. Treatment Notes
CREATE TABLE Treatment_Notes (
    id VARCHAR(36) PRIMARY KEY,
    encounter_id VARCHAR(36),
    user_id VARCHAR(36),
    note_type ENUM('observation', 'medication', 'vitals') NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES Clinical_Encounters(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
