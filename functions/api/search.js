//cloudflare(page-function) search function
//requires wrangler.toml at root directory for module syntax
//requires .node-version >16 at root directory for cloudflare(page-function)
const searchHandler = require('../../netlify/functions/search/search.js').handler;
export async function onRequest({ request, next}) {
    const response = await next();
    
    let requestQueryParams = Object.fromEntries(new URL(request.url).searchParams);
    
    let event = {queryStringParameters: requestQueryParams};
    
    let searchResponse = await searchHandler(event);
    
    const newResponse = new Response(searchResponse.body, { headers: {
            'content-type': 'application/json; charset=utf-8', 
            response,
        }
    });
    
    return newResponse;
}

