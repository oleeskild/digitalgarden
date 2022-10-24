require("dotenv").config();
const axios = require("axios");


module.exports = async() => {
    let themeStyle = "";
    if (process.env.THEME) {
        const res = await axios.get(process.env.THEME)
        themeStyle = `<style>${res.data}</style>`;
    }
    const meta ={
        env: process.env.ELEVENTY_ENV,
        theme: process.env.THEME,
        themeStyle: themeStyle,
        baseTheme: process.env.BASE_THEME || "dark",
    };

    return meta;
};
