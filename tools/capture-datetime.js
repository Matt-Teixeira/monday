const { DateTime } = require("luxon");

const capture_datetime = (tz) => {
  return DateTime.now().setZone(tz);
};

module.exports = capture_datetime;
