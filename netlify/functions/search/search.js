const lunrjs = require('lunr');

const handler = async (event) => {
  try {

    const search = event.queryStringParameters.term;
    if(!search) throw('Missing term query parameter');

    const data = require('./data.json');
    const indexJson = require('./index.json');
    const index = lunrjs.Index.load(indexJson);
    console.log('index made');

    let results =
      search[0] == "#" && search.length > 1
        ? index.search(`tags:${search.substring(1)}`)
        : index.search(search);

    results.forEach(r => {
      r.title = data[r.ref].title;
      r.content = truncate(data[r.ref].content, 400);
      r.date = data[r.ref].date;
      r.url = data[r.ref].url;
      r.tags = data[r.ref].tags.filter(x=>x!="gardenEntry" && x!="note");//Note is automatically added by 11ty. GardenEntry is used internally to mark the home page
      
      delete r.ref;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(results),
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

function truncate(str, size) {
  //first, remove HTML
  str = str.replace(/<.*?>/g, '');
  if(str.length < size) return str;
  return str.substring(0, size-3) + '...';
}

module.exports = { handler }
