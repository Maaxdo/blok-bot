const axios = require("axios");
const WajerAxios = axios.create({
	baseURL: process.env.MAIN_API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

module.exports = {
	WajerAxios,
};
