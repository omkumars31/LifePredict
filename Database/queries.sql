-- =========================================================
-- LifePredict Useful Queries
-- =========================================================

USE lifepredict;


-- ---------------------------------------------------------
-- CHECK TABLES
-- ---------------------------------------------------------

SHOW TABLES;


-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------

SELECT *
FROM users;


-- ---------------------------------------------------------
-- PATIENTS
-- ---------------------------------------------------------

SELECT
    u.id,
    u.full_name,
    u.email,
    pp.patient_id,
    pp.gender,
    pp.height_cm,
    pp.activity_level,
    pp.profile_completed
FROM users u
LEFT JOIN patient_profiles pp
    ON pp.user_id = u.id
WHERE u.role = 'patient';


-- ---------------------------------------------------------
-- DOCTORS
-- ---------------------------------------------------------

SELECT
    u.id,
    u.full_name,
    u.email,
    dp.doctor_id,
    dp.specialization,
    dp.qualification,
    dp.experience_years,
    dp.hospital_clinic
FROM users u
LEFT JOIN doctor_profiles dp
    ON dp.user_id = u.id
WHERE u.role = 'doctor';


-- ---------------------------------------------------------
-- DOCTOR-PATIENT CONNECTIONS
-- ---------------------------------------------------------

SELECT
    c.id,
    c.status,
    c.requested_at,
    c.responded_at,

    p.full_name AS patient_name,
    pp.patient_id,

    d.full_name AS doctor_name,
    dp.doctor_id

FROM doctor_patient_connections c

JOIN users p
    ON p.id = c.patient_user_id

LEFT JOIN patient_profiles pp
    ON pp.user_id = p.id

JOIN users d
    ON d.id = c.doctor_user_id

LEFT JOIN doctor_profiles dp
    ON dp.user_id = d.id

ORDER BY c.requested_at DESC;


-- ---------------------------------------------------------
-- PREDICTION HISTORY
-- ---------------------------------------------------------

SELECT *
FROM prediction_history
ORDER BY created_at DESC;


-- ---------------------------------------------------------
-- PATIENT PREDICTIONS
-- ---------------------------------------------------------

SELECT
    ph.*,
    u.full_name,
    pp.patient_id
FROM prediction_history ph

JOIN users u
    ON u.id = ph.user_id

LEFT JOIN patient_profiles pp
    ON pp.user_id = u.id

ORDER BY ph.created_at DESC;


-- ---------------------------------------------------------
-- FIND PATIENT BY PATIENT ID
-- ---------------------------------------------------------

SELECT
    u.id,
    u.full_name,
    u.email,
    pp.*
FROM users u
JOIN patient_profiles pp
    ON pp.user_id = u.id
WHERE pp.patient_id = 'LP-P-000006';


-- ---------------------------------------------------------
-- FIND DOCTOR BY DOCTOR ID
-- ---------------------------------------------------------

SELECT
    u.id,
    u.full_name,
    u.email,
    dp.*
FROM users u
JOIN doctor_profiles dp
    ON dp.user_id = u.id
WHERE dp.doctor_id = 'LP-D-000001';


-- ---------------------------------------------------------
-- DELETE ONE USER
-- WARNING: CASCADE WILL DELETE RELATED DATA
-- ---------------------------------------------------------

-- DELETE FROM users
-- WHERE id = 6;


-- ---------------------------------------------------------
-- COUNT PATIENTS
-- ---------------------------------------------------------

SELECT COUNT(*) AS total_patients
FROM users
WHERE role = 'patient';


-- ---------------------------------------------------------
-- COUNT DOCTORS
-- ---------------------------------------------------------

SELECT COUNT(*) AS total_doctors
FROM users
WHERE role = 'doctor';


-- ---------------------------------------------------------
-- CONNECTION STATUS COUNT
-- ---------------------------------------------------------

SELECT
    status,
    COUNT(*) AS total
FROM doctor_patient_connections
GROUP BY status;