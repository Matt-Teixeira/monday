SELECT DISTINCT ON (systems.id) systems.id AS system_id, rm.capture_datetime AS capture_datetime,
    COALESCE(
        (Select he_pressure_value   FROM mag.ge_mm3 mm3                         WHERE rm.system_id = mm3.system_id::text        and rm.capture_datetime = mm3.capture_datetime),
        (Select he_pressure_value   FROM mag.ge_mm4 mm4                         WHERE rm.system_id = mm4.system_id::text        and rm.capture_datetime = mm4.capture_datetime),
        (Select mag_psia_value      FROM mag.siemens siemens                    WHERE rm.system_id = siemens.system_id::text    and rm.capture_datetime = siemens.capture_datetime),
        (Select he_psi_avg_value    FROM mag.philips_mri_monitoring_data_agg    WHERE rm.system_id = philips_mri_monitoring_data_agg.system_id::text and he_psi_avg_value IS NOT NULL ORDER BY capture_datetime desc LIMIT 1)
    ) AS rpp_value,
    COALESCE(
        (Select he_pressure_units   FROM mag.ge_mm3_units mm3                 WHERE rm.system_id = mm3.system_id::text),
        (Select he_pressure_units   FROM mag.ge_mm4_units mm4                 WHERE rm.system_id = mm4.system_id::text),
        (Select mag_psia_units      FROM mag.siemens_units siemens            WHERE rm.system_id = siemens.system_id::text),
        (Select monitor_magnet_pressure_units  FROM mag.philips_mri_monitoring_data_units phil where rm.system_id = phil.system_id::text and monitor_magnet_pressure_units IS NOT NULL)
    ) AS rpp_units
FROM
    recent_files rm FULL
    JOIN systems ON rm.system_id = systems.id
WHERE
    systems.show_on_website = TRUE
    AND systems.process_mag = TRUE;