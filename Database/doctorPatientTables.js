const pool = require("../Backend/config/db");

const createDoctorPatientTables = async () => {
  try {
    // ==========================================
    // DOCTOR PATIENT REVIEWS TABLE
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_patient_reviews (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        connection_id INT UNSIGNED NOT NULL,
        doctor_user_id INT UNSIGNED NOT NULL,
        patient_user_id INT UNSIGNED NOT NULL,

        category ENUM(
          'general',
          'lifestyle',
          'medication',
          'follow-up',
          'clinical-review'
        ) NOT NULL DEFAULT 'general',

        review_text TEXT NOT NULL,

        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (id),

        KEY idx_dpr_connection_id (connection_id),
        KEY idx_dpr_doctor_user_id (doctor_user_id),
        KEY idx_dpr_patient_user_id (patient_user_id),

        CONSTRAINT fk_dpr_connection
          FOREIGN KEY (connection_id)
          REFERENCES doctor_patient_connections(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_dpr_doctor
          FOREIGN KEY (doctor_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_dpr_patient
          FOREIGN KEY (patient_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci;
    `);

    // ==========================================
    // DOCTOR PATIENT CONSULTATIONS TABLE
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_patient_consultations (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        connection_id INT UNSIGNED NOT NULL,
        doctor_user_id INT UNSIGNED NOT NULL,
        patient_user_id INT UNSIGNED NOT NULL,

        scheduled_date DATE NOT NULL,
        start_time TIME NOT NULL,
        duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,

        consultation_type ENUM(
          'general',
          'follow-up',
          'risk-review',
          'lifestyle-review'
        ) NOT NULL DEFAULT 'general',

        notes TEXT NULL,

        status ENUM(
          'scheduled',
          'completed',
          'cancelled'
        ) NOT NULL DEFAULT 'scheduled',

        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (id),

        KEY idx_dpc_connection_id (connection_id),
        KEY idx_dpc_doctor_user_id (doctor_user_id),
        KEY idx_dpc_patient_user_id (patient_user_id),
        KEY idx_dpc_scheduled_date (scheduled_date),

        CONSTRAINT fk_dpc_connection
          FOREIGN KEY (connection_id)
          REFERENCES doctor_patient_connections(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_dpc_doctor
          FOREIGN KEY (doctor_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_dpc_patient
          FOREIGN KEY (patient_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci;
    `);

    // ==========================================
    // MANUAL DOCTOR ALERTS TABLE
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_patient_alerts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        connection_id INT UNSIGNED NOT NULL,
        doctor_user_id INT UNSIGNED NOT NULL,
        patient_user_id INT UNSIGNED NOT NULL,

        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,

        priority ENUM(
          'critical',
          'review',
          'follow-up'
        ) NOT NULL DEFAULT 'review',

        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (id),

        KEY idx_dpa_connection_id (connection_id),
        KEY idx_dpa_doctor_user_id (doctor_user_id),
        KEY idx_dpa_patient_user_id (patient_user_id),
        KEY idx_dpa_priority_created (priority, created_at),

        CONSTRAINT fk_dpa_connection
          FOREIGN KEY (connection_id)
          REFERENCES doctor_patient_connections(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_dpa_doctor
          FOREIGN KEY (doctor_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_dpa_patient
          FOREIGN KEY (patient_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci;
    `);

    console.log(
      "Doctor-patient reviews, consultations and alerts tables are ready."
    );
  } catch (error) {
    console.error(
      "Error creating doctor-patient tables:",
      error
    );

    throw error;
  }
};

module.exports = {
  createDoctorPatientTables,
};