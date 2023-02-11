require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const glob = require("glob");

module.exports = async () => {
  let baseUrl = process.env.SITE_BASE_URL || "";
  if (baseUrl && !baseUrl.startsWith("http")) {
    baseUrl = "https://" + baseUrl;
  }
  let themeStyle = glob.sync("src/site/styles/_theme.*.css")[0] || "";
  if (themeStyle) {
    themeStyle = themeStyle.split("site")[1];
  }
  let bodyClasses = [];
  let maturitySettings = {
    filetree: false,
    links: false,
    title: false,
    default: process.env.MATURITY_DEFAULT,
  };
  if (process.env.MATURITY_TITLE) {
    bodyClasses.push("title-maturity");
    maturitySettings.title = true;
  }
  if (process.env.MATURITY_FILETREE) {
    bodyClasses.push("filetree-maturity");
    maturitySettings.filetree = true;
  }
  if (process.env.MATURITY_INTERNAL_LINKS) {
    bodyClasses.push("links-maturity");
    maturitySettings.links = true;
  }
  const meta = {
    env: process.env.ELEVENTY_ENV,
    theme: process.env.THEME,
    themeStyle,
    bodyClasses: bodyClasses.join(" "),
    maturitySettings,
    baseTheme: process.env.BASE_THEME || "dark",
    siteName: process.env.SITE_NAME_HEADER || "Digital Garden",
    siteBaseUrl: baseUrl,
  };

  return meta;
};
