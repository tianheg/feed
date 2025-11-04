# Cloudflare KV Setup for Saved Articles

This guide explains how to set up Cloudflare KV to store saved articles.

## Prerequisites

1. A Cloudflare account
2. Your site deployed on Cloudflare Pages
3. Wrangler CLI installed (optional, for local development)

## Setup Steps

### 1. Create KV Namespace

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **KV**
3. Click **Create a namespace**
4. Name it `SAVED_ARTICLES_KV` (or any name you prefer)
5. Copy the **Namespace ID** that appears

### 2. Configure wrangler.toml

1. Open `wrangler.toml` in the project root
2. Replace `YOUR_KV_NAMESPACE_ID` with the actual namespace ID from step 1:

```toml
[[kv_namespaces]]
binding = "SAVED_ARTICLES_KV"
id = "your-actual-namespace-id-here"
preview_id = "your-actual-namespace-id-here"
```

### 3. Link KV Namespace to Cloudflare Pages

If you're using Cloudflare Pages:

1. Go to your Pages project in the Cloudflare Dashboard
2. Navigate to **Settings** > **Functions**
3. Under **KV Namespace Bindings**, click **Add binding**
4. Set:
   - **Variable name**: `SAVED_ARTICLES_KV`
   - **KV namespace**: Select the namespace you created
5. Save

### 4. Deploy

Deploy your site to Cloudflare Pages. The Functions API will automatically be available at `/api/saved-articles`.

## API Endpoints

The function provides these endpoints:

- **GET** `/api/saved-articles?userId=<userId>` - Get all saved articles
- **POST** `/api/saved-articles` - Save an article
  ```json
  {
    "userId": "user_123",
    "article": {
      "id": "article-id",
      "title": "Article Title",
      "link": "https://...",
      "description": "...",
      "source": "..."
    }
  }
  ```
- **DELETE** `/api/saved-articles?userId=<userId>&articleId=<articleId>` - Remove an article

## User Identification

The system uses:
1. **Cookies** (primary) - Set by the server for persistence
2. **localStorage** (fallback) - Used if cookies aren't available
3. **Query parameter** - For direct API calls

## Local Development

To test locally with Wrangler:

```bash
# Install Wrangler (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Start local dev server
wrangler pages dev public
```

## Troubleshooting

### Function not working
- Check that the KV namespace is properly linked in Cloudflare Pages settings
- Verify the binding name matches: `SAVED_ARTICLES_KV`
- Check browser console for errors

### CORS issues
The function includes CORS headers. If you still see issues:
- Check that the function is deployed correctly
- Verify the API endpoint URL in the JavaScript

### Articles not saving
- Check browser console for API errors
- Verify the KV namespace has write permissions
- Check Cloudflare Dashboard > Workers & Pages > Logs for function errors

