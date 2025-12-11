const { default: axios } = require("axios");

const call_login = async () => {
  const api_uri = process.env.PROD_LOGIN_URI;
  try {
    const res = await axios.post(api_uri, {
      name: process.env.PROD_LOGIN_NAME,
      Password: process.env.PROD_LOGIN_PW,
      company: process.env.PROD_LOGIN_COMPANY
    });

    return res.headers;
  } catch (error) {
    console.log(error);
  }
};

module.exports = call_login;
