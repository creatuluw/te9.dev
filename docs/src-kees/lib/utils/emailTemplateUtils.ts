/**
 * Email template utilities - Template rendering and CSS inlining
 */

/**
 * Simple template rendering with variable substitution
 * Supports {{variable}} syntax
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  
  // Replace {{variable}} with data
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(data[key] || ''));
  });
  
  return rendered;
}

/**
 * Load email template from file (for client-side usage)
 * In a real implementation, you'd fetch or import the template
 * For now, we'll generate the HTML directly based on template type
 */
export function getEmailTemplate(
  templateType: 'task-activated' | 'task-deadline' | 'case-assigned' | 'case-completed' | 'step-completed',
  data: Record<string, any>
): string {
  // Get base URL for links
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  switch (templateType) {
    case 'task-activated':
      return renderTaskActivatedTemplate(data, baseUrl);
    case 'task-deadline':
      return renderTaskDeadlineTemplate(data, baseUrl);
    case 'case-assigned':
      return renderCaseAssignedTemplate(data, baseUrl);
    case 'case-completed':
      return renderCaseCompletedTemplate(data, baseUrl);
    case 'step-completed':
      return renderStepCompletedTemplate(data, baseUrl);
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

function renderTaskActivatedTemplate(data: Record<string, any>, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Activated</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(to right, #18181b, #27272a); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">Task Activated</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.025em;">New Task Assigned</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #18181b; line-height: 1.6;">A new task has been activated and assigned to you.</p>
              <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 20px; margin: 24px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Task:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.taskName || 'Task'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Case:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.caseName || 'Case'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Deadline:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.deadline || 'Not set'}</span></td></tr>
                </table>
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.taskUrl || baseUrl + '/cases'}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em;">View Task</a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">Please log in to the system to complete this task.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">© 2025 Business Process Management System</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderTaskDeadlineTemplate(data: Record<string, any>, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Deadline</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(to right, #dc2626, #ef4444); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">Deadline ${data.deadlineStatus || 'Approaching'}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.025em;">Task Deadline ${data.deadlineStatus || 'Approaching'}</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #18181b; line-height: 1.6;">Your task deadline is ${data.deadlineStatus || 'approaching'}.</p>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin: 24px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Task:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.taskName || 'Task'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Case:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.caseName || 'Case'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Deadline:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.deadline || 'Not set'}</span></td></tr>
                </table>
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.taskUrl || baseUrl + '/cases'}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em;">View Task</a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">Please complete this task as soon as possible.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">© 2025 Business Process Management System</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderCaseAssignedTemplate(data: Record<string, any>, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Assigned</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(to right, #18181b, #27272a); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">New Case Assigned</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.025em;">You've been assigned to a new case</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #18181b; line-height: 1.6;">A new case has been created and assigned to you.</p>
              <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 20px; margin: 24px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Case Name:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.caseName || 'Case'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Process:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.processName || 'Process'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Start Date:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.startDate || 'Not set'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Completion Deadline:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.deadline || 'Not set'}</span></td></tr>
                </table>
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.caseUrl || baseUrl + '/cases'}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em;">View Case</a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">Please review the case and begin working on the assigned tasks.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">© 2025 Business Process Management System</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderCaseCompletedTemplate(data: Record<string, any>, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Completed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(to right, #16a34a, #22c55e); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">Case Completed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.025em;">Congratulations!</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #18181b; line-height: 1.6;">The case has been successfully completed. All steps and tasks have been finished.</p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin: 24px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Case Name:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.caseName || 'Case'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Process:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.processName || 'Process'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Completed Date:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.completedDate || 'Not set'}</span></td></tr>
                </table>
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.caseUrl || baseUrl + '/cases'}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em;">View Case</a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">Thank you for your hard work on this case.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">© 2025 Business Process Management System</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderStepCompletedTemplate(data: Record<string, any>, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Step Completed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(to right, #2563eb, #3b82f6); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">Step Completed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.025em;">Progress Update</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #18181b; line-height: 1.6;">A step in the case has been completed successfully.</p>
              <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 20px; margin: 24px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Step:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.stepName || 'Step'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Case:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.caseName || 'Case'}</span></td></tr>
                  <tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Completed Date:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${data.completedDate || 'Not set'}</span></td></tr>
                </table>
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${data.caseUrl || baseUrl + '/cases'}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em;">View Case</a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6;">The next steps in the process will become available shortly.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">© 2025 Business Process Management System</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate plain text version from HTML
 */
export function generatePlainText(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: simple regex-based stripping
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Client-side: use DOM parser for better accuracy
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Remove script and style elements
  const scripts = tmp.querySelectorAll('script, style');
  scripts.forEach((el) => el.remove());
  
  return (tmp.textContent || tmp.innerText || '').trim();
}

