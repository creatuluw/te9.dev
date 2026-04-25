# Messaging System Documentation

**Date Created:** 2025-11-07  
**Last Updated:** 2025-11-07  
**Status:** ✅ Implemented  
**Related Feature:** Business Process Management - User Communications

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Service Layer](#service-layer)
5. [Frontend Components](#frontend-components)
6. [Message Flow](#message-flow)
7. [Email Integration](#email-integration)
8. [Current Status](#current-status)
9. [Usage Examples](#usage-examples)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The messaging system provides both **in-app notifications** and **email notifications** for users in the Business Process Management application. It enables the system to communicate with users about important events such as task assignments, task activations, deadline reminders, and process updates.

### Key Features

- **Dual-channel communication**: In-app messages and email
- **Read/unread tracking**: Users can mark messages as read or unread
- **Real-time badge updates**: Unread count displayed in navigation header
- **Automatic polling**: Checks for new messages every 60 seconds
- **Timeline display**: Messages shown in chronological order
- **Email templates**: HTML email templates with consistent branding
- **Status tracking**: Tracks message delivery status (pending, sent, failed)

### Message Types

The system supports the following message types:

- `task_activated` - When a task becomes active and assigned to a user
- `task_assigned` - When a user is assigned to a task
- `task_deadline` - Deadline reminder for a task
- `case_assigned` - When a case is assigned to a user
- `case_completed` - When a case is completed
- `step_completed` - When a process step is completed
- `dependency_changed` - When a task dependency is updated

### Message Categories (`msg_type`)

Messages are categorized using the `msg_type` field to distinguish how they should be handled:

- **`notification`** - General system notifications (default)
- **`email`** - Messages sent via email
- **`in-app`** - Messages displayed only in-app
- **`reminder`** - Time-sensitive reminders (e.g., deadlines)
- **`comment`** - Comments on tasks or cases
- **`chat`** - Chat messages between users
- **`direct`** - Direct messages from users or admins

Each category can have different UI styling, filtering, and handling logic.

---

## Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────┐
│                  Frontend Layer                     │
│  • /routes/messages/+page.svelte                   │
│  • Header.svelte (badge display)                   │
│  • Timeline.svelte (message display)               │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   Store Layer                       │
│  • messageStore.ts (state management + polling)    │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Service Layer                      │
│  • messageService.ts (message operations)          │
│  • emailService.ts (email delivery)                │
│  • emailTemplateUtils.ts (template rendering)      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   Data Layer                        │
│  • PostgreSQL (_bpm_messages table)                │
│  • PostgREST API (query/insert/update)            │
│  • Email Backend API (Railway service)             │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: SvelteKit, Svelte 5 runes
- **State Management**: Custom store with factory pattern
- **Database**: PostgreSQL
- **API**: PostgREST (database access)
- **Email Service**: Railway-hosted email backend (Maileroo integration)
- **Validation**: Zod schemas
- **Error Handling**: Result pattern (never throw)

---

## Database Schema

### Table: `_bpm_messages`

```sql
CREATE TABLE IF NOT EXISTS _bpm_messages (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,                -- Message type (e.g., 'task_activated')
  msg_type VARCHAR(50) NOT NULL DEFAULT 'notification', -- Message category
  recipient_email VARCHAR(255) NOT NULL,     -- Recipient email address
  recipient_user_id VARCHAR(255),            -- PocketBase user ID
  subject VARCHAR(255) NOT NULL,             -- Message subject
  body TEXT NOT NULL,                        -- Message body (HTML for emails)
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  in_app_read BOOLEAN DEFAULT FALSE,         -- Read status for in-app messages
  sent_at TIMESTAMP,                         -- When email was sent
  created_at TIMESTAMP DEFAULT NOW()         -- When message was created
);

-- Index for faster filtering by msg_type
CREATE INDEX IF NOT EXISTS idx_bpm_messages_msg_type ON _bpm_messages(msg_type);
```

### Fields Explanation

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key, auto-incrementing |
| `type` | VARCHAR(100) | Message event type (e.g., 'task_activated', 'task_assigned') |
| `msg_type` | VARCHAR(50) | Message category: 'chat', 'reminder', 'email', 'in-app', 'comment', 'notification', 'direct' |
| `recipient_email` | VARCHAR(255) | Email address for email delivery |
| `recipient_user_id` | VARCHAR(255) | Links to PocketBase user for in-app display |
| `subject` | VARCHAR(255) | Email subject / in-app title |
| `body` | TEXT | HTML content for emails, text for in-app messages |
| `status` | VARCHAR(50) | Email delivery status: `pending`, `sent`, `failed` |
| `in_app_read` | BOOLEAN | Whether user has read the in-app message |
| `sent_at` | TIMESTAMP | Timestamp when email was successfully sent |
| `created_at` | TIMESTAMP | Message creation timestamp |

### Migration History

- **Original**: Table was named `_bpm_notifications`
- **Renamed**: Migration script `rename_notifications_to_messages.sql` renamed to `_bpm_messages`
- **msg_type field added**: Migration script `add_msg_type_to_messages.sql` added the `msg_type` field with 7 possible values
- **Backward Compatibility**: Code exports both `Message` and `Notification` types

---

## Service Layer

### Message Service (`src/lib/services/messageService.ts`)

The message service provides all operations for creating, retrieving, and managing messages.

#### Core Functions

##### 1. `sendMessage(data: CreateMessageInput)`

Creates an in-app message record only (no email sent).

```typescript
const result = await sendMessage({
  type: 'task_assigned',
  recipient_email: 'user@example.com',
  recipient_user_id: 'pbuser123',
  subject: 'New Task Assigned',
  body: 'You have been assigned to complete Task XYZ'
});
```

**Use case**: When you want to create a message without sending an email (background processing later).

---

##### 2. `sendEmailMessage(data: EmailMessageInput)`

Creates a message record **AND** immediately sends an email.

```typescript
const result = await sendEmailMessage({
  type: 'task_activated',
  recipient_email: 'user@example.com',
  recipient_user_id: 'pbuser123',
  subject: 'Task Activated',
  html: '<p>Your task has been activated</p>'
});
```

**Use case**: When you need immediate email delivery (e.g., task activation, deadline alerts).

**Process**:
1. Create message record in database
2. Send email via email service
3. Update message status based on email result
4. Return both message and email response

---

##### 3. `queueEmailMessage(data: CreateMessageInput)`

Creates a message with `pending` status for background processing.

```typescript
const result = await queueEmailMessage({
  type: 'task_deadline',
  recipient_email: 'user@example.com',
  subject: 'Task Deadline Approaching',
  body: 'Your task is due soon'
});
```

**Use case**: For batch processing or when immediate delivery is not required.

**Note**: Currently calls `sendMessage()`. Future enhancement would implement background worker.

---

##### 4. `getUserMessages(userId: string)`

Retrieves all messages for a specific user, ordered by creation date (newest first).

```typescript
const result = await getUserMessages('pbuser123');
if (result.success) {
  console.log(result.value); // Message[]
}
```

---

##### 5. `getUnreadMessages(userId: string)`

Retrieves only unread messages for a user.

```typescript
const result = await getUnreadMessages('pbuser123');
if (result.success) {
  console.log(`Unread: ${result.value.length}`);
}
```

---

##### 6. `markMessageAsRead(id: number)`

Marks a specific message as read.

```typescript
await markMessageAsRead(456);
```

---

##### 7. `markMessageAsUnread(id: number)`

Marks a specific message as unread.

```typescript
await markMessageAsUnread(456);
```

---

##### 8. `markAllMessagesAsRead(userId: string)`

Marks all messages for a user as read.

```typescript
await markAllMessagesAsRead('pbuser123');
```

---

### Email Service (`src/lib/services/emailService.ts`)

Handles email delivery through the Railway-hosted email backend.

#### Configuration

Environment variables required:

```bash
PUBLIC_EMAIL_SERVICE_URL=https://email-backend-maileroo-production.up.railway.app
PUBLIC_EMAIL_SERVICE_TOKEN=your-service-token
PUBLIC_EMAIL_FROM_EMAIL=no-reply@pippeloi.nl
PUBLIC_EMAIL_FROM_NAME=Business Process Management
```

#### Core Functions

##### 1. `sendEmail(emailData: EmailData)`

Sends an email via the email backend API.

```typescript
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Hello</p>',
  text: 'Hello'
});
```

**Features**:
- Supports HTML and plain text
- Optional attachments (base64 encoded)
- Automatic retry on failure (2 retries, 30s timeout)
- Returns detailed success/error information

---

##### 2. `updateNotificationStatus(messageId, status, errorMessage?)`

Updates the status of a message after email delivery.

```typescript
await updateNotificationStatus(123, 'sent');
// or
await updateNotificationStatus(456, 'failed', 'SMTP error');
```

---

##### 3. `sendEmailFromMessage(message: Message)`

Sends an email based on an existing message record.

```typescript
const result = await sendEmailFromMessage(messageRecord);
```

Automatically updates message status after sending.

---

##### 4. `sendTestEmail(to: string)`

Sends a test email with sample content to verify email service configuration.

```typescript
await sendTestEmail('user@example.com');
```

---

### Validation Schemas (`src/lib/schemas/message.ts`)

All message data is validated using Zod schemas:

```typescript
// Message status
MessageStatusSchema = z.enum(['pending', 'sent', 'failed'])

// Full message structure
MessageSchema = z.object({
  id: z.number().int().positive(),
  type: z.string().min(1),
  recipient_email: z.string().email(),
  recipient_user_id: z.string().optional().nullable(),
  subject: z.string().min(1),
  body: z.string(),
  status: MessageStatusSchema,
  in_app_read: z.boolean().default(false),
  sent_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime()
})

// Create message input
CreateMessageInputSchema = z.object({
  type: z.string().min(1),
  recipient_email: z.string().email(),
  recipient_user_id: z.string().optional(),
  subject: z.string().min(1).max(255),
  body: z.string().min(1)
})

// Email message input (with HTML)
EmailMessageInputSchema = z.object({
  type: z.string().min(1),
  recipient_email: z.string().email(),
  recipient_user_id: z.string().optional(),
  subject: z.string().min(1).max(255),
  html: z.string().min(1),
  body: z.string().optional() // Plain text fallback
})
```

---

## Frontend Components

### 1. Messages Page (`src/routes/messages/+page.svelte`)

The main page for viewing all messages.

#### Features

- **Timeline display**: Messages shown in reverse chronological order
- **Unread indicator**: "Nieuw" badge on unread messages
- **Read/unread toggle**: Icon buttons to mark individual messages
- **Bulk actions**: "Mark all as read" button
- **Loading states**: Spinner during data fetch
- **Empty state**: Friendly message when no messages exist
- **Relative timestamps**: "zojuist", "5 minuten geleden", etc.

#### State Management

```typescript
let messages = $state<Message[]>([]);
let loading = $state(true);

const unreadCount = $derived(
  messages.filter((n) => !n.in_app_read).length
);
```

#### Key Functions

```typescript
// Load messages from API
async function loadMessages() {
  const auth = authStore.getAuth();
  const result = await messageService.getUserMessages(auth.record.id);
  if (result.success) {
    messages = result.value;
  }
}

// Mark as read and refresh
async function markAsRead(id: number) {
  await messageService.markMessageAsRead(id);
  await loadMessages();
  messageStore.refresh(); // Update badge
}

// Format relative time
function formatRelativeTime(date: Date | string): string {
  // Returns: "zojuist", "5 minuten geleden", "2 dagen geleden", etc.
}
```

---

### 2. Message Store (`src/lib/stores/messageStore.ts`)

Reactive store for managing unread count and polling.

#### State Structure

```typescript
interface MessageStoreData {
  unreadCount: number;
  loading: boolean;
}
```

#### Methods

```typescript
// Load unread count from API
messageStore.loadUnreadCount()

// Start polling (default: every 60 seconds)
messageStore.startPolling(60000)

// Stop polling
messageStore.stopPolling()

// Manual refresh
messageStore.refresh()

// Reset to initial state
messageStore.reset()
```

#### Usage in Components

```typescript
import { messageStore } from '$lib/stores/messageStore';

let unreadCount = $state(0);

messageStore.subscribe(state => {
  unreadCount = state.unreadCount;
});

onMount(() => {
  if (isAuthenticated) {
    messageStore.startPolling();
  }
});
```

---

### 3. Header Component (`src/lib/components/Header.svelte`)

Displays the navigation with unread message badge.

#### Badge Display

```svelte
{#if item.label === 'Berichten' && unreadCount > 0}
  <span class="ml-1.5 inline-flex items-center justify-center w-5 h-5 
                text-xs font-semibold text-white bg-orange-500 rounded-full">
    {unreadCount > 9 ? '9+' : unreadCount}
  </span>
{/if}
```

**Styling**:
- Orange background (`bg-orange-500`)
- White text
- Rounded full circle
- Shows "9+" when count exceeds 9
- Only visible when `unreadCount > 0`

#### Polling Management

```typescript
onMount(() => {
  checkAuth();
  
  // Start polling for messages if authenticated
  if (isAuthenticated) {
    messageStore.startPolling();
  }
});
```

Polling automatically:
- Starts on mount if user is authenticated
- Stops when component unmounts
- Updates badge in real-time

---

## Message Flow

### Flow 1: Task Activation → Email Notification

This is the most common message flow in the system.

```
1. User completes a task
   ↓
2. taskService.completeTask() is called
   ↓
3. Task marked as completed in database
   ↓
4. Find next tasks to activate
   ↓
5. For each next task with an assignee:
   a. Get task, step, and case details
   b. Get user email from PocketBase
   c. Render email template with task data
   d. Call messageService.sendEmailMessage()
      ↓
      • Create message record in _bpm_messages
      • Send email via emailService.sendEmail()
      • Update message status (sent/failed)
   ↓
6. Message appears in recipient's in-app inbox
   ↓
7. Email delivered to recipient's email
   ↓
8. Badge count updates on next poll (or immediate refresh)
```

### Flow 2: User Views Messages

```
1. User clicks "Berichten" in navigation
   ↓
2. /messages page loads
   ↓
3. onMount() calls loadMessages()
   ↓
4. messageService.getUserMessages(userId)
   ↓
5. Query PostgREST API
   ↓
6. Return messages ordered by created_at DESC
   ↓
7. Transform to timeline items
   ↓
8. Render in Timeline component
   ↓
9. User sees messages with unread badges
```

### Flow 3: Mark as Read

```
1. User clicks "Mark as read" icon
   ↓
2. markAsRead(id) function called
   ↓
3. messageService.markMessageAsRead(id)
   ↓
4. Update _bpm_messages SET in_app_read = true WHERE id = ?
   ↓
5. Reload messages from API
   ↓
6. Call messageStore.refresh()
   ↓
7. Store fetches new unread count
   ↓
8. Header badge updates reactively
```

### Flow 4: Automatic Polling

```
1. User logs in
   ↓
2. Header component detects authentication
   ↓
3. messageStore.startPolling(60000)
   ↓
4. Immediate load: loadUnreadCount()
   ↓
5. Every 60 seconds:
   a. Call messageService.getUnreadMessages(userId)
   b. Count unread messages
   c. Update store state
   d. Badge updates reactively
   ↓
6. User logs out → stopPolling()
```

---

## Email Integration

### Email Backend Architecture

The system uses a dedicated email backend service hosted on Railway:

- **Service URL**: `https://email-backend-maileroo-production.up.railway.app`
- **Provider**: Maileroo (SMTP service)
- **Authentication**: Service token (X-Service-Token header)

### Email Templates

Email templates are stored in `src/lib/templates/emails/` and use HTML with variable substitution.

#### Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...">
  <div style="max-width: 600px; margin: 0 auto; ...">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(to right, #18181b, #27272a); ...">
      <h1 style="color: #ffffff; ...">{{title}}</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p>{{content}}</p>
      
      <!-- CTA Button -->
      <a href="{{actionUrl}}" style="display: inline-block; ...">
        {{actionText}}
      </a>
    </div>
  </div>
</body>
</html>
```

#### Available Templates

1. **task-activated.html** - When a task is activated
2. **task-deadline.html** - Deadline reminder (planned)
3. **case-assigned.html** - Case assignment (planned)
4. **case-completed.html** - Case completion (planned)
5. **step-completed.html** - Step completion (planned)

#### Template Rendering

`src/lib/utils/emailTemplateUtils.ts` provides template rendering:

```typescript
import { getEmailTemplate } from '$lib/utils/emailTemplateUtils';

const html = getEmailTemplate('task-activated', {
  taskName: 'Review Document',
  caseName: 'Project Alpha',
  deadline: '2025-11-15 14:00',
  taskUrl: 'https://app.example.com/cases/123'
});
```

**Variable substitution**:
- `{{taskName}}` → Actual task name
- `{{caseName}}` → Actual case name
- `{{deadline}}` → Formatted deadline
- `{{taskUrl}}` → Direct link to task/case

---

## Current Status

### ✅ Implemented Features

- [x] Database schema (`_bpm_messages` table)
- [x] Message service with full CRUD operations
- [x] Email service with Railway backend integration
- [x] Email templates for task activation
- [x] In-app message display page
- [x] Timeline component for message visualization
- [x] Read/unread tracking
- [x] Mark as read/unread functionality
- [x] Mark all as read functionality
- [x] Message store with polling
- [x] Unread count badge in header
- [x] Automatic polling (60-second interval)
- [x] Relative timestamp formatting (Dutch)
- [x] Result pattern error handling
- [x] Zod validation for all inputs
- [x] Backward compatibility (Notification → Message rename)
- [x] Task activation notifications
- [x] Dependency change notifications (partial)

### 🚧 Partially Implemented

- [ ] **Dependency notifications**: Logic exists but marked as TODO
- [ ] **Background email processing**: `queueEmailMessage` exists but no worker
- [ ] **Email template variety**: Only task-activated template is fully used

### ❌ Not Implemented

- [ ] **Deadline reminders**: Schema supports but no cron job
- [ ] **Case assignment notifications**: Template exists but not triggered
- [ ] **Step completion notifications**: Not implemented
- [ ] **Message filtering**: No UI to filter by type or date
- [ ] **Message search**: No search functionality
- [ ] **Message pagination**: All messages loaded at once
- [ ] **Message deletion**: No way to delete old messages
- [ ] **Email preferences**: Users can't opt out of emails
- [ ] **Push notifications**: Web push not implemented
- [ ] **Message attachments**: Schema doesn't support files
- [ ] **Rich text editor**: Plain text only for body
- [ ] **Message replies**: One-way communication only
- [ ] **Admin message panel**: No way to send manual messages

---

## Usage Examples

### Example 1: Send Task Activation Email

```typescript
import * as messageService from '$lib/services/messageService';
import { getEmailTemplate } from '$lib/utils/emailTemplateUtils';

// Get task and user details
const taskName = 'Review Budget Report';
const caseName = 'Q4 Financial Review';
const deadline = '2025-11-20 17:00';
const taskUrl = `${baseUrl}/cases/${caseId}`;
const userEmail = 'john.doe@example.com';
const userId = 'pbuser_abc123';

// Render HTML template
const html = getEmailTemplate('task-activated', {
  taskName,
  caseName,
  deadline,
  taskUrl
});

// Send message + email
const result = await messageService.sendEmailMessage({
  type: 'task_activated',
  recipient_email: userEmail,
  recipient_user_id: userId,
  subject: `Task Activated: ${taskName}`,
  html
});

if (result.success) {
  console.log('Message sent:', result.value.message);
  console.log('Email result:', result.value.emailResult);
} else {
  console.error('Failed to send:', result.error);
}
```

### Example 2: Display Messages in Custom Component

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import * as messageService from '$lib/services/messageService';
  import type { Message } from '$lib/schemas/message';

  let messages = $state<Message[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const auth = authStore.getAuth();
    if (auth?.record?.id) {
      const result = await messageService.getUserMessages(auth.record.id);
      if (result.success) {
        messages = result.value;
      }
    }
    loading = false;
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if messages.length === 0}
  <p>No messages</p>
{:else}
  {#each messages as message}
    <div class:unread={!message.in_app_read}>
      <h3>{message.subject}</h3>
      <p>{message.body}</p>
      <time>{new Date(message.created_at).toLocaleString()}</time>
    </div>
  {/each}
{/if}
```

### Example 3: Create In-App Only Message

```typescript
// Create message without sending email
const result = await messageService.sendMessage({
  type: 'system_notification',
  recipient_email: 'user@example.com',
  recipient_user_id: 'pbuser123',
  subject: 'System Maintenance',
  body: 'Scheduled maintenance tonight at 2 AM'
});

// Message will appear in inbox but no email sent
```

### Example 4: Manually Refresh Badge Count

```typescript
import { messageStore } from '$lib/stores/messageStore';

// After performing an action that might change unread count
async function handleAction() {
  // ... do something ...
  
  // Refresh badge immediately
  messageStore.refresh();
}
```

### Example 5: Test Email Configuration

```typescript
import { sendTestEmail } from '$lib/services/emailService';

const result = await sendTestEmail('admin@example.com');

if (result.success) {
  console.log('Test email sent successfully');
} else {
  console.error('Email service error:', result.error);
}
```

### Example 6: Using Different Message Categories

```typescript
// Send a reminder
const reminderResult = await messageService.sendEmailMessage({
  type: 'task_deadline',
  msg_type: 'reminder',
  recipient_email: 'user@example.com',
  recipient_user_id: 'pbuser123',
  subject: 'Task Deadline Approaching',
  html: '<p>Your task is due in 2 hours</p>'
});

// Send a chat message
const chatResult = await messageService.sendMessage({
  type: 'user_chat',
  msg_type: 'chat',
  recipient_email: 'user@example.com',
  recipient_user_id: 'pbuser123',
  subject: 'New Chat Message',
  body: 'Hey, can you help me with this?'
});

// Send a direct message
const directResult = await messageService.sendEmailMessage({
  type: 'admin_message',
  msg_type: 'direct',
  recipient_email: 'user@example.com',
  recipient_user_id: 'pbuser123',
  subject: 'Important Notice',
  html: '<p>Please review the updated policies</p>'
});
```

---

## Testing

### Test Script

A comprehensive test script is available to verify the messaging system functionality.

#### Running Tests

```bash
# Run the messaging test script
npm run test:messages
```

The test script will:
- Create 7 test messages with different `msg_type` values
- Send emails to `patrick@hoipippeloi.nl` for email-type messages
- Store all messages in the `_bpm_messages` table
- Display detailed output with success/failure status

#### Test Coverage

The test script covers:
- ✅ All 7 message categories (`notification`, `email`, `in-app`, `reminder`, `comment`, `chat`, `direct`)
- ✅ In-app only messages (no email sent)
- ✅ Email + in-app messages (email sent)
- ✅ Database record creation
- ✅ Email service integration
- ✅ Status tracking (pending, sent, failed)

#### Test Output

```bash
🚀 Starting Messaging System Test
==================================
Test Email: patrick@hoipippeloi.nl
Test User ID: test_user_patrick
Total Test Messages: 7

📧 Processing: Test Notification - System Alert
   Type: test_notification
   Msg Type: notification
   Send Email: No
   ✅ Success - Message ID: 123
   📱 In-App Only

...

==================================
✨ Test Summary
==================================
✅ Successful: 7
❌ Failed: 0
📊 Total: 7
```

See `tests/README.md` for more details on testing.

---

## Future Enhancements

### Priority 1: Core Functionality

1. **Message Pagination**
   - Load messages in batches (e.g., 20 at a time)
   - Infinite scroll or "Load more" button
   - Improve performance for users with many messages

2. **Message Filtering**
   - Filter by message type
   - Filter by read/unread status
   - Date range filtering

3. **Message Search**
   - Full-text search on subject and body
   - Search by sender or date

4. **Background Email Worker**
   - Implement cron job or background service
   - Process `pending` messages in queue
   - Retry failed emails with exponential backoff

### Priority 2: User Experience

5. **Email Preferences**
   - User settings to opt in/out of email types
   - Frequency settings (immediate, daily digest, weekly)
   - Store preferences in user profile

6. **Rich Notifications**
   - Action buttons in messages (Approve, Reject, View)
   - Inline task completion from message
   - Quick reply functionality

7. **Message Templates**
   - Complete all email templates
   - Allow admins to customize templates
   - Template preview in admin panel

8. **Desktop/Push Notifications**
   - Web Push API integration
   - Browser notifications for new messages
   - Sound/vibration options

### Priority 3: Administration

9. **Admin Message Panel**
   - Send manual messages to users
   - Broadcast messages to all users
   - Schedule messages for future delivery

10. **Message Analytics**
    - Track email open rates
    - Track link clicks
    - Message engagement metrics

11. **Message Archival**
    - Auto-archive old messages (e.g., > 90 days)
    - User ability to archive manually
    - Restore archived messages

### Priority 4: Advanced Features

12. **Message Attachments**
    - Support file attachments in emails
    - Display attachments in in-app messages
    - File size limits and type restrictions

13. **Two-way Communication**
    - Reply to messages
    - Threaded conversations
    - Internal messaging between users

14. **Message Categories**
    - Group messages by category
    - Collapsible category sections
    - Category-specific icons and colors

15. **Smart Notifications**
    - AI-powered message prioritization
    - Smart grouping of related messages
    - Suggested actions based on message content

---

## Technical Notes

### Error Handling

All service methods use the **Result pattern**:

```typescript
type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E }
```

Never throws errors - always returns Result with either success or error state.

### Performance Considerations

- **Polling interval**: 60 seconds is a balance between freshness and API load
- **Message loading**: All messages loaded at once (needs pagination for scale)
- **Badge updates**: Only unread count is polled, not full message list
- **Email sending**: Synchronous (blocks until sent) - consider async queue

### Security Considerations

- **Email service token**: Stored in environment variables, never exposed to client
- **User isolation**: Messages filtered by `recipient_user_id` to prevent cross-user access
- **Email validation**: All email addresses validated with Zod schema
- **SQL injection**: Protected by PostgREST parameterized queries
- **XSS protection**: HTML sanitization needed if allowing user-generated content

### Testing

- **Unit tests**: Not implemented yet (should test service methods)
- **Integration tests**: Not implemented yet (should test email flow)
- **E2E tests**: Not implemented yet (should test user workflows)

### Backward Compatibility

The system maintains backward compatibility with the old "notifications" naming:

```typescript
// Old (deprecated but still works)
import { sendNotification } from '$lib/services/messageService';

// New (preferred)
import { sendMessage } from '$lib/services/messageService';
```

Both work identically - the old exports are aliases to the new functions.

---

## Troubleshooting

### Messages Not Appearing

1. Check user is authenticated: `authStore.getAuth()`
2. Verify `recipient_user_id` matches PocketBase user ID
3. Check database: `SELECT * FROM _bpm_messages WHERE recipient_user_id = 'xxx'`
4. Look for errors in browser console

### Emails Not Sending

1. Verify environment variables are set:
   - `PUBLIC_EMAIL_SERVICE_URL`
   - `PUBLIC_EMAIL_SERVICE_TOKEN`
2. Check email service is running (Railway dashboard)
3. Test email configuration: `sendTestEmail('your@email.com')`
4. Check message status: `SELECT status FROM _bpm_messages WHERE id = xxx`
5. Look for errors in message body or server logs

### Badge Count Not Updating

1. Check polling is started: Should start on mount if authenticated
2. Verify messageStore is subscribed in Header component
3. Check API is returning correct unread count
4. Try manual refresh: `messageStore.refresh()`
5. Check browser network tab for API calls

### Relative Timestamps Incorrect

1. Verify server and client time zones match
2. Check date format in database (should be ISO 8601)
3. Test `formatRelativeTime()` function with known dates

---

## Related Documentation

- [Email Implementation Documentation](../../docs/email-implementation.md)
- [Architecture Documentation](../../docs/architecture.md)
- [Development Standards](../../.cursor/rules/development-standards.mdc)
- [Database Schema Documentation](../../schema-mgr/schema/)

---

## Changelog

### 2025-11-07

#### Latest Updates
- **Added `msg_type` field** to `_bpm_messages` table with 7 categories
- **Created migration script** `add_msg_type_to_messages.sql`
- **Updated Zod schemas** to include `msg_type` validation
- **Updated messageService** to support `msg_type` in all methods
- **Created test script** `tests/test-messages.ts` for comprehensive testing
- **Added test documentation** in `tests/README.md`
- **Updated main documentation** with `msg_type` field and testing section

#### Previous Updates
- Created comprehensive documentation
- Documented current implementation status
- Added future enhancement roadmap

### 2025-11-05
- Renamed `_bpm_notifications` to `_bpm_messages`
- Migration script applied to production database

### 2025-10-30
- Implemented notification badge in header
- Added polling mechanism to messageStore
- Integrated unread count display

---

**Last Updated**: 2025-11-07  
**Maintained By**: Development Team  
**Questions?**: Review code comments or check related documentation

