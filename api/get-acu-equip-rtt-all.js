const { default: axios } = require("axios");

const get_acu_equip_rtt_all = async () => {
  const odata_url = process.env.PROD_EQUIPMENT_ALL_URI;
  try {
    const res = await axios.get(odata_url, {
      auth: {
        username: process.env.PROD_LOGIN_NAME,
        password: process.env.PROD_LOGIN_PW
      },
      headers: {
        Accept: "application/json"
      }
    });

    return res.data;
  } catch (error) {
    console.error("OData error:", error.response?.status, error.response?.data);
    throw error;
  }
};

module.exports = get_acu_equip_rtt_all;
