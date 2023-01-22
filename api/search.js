//vercel search function
const searchHandler = require('../netlify/functions/search/search.js').handler;
async function vercelSearch(request, response) {
    let event = {queryStringParameters: request.query};

    let searchResponse = await searchHandler(event);

    return response.status(200).json(JSON.parse(searchResponse.body));
  }

exports.default = vercelSearch;