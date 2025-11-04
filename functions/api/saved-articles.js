/**
 * Cloudflare Pages Function for managing saved articles in KV
 * 
 * GET /api/saved-articles?userId=<userId>
 *   - Returns all saved articles for the user
 * 
 * POST /api/saved-articles
 *   - Body: { userId: string, article: object }
 *   - Saves an article for the user
 * 
 * DELETE /api/saved-articles?userId=<userId>&articleId=<articleId>
 *   - Removes an article from saved list
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const KV = env.SAVED_ARTICLES_KV;

  // Get or create user ID from cookie or query parameter
  let userId = getUserId(request);

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
        return handleGet(userId, KV, corsHeaders);
      
      case 'POST':
        return handlePost(request, userId, KV, corsHeaders);
      
      case 'DELETE':
        const articleId = url.searchParams.get('articleId');
        return handleDelete(userId, articleId, KV, corsHeaders);
      
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
 * Get user ID from cookie or generate one
 */
function getUserId(request) {
  const url = new URL(request.url);
  let userId = url.searchParams.get('userId');
  
  if (!userId) {
    // Try to get from cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('='))
      );
      userId = cookies['userId'];
    }
  }
  
  // Generate a new user ID if none exists
  if (!userId) {
    userId = generateUserId();
  }
  
  return userId;
}

/**
 * Generate a unique user ID
 */
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get all saved articles for a user
 */
async function handleGet(userId, KV, corsHeaders) {
  const key = `saved_articles:${userId}`;
  const data = await KV.get(key);
  
  if (!data) {
    return new Response(JSON.stringify({ articles: [], userId }), {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  const articles = JSON.parse(data);
  return new Response(JSON.stringify({ articles, userId }), {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Save an article for a user
 */
async function handlePost(request, userId, KV, corsHeaders) {
  const body = await request.json();
  const { article } = body;
  
  if (!article || !article.id) {
    return new Response(JSON.stringify({ error: 'Article data is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  
  const key = `saved_articles:${userId}`;
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
    articles,
    userId 
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Set-Cookie': `userId=${userId}; Path=/; Max-Age=31536000; SameSite=Lax`,
    },
  });
}

/**
 * Delete an article from saved list
 */
async function handleDelete(userId, articleId, KV, corsHeaders) {
  if (!articleId) {
    return new Response(JSON.stringify({ error: 'Article ID is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  
  const key = `saved_articles:${userId}`;
  const existingData = await KV.get(key);
  
  if (!existingData) {
    return new Response(JSON.stringify({ articles: [], userId }), {
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
    articles,
    userId 
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

