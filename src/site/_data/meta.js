require("dotenv").config();
let themeStyle = "";
if (process.env.THEME) {
    fetch(process.env.THEME).then(response => response.text()).then(text => {
        themeStyle = "<style>" + text + "</style>";
    });
}
module.exports = {
    env: process.env.ELEVENTY_ENV,
    theme: process.env.THEME,
    themeStyle: themeStyle,
    baseTheme: process.env.BASE_THEME || "dark"
};