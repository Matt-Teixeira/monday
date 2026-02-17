WITH user_systems AS (
    SELECT unnest(system_list_cache) AS system_id
    FROM users
    WHERE lower(email_address) = lower('ryan.anderson@avantehs.com')
),
filtered_systems AS (
    SELECT systems.id
    FROM systems
    JOIN user_systems ON systems.id = user_systems.system_id
    WHERE show_on_website = TRUE
    AND process_edu = TRUE
)
SELECT fs.id AS system_id, rf.edu_datetime, NULL AS comp_vib_status
FROM filtered_systems fs
    JOIN recent_files rf ON fs.id = rf.system_id
    JOIN edu.v1 ON fs.id = v1.system_id AND rf.edu_datetime = v1.capture_datetime
UNION
SELECT fs.id AS system_id, rf.edu_datetime, v2.comp_vib_status
FROM filtered_systems fs
    JOIN recent_files rf ON fs.id = rf.system_id
    JOIN edu.v2 ON fs.id = v2.system_id AND rf.edu_datetime = v2.capture_datetime
UNION
SELECT fs.id AS system_id, rf.edu_datetime, NULL AS comp_vib_status
FROM filtered_systems fs
    JOIN recent_files rf ON fs.id = rf.system_id
    JOIN edu.v3 ON fs.id = v3.system_id AND rf.edu_datetime = v3.capture_datetime;