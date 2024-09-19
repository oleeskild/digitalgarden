---
{"dg-publish":true,"dg-note-icon":4,"permalink":"/🌒Action_行动/Blog/Vuepress/Vuepress调试报错/","dgPassFrontmatter":true,"noteIcon":4,"created":"2024-09-02T20:06:35.888+08:00","updated":"2024-09-02T20:18:53.521+08:00"}
---

调试Vuepress搭建博客时
执行“npm run docs:dev”时报错
```
npm error code EJSONPARSE
npm error JSON.parse Invalid package.json: JSONParseError: Unexpected non-whitespace character after JSON at position 572 while parsing near "...r\": \"^14.2.1\"\n  }\n}\n\"scripts\": {\n  ...,\n..."
npm error JSON.parse Failed to parse JSON data.
npm error JSON.parse Note: package.json must be actual JSON, not just JavaScript.
npm error A complete log of this run can be found in: C:\Users\Administrator\AppData\Local\npm-cache\_logs\2024-09-02T12_03_47_800Z-debug-0.log
```
检查package.json，保证里面的命令时json可执行命令，末行不要有空行。
正确的package.json文件
```
{

  "name": "vuepress",

  "description": "vuepress blog",

  "version": "2.0.0",

  "license": "MIT",

  "type": "module",

  "scripts": {

    "deploy": "bash deploy.sh",

    "docs:build": "vuepress-webpack build src",

    "docs:clean-dev": "vuepress-webpack dev src --clean-cache",

    "docs:dev": "vuepress-webpack dev src",

    "docs:update-package": "npx vp-update"

  },

  "devDependencies": {

    "@vuepress/bundler-webpack": "2.0.0-rc.14",

    "vue": "^3.4.31",

    "vuepress": "2.0.0-rc.14",

    "vuepress-theme-hope": "2.0.0-rc.52",

    "sass-loader": "^14.2.1"

  }

}
```