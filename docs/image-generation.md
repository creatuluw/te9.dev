# Image Generation with z.ai API

Generate images using the z.ai GLM image model.

## API Endpoint

```
POST https://api.z.ai/api/paas/v4/images/generations
```

## Authentication

Get your API token from z.ai and include it in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Request

```bash
curl --request POST \
  --url https://api.z.ai/api/paas/v4/images/generations \
  --header 'Authorization: Bearer <your-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "glm-image",
    "prompt": "A cute little kitten sitting on a sunny windowsill, with the background of blue sky and white clouds.",
    "size": "1280x1280"
  }'
```

## Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `model`   | string | Model to use: `glm-image` |
| `prompt`  | string | Text description of the image to generate |
| `size`    | string | Image dimensions: `1280x1280` |

## Response

```json
{
  "created": 1771630878,
  "data": [
    {
      "url": "https://mfile.z.ai/..."
    }
  ],
  "id": "2026022107411862b5909147844db3",
  "request_id": "2026022107411862b5909147844db3"
}
```

## Download the Image

```bash
curl -L -o output.png "<image-url-from-response>"
```

## Full Example

```bash
# Generate image
RESPONSE=$(curl -s --request POST \
  --url https://api.z.ai/api/paas/v4/images/generations \
  --header 'Authorization: Bearer <your-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "glm-image",
    "prompt": "A cute little kitten sitting on a sunny windowsill",
    "size": "1280x1280"
  }')

# Extract URL and download
IMAGE_URL=$(echo "$RESPONSE" | jq -r '.data[0].url')
curl -L -o generated-image.png "$IMAGE_URL"
```

## Notes

- Images may include watermarks
- Response time is typically 30-45 seconds
- Save your API token securely (use environment variables, not hardcoded strings)
