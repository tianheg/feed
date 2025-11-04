/**
 * Cloudflare Pages Function for managing saved articles in KV
 * Single user - no user identification needed
 * 
 * GET /api/saved-articles
 *   - Returns all saved articles
 * 
 * POST /api/saved-articles
 *   - Body: { article: object }
 *   - Saves an article
 * 
 * DELETE /api/saved-articles?articleId=<articleId>
 *   - Removes an article from saved list
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const KV = env.SAVED_ARTICLES_KV;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    switch (method) {
      case 'GET':
        return handleGet(KV, corsHeaders);
      
      case 'POST':
        return handlePost(request, KV, corsHeaders);
      
      case 'DELETE':
        const articleId = url.searchParams.get('articleId');
        return handleDelete(articleId, KV, corsHeaders);
      
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Get all saved articles
 */
async function handleGet(KV, corsHeaders) {
  const key = 'saved_articles';
  const data = await KV.get(key);
  
  if (!data) {
    return new Response(JSON.stringify({ articles: [] }), {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  const articles = JSON.parse(data);
  return new Response(JSON.stringify({ articles }), {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Save an article
 */
async function handlePost(request, KV, corsHeaders) {
  const body = await request.json();
  const { article } = body;
  
  if (!article || !article.id) {
    return new Response(JSON.stringify({ error: 'Article data is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  
  const key = 'saved_articles';
  const existingData = await KV.get(key);
  let articles = existingData ? JSON.parse(existingData) : [];
  
  // Check if article already exists
  const existingIndex = articles.findIndex(a => a.id === article.id);
  if (existingIndex !== -1) {
    // Update existing article
    articles[existingIndex] = {
      ...article,
      savedAt: articles[existingIndex].savedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new article
    articles.push({
      ...article,
      savedAt: new Date().toISOString(),
    });
  }
  
  // Save to KV
  await KV.put(key, JSON.stringify(articles));
  
  return new Response(JSON.stringify({ 
    success: true, 
    articles
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Delete an article from saved list
 */
async function handleDelete(articleId, KV, corsHeaders) {
  if (!articleId) {
    return new Response(JSON.stringify({ error: 'Article ID is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  
  const key = 'saved_articles';
  const existingData = await KV.get(key);
  
  if (!existingData) {
    return new Response(JSON.stringify({ articles: [] }), {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  let articles = JSON.parse(existingData);
  articles = articles.filter(a => a.id !== articleId);
  
  // Save updated list
  await KV.put(key, JSON.stringify(articles));
  
  return new Response(JSON.stringify({ 
    success: true, 
    articles
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

