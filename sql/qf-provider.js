const db = require("../db/pgPool");
const {
  get_acumatica_rtt_feed,
  insert_rtt_feed,
  insert_rtt_feed_rmv,
  get_acumatica_rtt_feed_rmv
} = require("./sql");

const get_all_acumatica_rtt_feed = async () => {
  try {
    return db.any(get_acumatica_rtt_feed.systems);
  } catch (error) {
    console.log(error);
  }
};

const insert_db_rtt = async (args) => {
  try {
    return db.any(insert_rtt_feed.systems, args);
  } catch (error) {
    console.log(error);
  }
};

const get_all_acumatica_rtt_feed_rmv = async () => {
  try {
    return db.any(get_acumatica_rtt_feed_rmv.systems);
  } catch (error) {
    console.log(error);
  }
};

const insert_db_rtt_rmv = async (args) => {
  try {
    return db.any(insert_rtt_feed_rmv.systems, args);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Convert a system object to values array and insert to DB
 * Handles null/undefined normalization for all properties
 *
 * @param {Object} system - RTT system object from API
 * @param {string} captureDatetime - ISO datetime string for capture_datetime
 * @returns {Promise<void>}
 */
const insertNewRttSystem = async (system, captureDatetime) => {
  const systemWithCapture = { ...system, capture_datetime: captureDatetime };
  const values = [];

  for (const prop in systemWithCapture) {
    const val = systemWithCapture[prop];
    if (val === null || val === undefined) {
      values.push(null);
    } else {
      values.push(String(val).trim());
    }
  }

  return insert_db_rtt(values);
};

module.exports = {
  get_all_acumatica_rtt_feed,
  insert_db_rtt,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv,
  insertNewRttSystem
};
