const get_board_info = require("./get_board_info");
const MRI_REPORT_ID = process.env.MONDAY_BOARD_ID_1;
const ALERT_MATRIX_ID = process.env.MONDAY_BOARD_ID_2;

async function update_mri_report() {
  const alert_matrix = await get_board_info(ALERT_MATRIX_ID);

  console.log("\nalert_matrix");
  for (let group of alert_matrix.groups) {
    console.log("\n");
    console.log(group.title);
    for (let item of group.items_page.items) {
      console.log(item);
    }
  }
}

module.exports = update_mri_report;
