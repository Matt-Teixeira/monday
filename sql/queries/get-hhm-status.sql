SELECT
    sys.id AS system_id,
    sys.manufacturer,
    sys.modality,
    ohc.capture_datetime AS last_connection,
    ohc.rpp_host_datetime AS last_log_date,
    ohc.connection_error AS connectivity_error,
    ohc.host_intervention
FROM
    systems AS sys
    JOIN alert.offline_hhm_conn ohc ON ohc.system_id = sys.id
	WHERE sys.process_log IS TRUE;
