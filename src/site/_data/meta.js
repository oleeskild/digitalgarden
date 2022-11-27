require("dotenv").config();
const axios = require("axios");


module.exports = async() => {
    let themeStyle = "";
    let themeUrl = process.env.THEME;
    if (themeUrl) {
        //https://forum.obsidian.md/t/1-0-theme-migration-guide/42537
        //Not all themes with no legacy mark have a theme.css file, so we need to check for it
        try{
            await axios.get(themeUrl);
        }catch{
            if(themeUrl.indexOf("theme.css") > -1){
                themeUrl = themeUrl.replace("theme.css", "obsidian.css");
            }
            else if(themeUrl.indexOf("obsidian.css") > -1){
                themeUrl = themeUrl.replace("obsidian.css", "theme.css");
            }
        }

        const res = await axios.get(themeUrl);
        themeStyle = `<style>${res.data}</style>`;
    }
    const meta ={
        env: process.env.ELEVENTY_ENV,
        theme: process.env.THEME,
        themeStyle: themeStyle,
        baseTheme: process.env.BASE_THEME || "dark",
        siteName: process.env.SITE_NAME_HEADER || "Digital Garden",
    };

    return meta;
};
