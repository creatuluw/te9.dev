# Next Steps

Your Raindrop → Blog pipeline is ready. Follow these steps to get started.

## Your Initial API Key

```
bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4
```

Use this in URL params: `?key=bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4`

---

## 1. Get Raindrop Refresh Token

You need to complete the OAuth flow once to get a refresh token.

### Option A: Manual OAuth Flow

1. Visit this URL in your browser:
```
https://raindrop.io/oauth/authorize?redirect_uri=http://localhost:5173/api/auth/callback&client_id=69989384f8451439c98352ef
```

2. Authorize the app

3. You'll be redirected to a URL like:
```
http://localhost:5173/api/auth/callback?code=XXXXXX
```

4. Copy the `code` parameter

5. Exchange it for tokens:
```bash
curl -X POST https://raindrop.io/oauth/access_token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "69989384f8451439c98352ef",
    "client_secret": "8bd3669b-b248-4370-9d8b-ab813f1e2146",
    "grant_type": "authorization_code",
    "code": "YOUR_CODE_HERE",
    "redirect_uri": "http://localhost:5173/api/auth/callback"
  }'
```

6. Copy the `refresh_token` from the response

### Option B: Use Raindrop Settings

1. Go to https://app.raindrop.io/settings/integrations
2. Find your app and check if there's a way to get tokens directly

---

## 2. Configure Environment Variables

Edit `.env` in the project root:

```env
DATABASE_URL=postgresql://postgres:QWvgNTqzfNibSLhAIcBSCMKFMbSWqOdD@monorail.proxy.rlwy.net:37604/railway

# Raindrop.io
RAINDROP_CLIENT_ID=69989384f8451439c98352ef
RAINDROP_CLIENT_SECRET=8bd3669b-b248-4370-9d8b-ab813f1e2146
RAINDROP_REFRESH_TOKEN=your_refresh_token_here

# AI Provider (choose one)
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-your-key-here
AI_MODEL=claude-sonnet-4-20250514

# For OpenAI:
# AI_PROVIDER=openai
# AI_API_KEY=sk-your-key-here
# AI_MODEL=gpt-4o

# For OpenRouter:
# AI_PROVIDER=openrouter
# AI_API_KEY=sk-or-your-key-here
# AI_MODEL=anthropic/claude-sonnet-4

SITE_URL=http://localhost:5173
```

---

## 3. Start the App

```bash
npm run dev
```

The server will start at `http://localhost:5173`

---

## 4. Access the UI

### Bookmarks Dashboard
```
http://localhost:5173/bookmarks?key=bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4
```

- View all synced bookmarks (last 30 days by default)
- Filter by category
- Click a card to edit

### Drafts Dashboard
```
http://localhost:5173/drafts?key=bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4
```

- Review AI-generated drafts
- Approve, reject, or request changes
- Publish approved drafts to the blog

---

## 5. Sync Bookmarks

### Automatic
The app polls Raindrop every 4 hours automatically.

### Manual
```bash
curl -X POST "http://localhost:5173/api/sync?key=bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4"
```

---

## 6. Generate a Blog Draft

1. Go to a bookmark's edit page
2. Fill in "Reason for Bookmark" (helps AI generate better content)
3. Toggle "Approved for blog post"
4. Click "Generate Blog Draft"

Or via API:
```bash
curl -X POST "http://localhost:5173/api/generate/1?key=bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4"
```

---

## 7. Publish a Draft

1. Review the draft in `/drafts`
2. Approve it
3. Click "Publish to Blog"
4. The draft becomes a markdown file in `/posts/`

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bookmarks` | GET | List bookmarks (?days=30&category=Tech) |
| `/api/bookmarks/:id` | GET/PATCH/DELETE | CRUD single bookmark |
| `/api/drafts` | GET | List drafts (?status=pending) |
| `/api/drafts/:id` | GET/PATCH/DELETE | CRUD single draft |
| `/api/drafts/:id/publish` | POST | Publish approved draft |
| `/api/generate/:id` | POST | Generate draft from bookmark |
| `/api/sync` | POST | Trigger Raindrop sync |
| `/api/categories` | GET/POST | List/create categories |
| `/api/config` | GET/PATCH | App settings |
| `/api/auth/key` | POST | Generate new API key |
| `/api/auth/keys` | GET | List all API keys |
| `/api/auth/keys/:id` | DELETE | Revoke API key |

All endpoints require `?key=YOUR_API_KEY` in the URL.

---

## Generate New API Keys

```bash
curl -X POST "http://localhost:5173/api/auth/key?key=bm9kZS1ibG9nLWFwaS1rZXktMjAyNS0wcHg4" \
  -H "Content-Type: application/json" \
  -d '{"name": "My New Key"}'
```

---

## Troubleshooting

### "AI configuration not found"
Set `AI_PROVIDER` and `AI_API_KEY` in `.env`, then restart the server.

### "Missing Raindrop.io credentials"
Set `RAINDROP_REFRESH_TOKEN` in `.env`.

### Database connection errors
Check `DATABASE_URL` in `.env` matches your Railway PostgreSQL connection string.

### Type errors in editor
Run `npm run dev` once to generate SvelteKit types.
