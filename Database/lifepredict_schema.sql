-- =========================================================
-- LifePredict Database Schema
-- =========================================================

CREATE DATABASE IF NOT EXISTS lifepredict;

USE lifepredict;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient', 'doctor') NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) DEFAULT NULL,
    verification_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    reset_password_token_hash VARCHAR(255) DEFAULT NULL,
    reset_password_expires DATETIME DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
);


-- =========================================================
-- PATIENT PROFILES
-- =========================================================

CREATE TABLE IF NOT EXISTS patient_profiles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    patient_id VARCHAR(20) NOT NULL,

    date_of_birth DATE DEFAULT NULL,

    gender ENUM('male', 'female', 'other') DEFAULT NULL,

    height_cm DECIMAL(5,2) DEFAULT NULL,

    smoking_status ENUM('never', 'former', 'current') DEFAULT NULL,

    alcohol_status ENUM('never', 'occasionally', 'frequently')
        DEFAULT NULL,

    activity_level ENUM('low', 'moderate', 'high')
        DEFAULT NULL,

    existing_conditions TEXT DEFAULT NULL,
    family_history TEXT DEFAULT NULL,
    current_medications TEXT DEFAULT NULL,
    previous_health_issues TEXT DEFAULT NULL,

    profile_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_patient_user (user_id),
    UNIQUE KEY uq_patient_id (patient_id),

    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- DOCTOR PROFILES
-- =========================================================

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,

    specialization VARCHAR(150) DEFAULT NULL,
    qualification VARCHAR(150) DEFAULT NULL,
    experience_years INT DEFAULT NULL,
    hospital_clinic VARCHAR(255) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_doctor_user (user_id),
    UNIQUE KEY uq_doctor_id (doctor_id),

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- DOCTOR - PATIENT CONNECTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS doctor_patient_connections (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    patient_user_id INT UNSIGNED NOT NULL,
    doctor_user_id INT UNSIGNED NOT NULL,

    status ENUM('pending', 'accepted', 'rejected')
        NOT NULL DEFAULT 'pending',

    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_connection_patient
        FOREIGN KEY (patient_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_connection_doctor
        FOREIGN KEY (doctor_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- PREDICTION HISTORY
-- =========================================================

CREATE TABLE IF NOT EXISTS prediction_history (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id INT UNSIGNED NOT NULL,

    prediction VARCHAR(100) DEFAULT NULL,

    probability_no_cardio DECIMAL(10,8) DEFAULT NULL,
    probability_cardio DECIMAL(10,8) DEFAULT NULL,

    weight_kg DECIMAL(6,2) DEFAULT NULL,

    systolic_bp INT DEFAULT NULL,
    diastolic_bp INT DEFAULT NULL,

    cholesterol INT DEFAULT NULL,
    glucose INT DEFAULT NULL,

    age_years DECIMAL(5,2) DEFAULT NULL,
    bmi DECIMAL(6,2) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_prediction_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- PATIENT HEALTH DATA
-- =========================================================

CREATE TABLE IF NOT EXISTS patient_health_data (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,

    age INT DEFAULT NULL,
    gender ENUM('male', 'female', 'other') DEFAULT NULL,

    height DECIMAL(6,2) DEFAULT NULL,
    weight DECIMAL(6,2) DEFAULT NULL,

    systolic_bp INT DEFAULT NULL,
    diastolic_bp INT DEFAULT NULL,

    cholesterol INT DEFAULT NULL,
    glucose INT DEFAULT NULL,

    smoking BOOLEAN DEFAULT FALSE,
    alcohol BOOLEAN DEFAULT FALSE,
    physical_activity BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_patient_health_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- DAILY HEALTH RECORDS
-- =========================================================

CREATE TABLE IF NOT EXISTS health_records (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id INT UNSIGNED NOT NULL,

    weight_kg DECIMAL(6,2) NOT NULL,

    systolic_bp INT NOT NULL,
    diastolic_bp INT NOT NULL,

    resting_heart_rate INT DEFAULT NULL,

    glucose DECIMAL(8,2) DEFAULT NULL,
    glucose_reading_type VARCHAR(50) DEFAULT NULL,

    cholesterol DECIMAL(8,2) DEFAULT NULL,

    physical_activity_minutes INT DEFAULT NULL,
    steps INT DEFAULT NULL,

    sleep_hours DECIMAL(4,2) DEFAULT NULL,
    sleep_quality VARCHAR(50) DEFAULT NULL,

    stress_level VARCHAR(50) DEFAULT NULL,

    water_intake_litres DECIMAL(5,2) DEFAULT NULL,

    alcohol_today BOOLEAN DEFAULT FALSE,
    drinks_today DECIMAL(5,2) DEFAULT NULL,

    smoking_today BOOLEAN DEFAULT FALSE,
    cigarettes_today INT DEFAULT NULL,

    sedentary_time_hours DECIMAL(5,2) DEFAULT NULL,

    energy_level VARCHAR(50) DEFAULT NULL,
    mood VARCHAR(50) DEFAULT NULL,

    symptoms TEXT DEFAULT NULL,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_health_record_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_health_records_user_date
        (user_id, recorded_at)
);


-- =========================================================
-- END OF HEALTH TABLES
-- =========================================================

-- =========================================================
-- END OF CORE LIFEPREDICT SCHEMA
-- =========================================================