require("dotenv").config();
module.exports = {
    env: process.env.ELEVENTY_ENV,
    theme: process.env.THEME,
    baseTheme: process.env.BASE_THEME || "dark"
};