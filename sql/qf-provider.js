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

module.exports = {
  get_all_acumatica_rtt_feed,
  insert_db_rtt,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv
};
