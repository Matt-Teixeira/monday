const { default: axios } = require("axios");

const get_acu_equip_rtt = async () => {
  const odate_url = process.env.PROD_EQUIPMENT_URI;
  try {
    const res = await axios.get(odate_url, {
      // Axios will build the Basic Authorization header for you
      auth: {
        username: process.env.PROD_LOGIN_NAME, // e.g. "admin" or "admin@TenantName"
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

module.exports = get_acu_equip_rtt;
