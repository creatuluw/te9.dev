/**
 * Email template loader and renderer
 * 
 * All email templates live in src/lib/templates/emails/ as .html files.
 * Templates use {{variable}} placeholders that get replaced at render time.
 * 
 * Usage:
 *   import { renderEmailTemplate } from '$lib/templates/emails';
 *   const html = renderEmailTemplate('invitation', { invitationLink: '...', ... });
 */

// Import the renderTemplate utility
import { renderTemplate } from '$lib/utils/emailTemplateUtils';

// ---- Raw template strings ----
// Since this is a client-side SvelteKit app, we import templates as raw strings
// using Vite's ?raw import suffix.

import baseHtml from './base.html?raw';
import invitationHtml from './invitation.html?raw';
import welcomeHtml from './welcome.html?raw';
import passwordResetHtml from './password-reset.html?raw';
import magicLinkHtml from './magic-link.html?raw';
import subscriptionNotificationHtml from './subscription-notification.html?raw';
import mentionNotificationHtml from './mention-notification.html?raw';
import testHtml from './test.html?raw';
import sysadminEventHtml from './sysadmin-event.html?raw';

// ---- Template map ----
const templates: Record<string, string> = {
  base: baseHtml,
  invitation: invitationHtml,
  welcome: welcomeHtml,
  'password-reset': passwordResetHtml,
  'magic-link': magicLinkHtml,
  'subscription-notification': subscriptionNotificationHtml,
  'mention-notification': mentionNotificationHtml,
  test: testHtml,
  'sysadmin-event': sysadminEventHtml,
};

/**
 * Render a named email template with the given data.
 * Replaces all {{key}} placeholders with values from data.
 * 
 * @param name - Template name (e.g. 'invitation', 'password-reset')
 * @param data - Key-value pairs to substitute
 * @returns Rendered HTML string
 */
export function renderEmailTemplate(name: string, data: Record<string, string>): string {
  const template = templates[name];
  if (!template) {
    throw new Error(`Email template not found: ${name}`);
  }
  return renderTemplate(template, data);
}

/**
 * Render the base template with a custom header title and content block.
 * Useful for one-off emails that don't need their own template file.
 * 
 * @param headerTitle - Title shown in the dark header bar
 * @param subject - Email subject (used in <title>)
 * @param content - HTML content for the body area
 * @returns Rendered HTML string
 */
export function renderBaseEmail(headerTitle: string, subject: string, content: string): string {
  return renderTemplate(baseHtml, {
    headerTitle,
    subject,
    content,
  });
}

/**
 * Get the list of available template names
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}
