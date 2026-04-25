<!-- 662d3b23-e77e-486b-96a2-3e6d7458cc6a baa23f0c-c288-4a44-bd9b-b965de56642f -->
# Typebot Integration Tool - Implementation Plan

## Overview

Create a comprehensive Typebot management tool in `/tools/typebot` that integrates with the Typebot API to list typebots, display their logic in a readable format, preview them, and send personalized links to employees with customizable email messages.

## Architecture

### API Layer

- **Server Route**: `src/routes/tools/typebot/api/+server.ts`
  - `GET /tools/typebot/api/list` - Fetch all typebots from Typebot API
  - `GET /tools/typebot/api/:id` - Get detailed typebot information
  - `POST /tools/typebot/api/send` - Send typebot links to employees via email

### Service Layer

- **Typebot Service**: `src/lib/services/typebotService.ts`
  - `getAllTypebots()` - Fetch typebots from API (via server route)
  - `getTypebotById(id)` - Get typebot details
  - `parseTypebotStructure(typebot)` - Parse JSON into readable format (groups, blocks, flow)
  - `sendTypebotLinks(data)` - Send emails with typebot links

### Schemas

- **Typebot Schemas**: `src/lib/schemas/typebot.ts`
  - `TypebotSchema` - Typebot data structure
  - `SendTypebotLinksInputSchema` - Email sending input validation

### UI Components

- **Main Page**: `src/routes/tools/typebot/+page.svelte`
  - List view of all typebots (cards/grid)
  - Click to view details

- **Typebot Detail View**: `src/lib/components/typebot/TypebotDetail.svelte`
  - Parsed logic display (groups, blocks, flow visualization)
  - Preview link button
  - "View Full JSON" button that opens drawer
  - "Send to Employees" button

- **JSON Drawer**: `src/lib/components/typebot/TypebotJsonDrawer.svelte`
  - Drawer component showing full JSON structure
  - Syntax-highlighted JSON display

- **Employee Selector**: `src/lib/components/typebot/EmployeeSelector.svelte`
  - Searchable list with checkboxes
  - Select all / deselect all option
  - Shows employee name and email

- **Email Composer**: `src/lib/components/typebot/EmailComposer.svelte`
  - Modal/drawer for composing email
  - Subject field
  - Message body (HTML editor or textarea)
  - Preview of generated link with params

## Implementation Details

### 1. API Integration

- Use Typebot API client pattern (similar to existing API clients)
- Fetch from: `https://builder-production-8168.up.railway.app/api/v1`
- Use workspace ID and API key from config
- Handle authentication via server-side routes (keep API key secure)

### 2. Typebot Structure Parsing

- Parse JSON structure into readable format:
  - Groups → Sections
  - Blocks → Steps/Questions
  - Edges → Flow connections
  - Variables → Data collected
- Display as hierarchical tree or flow diagram
- Show block types (text, input, choice, condition, etc.)

### 3. Email Sending

- Generate typebot viewer URL with params:
  - `email={employee.email}`
  - `reset=true`
- Use existing `emailService.sendEmail()`
- Create message record via `messageService.sendEmailMessage()`
- Support custom subject and body from user

### 4. Employee Selection

- Use `employeeService.getAllEmployees()`
- Filter by search term (name or email)
- Multi-select with checkboxes
- Select all / deselect all functionality
- Show selected count

### 5. URL Generation

- Viewer URL format: `https://viewer-production-a3fa.up.railway.app/{publicId}?email={email}&reset=true`
- Extract `publicId` from typebot data
- Handle typebots without publicId (show warning)

## File Structure

```
src/
├── routes/
│   └── tools/
│       └── typebot/
│           ├── +page.svelte (main list view)
│           └── api/
│               └── +server.ts (API routes)
├── lib/
│   ├── services/
│   │   └── typebotService.ts (business logic)
│   ├── schemas/
│   │   └── typebot.ts (validation schemas)
│   └── components/
│       └── typebot/
│           ├── TypebotDetail.svelte
│           ├── TypebotJsonDrawer.svelte
│           ├── EmployeeSelector.svelte
│           └── EmailComposer.svelte
```

## Configuration

- Use Typebot API credentials from environment or config
- Store viewer URL and builder URL as constants
- Handle API errors gracefully with user-friendly messages

## User Flow

1. Navigate to `/tools/typebot`
2. See list of all typebots from API
3. Click on a typebot → See parsed logic view
4. Click "View Full JSON" → Drawer opens with JSON
5. Click "Preview" → Opens typebot in new tab
6. Click "Send to Employees" → Opens employee selector
7. Search/select employees → Opens email composer
8. Customize email message → Send emails with personalized links

## Error Handling

- Handle API failures (network errors, auth failures)
- Validate typebot has publicId before allowing send
- Validate employee selection before sending
- Show toast notifications for success/failure
- Use Result pattern in services

## Testing Considerations

- Test API integration with mock data
- Test email sending with test recipients
- Test employee selection and filtering
- Test URL generation with various typebot configurations

### To-dos

- [ ] Create Zod schemas for typebot data structures and email sending input in src/lib/schemas/typebot.ts
- [ ] Create typebotService.ts with functions to fetch typebots, parse structure, and send links
- [ ] Create server-side API routes in src/routes/tools/typebot/api/+server.ts for listing typebots and sending emails
- [ ] Create TypebotDetail.svelte component showing parsed logic, preview link, and action buttons
- [ ] Create TypebotJsonDrawer.svelte component for displaying full JSON in a drawer
- [ ] Create EmployeeSelector.svelte component with searchable list, checkboxes, and select-all functionality
- [ ] Create EmailComposer.svelte modal/drawer for composing custom email messages
- [ ] Create main typebot list page at src/routes/tools/typebot/+page.svelte with typebot cards and navigation
- [ ] Update tools navigation to include link to typebot tool

