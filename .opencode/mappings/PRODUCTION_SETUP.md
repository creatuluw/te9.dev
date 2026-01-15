# Production Setup Guide

This document covers the production configuration for OpenMemory access via MCP server in the te9.dev development environment.

## Table of Contents

- [Current Production Setup](#current-production-setup)
- [Configuration Details](#configuration-details)
- [Production vs Development](#production-vs-development)
- [Migration to Production](#migration-to-production)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Current Production Setup

### OpenMemory MCP Server

**Endpoint:** `https://openmemory-production-f483.up.railway.app/mcp`

**Host:** Railway (managed cloud platform)

**Access Method:** MCP (Model Context Protocol) via opencode.json configuration

**Status:** Production (live, actively serving requests)

---

## Configuration Details

### opencode.json Configuration

The OpenMemory MCP server is configured in the project's `opencode.json` file:

```json
{
  "mcp": {
    "openmemory": {
      "type": "remote",
      "url": "https://openmemory-production-f483.up.railway.app/mcp"
    }
  }
}
```

**Key Configuration Parameters:**

| Parameter | Value | Description |
|-----------|---------|-------------|
| `type` | `remote` | Access OpenMemory via remote MCP server (not local) |
| `url` | `https://openmemory-production-f483.up.railway.app/mcp` | Full MCP endpoint URL including `/mcp` path |

### Session Variables

For production access, the following session variables are configured:

| Variable | Value | Purpose |
|-----------|---------|-----------|
| `{{PROJECT_FOLDER_NAME}}` | Folder name (e.g., "te9.dev", "myproject") | Project context isolation |
| `{{OPENMEMORY_API_URL}}` | `https://openmemory-production-f483.up.railway.app/mcp` | MCP endpoint URL |
| `{{OPENMEMORY_API_KEY}}` | `null` | Not needed for MCP (auth handled by connection) |

**See:** `[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)` for complete variable setup.

---

## Production vs Development

### Development Setup (Local)

```json
{
  "mcp": {
    "openmemory": {
      "type": "local",
      "command": ["node", "server.js"]
    }
  }
}
```

**Characteristics:**
- Local execution of OpenMemory server
- Full control over server code and data
- Requires local dependencies and setup
- Direct file system access to memory storage
- Faster response times (no network latency)
- Suitable for development and testing

### Production Setup (Remote)

```json
{
  "mcp": {
    "openmemory": {
      "type": "remote",
      "url": "https://openmemory-production-f483.up.railway.app/mcp"
    }
  }
}
```

**Characteristics:**
- Remote server accessed via network
- Managed hosting (Railway)
- Zero local setup required
- Cloud-based memory storage
- Network latency affects response times
- Suitable for production and shared environments

**Comparison:**

| Aspect | Development (Local) | Production (Remote) |
|---------|---------------------|---------------------|
| Setup | Requires installation | Zero setup |
| Data Storage | Local files | Cloud database |
| Access | Direct | Network |
| Performance | Fastest | Fast (with latency) |
| Reliability | Depends on local system | High (managed) |
| Backup | Manual | Automatic |
| Multi-project | Isolated per setup | Shared context via user_id |
| Cost | None | Included in Railway plan |

---

## Migration to Production

### When to Migrate

Consider migrating to production when:
- ✅ Ready to use persistent, cloud-based memory storage
- ✅ Need memory access across multiple machines/environments
- ✅ Want managed reliability and backups
- ✅ Ready for production-level workflows
- ✅ Testing phase complete

### Migration Steps

1. **Update opencode.json**

   Change MCP configuration from local to remote:

   ```json
   // Before (local)
   {
     "mcp": {
       "openmemory": {
         "type": "local",
         "command": ["node", "server.js"]
       }
     }
   }

   // After (production)
   {
     "mcp": {
       "openmemory": {
         "type": "remote",
         "url": "https://openmemory-production-f483.up.railway.app/mcp"
       }
     }
   }
   ```

2. **Restart MCP Connection**

   - Reload opencode.json configuration
   - MCP server will automatically connect to production endpoint
   - No manual restart required in most editors

3. **Verify Connection**

   ```bash
   # Check MCP server status
   curl https://openmemory-production-f483.up.railway.app/health
   
   # Test memory operations
   # Use any OpenMemory tool function
   openmemory_openmemory_query({
     query: "test",
     user_id: "{{PROJECT_FOLDER_NAME}}"
   })
   ```

4. **Update Session Variables**

   Ensure session uses correct variables:

   ```javascript
   const SESSION = {
     PROJECT_FOLDER_NAME: "te9.dev",
     OPENMEMORY_API_URL: "https://openmemory-production-f483.up.railway.app/mcp",
     OPENMEMORY_API_KEY: null  // Not needed for MCP
   }
   ```

### Data Migration

**Important:** Local and production memories are NOT automatically synchronized.

**Options:**

1. **Start Fresh (Recommended for Production)**
   - Begin with empty memory space
   - Let production build context from actual usage
   - Avoid importing outdated local memories

2. **Manual Export/Import (If Needed)**
   - Export local memories to JSON format
   - Import relevant memories to production
   - Requires custom script or manual operations

---

## Verification

### Connection Verification

**Test 1: MCP Server Health**

```bash
# Check if MCP endpoint is accessible
curl -I https://openmemory-production-f483.up.railway.app/mcp

# Expected response:
# HTTP/2 200
# content-type: application/json
```

**Test 2: Memory Query Operation**

```javascript
// Test query operation
const result = openmemory_openmemory_query({
  query: "production test",
  limit: 5,
  user_id: "{{PROJECT_FOLDER_NAME}}"
})

// Verify result structure
if (result.success && result.memories) {
  console.log("✅ Production query successful")
} else {
  console.error("❌ Production query failed")
}
```

**Test 3: Memory Store Operation**

```javascript
// Test store operation
const result = openmemory_openmemory_store({
  content: "Production setup verification test",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  tags: ["test", "production"]
})

// Verify result structure
if (result.success && result.memoryId) {
  console.log("✅ Production store successful, memory ID:", result.memoryId)
} else {
  console.error("❌ Production store failed")
}
```

**Test 4: User Isolation**

```javascript
// Verify project context isolation
const result1 = openmemory_openmemory_query({
  query: "test",
  user_id: "te9.dev"
})

const result2 = openmemory_openmemory_query({
  query: "test",
  user_id: "myproject"
})

// Verify different results for different user_ids
if (JSON.stringify(result1) !== JSON.stringify(result2)) {
  console.log("✅ User isolation working correctly")
} else {
  console.warn("⚠️ User isolation may not be working")
}
```

---

## Troubleshooting

### Issue: MCP Connection Failed

**Symptoms:**
- OpenMemory tools show connection errors
- Timeout when calling memory operations
- "MCP server unreachable" errors

**Solutions:**

1. **Check Network Connectivity**
   ```bash
   # Test basic connectivity
   ping openmemory-production-f483.up.railway.app
   
   # Test HTTP access
   curl https://openmemory-production-f483.up.railway.app/health
   ```

2. **Verify Configuration**
   ```json
   // Check opencode.json
   {
     "mcp": {
       "openmemory": {
         "type": "remote",
         "url": "https://openmemory-production-f483.up.railway.app/mcp"
       }
     }
   }
   ```

3. **Check Railway Status**
   - Visit Railway dashboard: https://railway.app
   - Verify OpenMemory service is running
   - Check for recent deployments or incidents

4. **Restart MCP Connection**
   - Reload opencode.json in your editor
   - Restart the MCP server (if applicable)
   - Clear MCP cache (editor-dependent)

---

### Issue: Slow Response Times

**Symptoms:**
- Memory queries take >2 seconds
- Noticeable delay before store operations complete

**Causes:**
- Network latency to Railway
- Large result sets
- Complex queries with many relationships

**Solutions:**

1. **Optimize Query Limits**
   ```javascript
   // Reduce limit for faster responses
   openmemory_openmemory_query({
     query: "specific topic",
     limit: 10,  // Start with smaller limit
     user_id: "{{PROJECT_FOLDER_NAME}}"
   })
   ```

2. **Use Specific Sectors**
   ```javascript
   // Query specific sector instead of all
   openmemory_openmemory_query({
     query: "decisions",
     sector: "semantic",  // Reduces search space
     limit: 15,
     user_id: "{{PROJECT_FOLDER_NAME}}"
   })
   ```

3. **Check Network Conditions**
   - Test network speed to Railway
   - Consider geographic location vs server location
   - Check for network congestion

---

### Issue: Authentication Errors

**Symptoms:**
- "Authentication required" errors
- "Invalid API key" messages
- Access denied errors

**Solutions:**

1. **Verify MCP Configuration**
   - Check `type` is `remote`, not `local`
   - Verify URL is correct (including `/mcp` path)
   - Ensure no typos in domain name

2. **Check MCP Server Status**
   - Verify Railway service is running
   - Check for authentication changes on server
   - Review recent deployment logs

3. **Update opencode.json**
   ```json
   {
     "mcp": {
       "openmemory": {
         "type": "remote",
         "url": "https://openmemory-production-f483.up.railway.app/mcp"
       }
     }
   }
   ```

---

### Issue: Missing Memories After Migration

**Symptoms:**
- Memories from local setup don't appear
- Empty query results after switching to production

**Causes:**
- Local and production memories are separate
- No automatic synchronization
- Different user_id context

**Solutions:**

1. **Accept Fresh Start (Recommended)**
   - Production builds new memory context
   - Previous local memories may be outdated
   - Let production learn from actual usage

2. **Manual Import (If Essential)**
   ```javascript
   // Export from local (if still accessible)
   const localMemories = getAllLocalMemories()
   
   // Import to production
   localMemories.forEach(memory => {
     openmemory_openmemory_store({
       content: memory.content,
       user_id: "{{PROJECT_FOLDER_NAME}}",
       tags: memory.tags,
       metadata: { ...memory.metadata }
     })
   })
   ```

3. **Verify user_id Consistency**
   ```javascript
   // Ensure using same PROJECT_FOLDER_NAME
   console.log("Current user_id:", PROJECT_FOLDER_NAME)
   
   // Should match your project folder name
   // e.g., "te9.dev", "myproject", etc.
   ```

---

## Best Practices

### 1. Use Production for Active Development

**When to use production:**
- Daily development workflows
- Feature implementation and testing
- PRD execution and tracking
- Long-term projects requiring persistence

**When to use local:**
- Testing OpenMemory features
- Development of OpenMemory itself
- Isolated experiments
- Network-restricted environments

### 2. Monitor Connection Health

**Regular Checks:**
- Test query operation weekly
- Verify store operation success
- Check Railway dashboard for incidents
- Monitor response times

**Health Check Script:**
```javascript
function checkProductionHealth() {
  const start = Date.now()
  
  try {
    const result = openmemory_openmemory_query({
      query: "health check",
      limit: 1,
      user_id: "{{PROJECT_FOLDER_NAME}}"
    })
    
    const duration = Date.now() - start
    console.log(`✅ Health check passed in ${duration}ms`)
    return true
  } catch (error) {
    console.error("❌ Health check failed:", error.message)
    return false
  }
}

// Run health check
checkProductionHealth()
```

### 3. Maintain user_id Consistency

**Critical:** Always use the same `{{PROJECT_FOLDER_NAME}}` for a given project.

**Examples:**
- Working in `E:/projects/te9.dev` → Always use `{{PROJECT_FOLDER_NAME}} = "te9.dev"`
- Working in `/home/user/myproject` → Always use `{{PROJECT_FOLDER_NAME}} = "myproject"`

**Validation:**
```javascript
function validateUserId(user_id) {
  const errors = []
  
  if (!user_id) {
    errors.push("user_id is undefined")
  } else if (user_id.includes("/") || user_id.includes("\\")) {
    errors.push("user_id contains path separators - use folder name only")
  } else if (user_id === "default" || user_id === "user123") {
    errors.push("user_id is using generic ID - use project folder name")
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid user_id:\n${errors.join("\n")}`)
  }
  
  return true
}

// Validate before operations
validateUserId("{{PROJECT_FOLDER_NAME}}")
```

### 4. Handle Network Failures Gracefully

**Retry Logic:**
```javascript
async function queryWithRetry(query, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await openmemory_openmemory_query({
        query: query,
        user_id: "{{PROJECT_FOLDER_NAME}}"
      })
      return result
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      console.warn(`Query attempt ${attempt} failed, retrying...`)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

### 5. Backup Critical Context

**Important Memories:**
- Critical decisions
- User preferences
- Major architectural choices

**Backup Strategy:**
```javascript
// Periodically export important memories
function backupCriticalMemories() {
  const result = openmemory_openmemory_query({
    query: "critical decision OR user preference OR architecture",
    user_id: "{{PROJECT_FOLDER_NAME}}",
    min_score: 0.8
  })
  
  // Save to local file
  const fs = require('fs')
  fs.writeFileSync(
    './memory-backup.json',
    JSON.stringify(result.memories, null, 2)
  )
  
  console.log(`Backed up ${result.memories.length} critical memories`)
}

// Run backup weekly
backupCriticalMemories()
```

---

## Production Features

### Managed Services

**Railway provides:**
- ✅ Automatic scaling
- ✅ Health monitoring
- ✅ Automated backups
- ✅ SSL/TLS encryption
- ✅ DDoS protection
- ✅ 99.9% uptime SLA

### Performance

**Expected Response Times:**
- Simple query: 200-500ms
- Complex query with relationships: 500-1500ms
- Memory store: 100-300ms
- Memory reinforcement: 50-150ms

**Optimization Tips:**
- Use specific sectors when possible
- Limit result sets to needed size
- Avoid redundant queries (cache results)
- Batch related operations

---

## Security Considerations

### MCP Authentication

**Current Setup:**
- MCP connection handles authentication
- No API key required in opencode.json
- Authentication managed by Railway deployment

**Best Practices:**
- Never share opencode.json with sensitive configurations
- Keep Railway deployment credentials secure
- Monitor for unauthorized access
- Review MCP connection logs

### Data Privacy

**Production Storage:**
- Memories stored in Railway database
- Encrypted at rest
- Access controlled by user_id
- No cross-project data leakage

**Compliance:**
- GDPR-ready data handling
- Data export capabilities
- Right to deletion support

---

## Support and Maintenance

### Documentation Resources

- **[OpenMemory API Documentation](https://openmemory.cavira.app/docs/api/routes)** - Complete API reference
- **[Railway Dashboard](https://railway.app)** - Server status and logs
- **[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)** - Session variable setup
- **[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)** - API endpoint mappings

### Getting Help

**If issues persist:**
1. Check this troubleshooting section
2. Review Railway deployment logs
3. Verify opencode.json configuration
4. Test basic connectivity to MCP endpoint
5. Report issue with environment details

---

## Summary

**Current Production Setup:**
- **Endpoint:** `https://openmemory-production-f483.up.railway.app/mcp`
- **Access Method:** MCP (remote type)
- **Configuration:** opencode.json → `mcp.openmemory.url`
- **Authentication:** Handled by MCP connection
- **Data Storage:** Railway cloud database

**Key Variables:**
- `{{PROJECT_FOLDER_NAME}}` - Project folder name (MUST use for user_id)
- `{{OPENMEMORY_API_URL}}` - MCP endpoint URL
- `{{OPENMEMORY_API_KEY}}` - Not needed for MCP

**Benefits of Production:**
- Zero local setup required
- Managed reliability and backups
- Cloud-based memory access
- Automatic scaling and monitoring
- Production-grade performance

**Remember:** Always use `{{PROJECT_FOLDER_NAME}}` as `user_id` parameter to maintain proper project context isolation in production.