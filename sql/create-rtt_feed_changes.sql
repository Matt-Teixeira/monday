CREATE TABLE monday.rtt_feed_changes (
    id               BIGSERIAL   PRIMARY KEY,
    description      TEXT        NOT NULL,   -- system id (= Monday item name / OData Description)
    monday_item_id   TEXT        NOT NULL,   -- TOPICS/MISSING_DATA item the change was applied to
    board_id         TEXT        NOT NULL,
    group_id         TEXT        NOT NULL,   -- 'topics' or the MISSING_DATA group id
    column_id        TEXT        NOT NULL,   -- Monday column id, e.g. 'text_mkyfdta3'
    column_name      TEXT        NOT NULL,   -- human RTT_FEED config name, e.g. 'STATUS'
    before_value     TEXT,                   -- previous Monday value (normalized); may be ''/NULL
    after_value      TEXT,                   -- new OData value
    capture_datetime TIMESTAMPTZ NOT NULL,   -- the sync cap_datetime (groups one sync run)
    job_name         TEXT        NOT NULL,   -- 'delta_update_rtt_feed'
    inserted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rtt_feed_changes_description  ON monday.rtt_feed_changes (description);
CREATE INDEX idx_rtt_feed_changes_capture      ON monday.rtt_feed_changes (capture_datetime);
CREATE INDEX idx_rtt_feed_changes_column_name  ON monday.rtt_feed_changes (column_name);
