const fetch = require("node-fetch");

const get_acu_equip_rtt_all = async () => {
  const odata_url = process.env.PROD_EQUIPMENT_ALL_URI;
  try {
    const res = await fetch(odata_url, {
      headers: {
        Accept: "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.PROD_LOGIN_NAME + ":" + process.env.PROD_LOGIN_PW
          ).toString("base64")
      }
    });

    if (!res.ok) {
      const body = await res.text();
      const error = new Error(`OData request failed: ${res.status}`);
      error.response = { status: res.status, data: body };
      throw error;
    }

    return await res.json();
  } catch (error) {
    console.error("OData error:", error.response?.status, error.response?.data);
    throw error;
  }
};

module.exports = get_acu_equip_rtt_all;
