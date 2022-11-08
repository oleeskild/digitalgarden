require("dotenv").config()
const lunrjs = require('lunr');
const path = require('path');

function createIndex(posts) {
  return lunrjs(function () {
    this.ref('id');
    this.field('title');
    this.field('content');
    this.field('date');

    posts.forEach((p, idx) => {
      p.id = idx;
      this.add(p);
    });
  });
}

const data = require('../../netlify/functions/search/data.json');
const index = createIndex(data);
require('fs').writeFileSync(path.join(__dirname, '../../netlify/functions/search/index.json'), JSON.stringify(index));
