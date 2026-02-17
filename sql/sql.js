const { QueryFile } = require("pg-promise");
const { join: joinPath } = require("path");

// HELPER FOR LINKING TO EXTERNAL QUERY FILES
const sql = (file) => {
  const fullPath = joinPath(__dirname, file); // GENERATING FULL PATH;
  return new QueryFile(fullPath, { minify: true });
};

module.exports = {
  get_acumatica_rtt_feed: {
    systems: sql("queries/get-acumatica_rtt_feed.sql")
  },
  insert_rtt_feed: {
    systems: sql("queries/insert-acumatica_rtt_feed.sql")
  },
  get_acumatica_rtt_feed_rmv: {
    systems: sql("queries/get-acumatica_rtt_feed_rmv.sql")
  },
  insert_rtt_feed_rmv: {
    systems: sql("queries/insert-acumatica_rtt_feed_rmv.sql")
  },
  get_he_level_all: {
    systems: sql("queries/get-he-level-all.sql")
  },
  get_he_pressure_all: {
    systems: sql("queries/get-he-pressure-all.sql")
  }
};
