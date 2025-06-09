const axios = require("axios");

const OddsApiAxios = axios.create({
    baseURL: process.env.ODDS_API_BASE_URL,
    params: {
        apiKey: process.env.ODDS_API_KEY
    }
})

module.exports= {
    OddsApiAxios
}