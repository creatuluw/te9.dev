---
name: visual-verification
description: Test applications in browsers, verify UI behavior, catch visual regressions, and validate user flows end-to-end
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Test applications in browsers using automation tools
- Verify UI behavior matches requirements
- Catch visual regressions before they reach production
- Validate user flows end-to-end
- Test responsive design across different screen sizes
- Verify accessibility features work as expected
- Test forms, inputs, and user interactions
- Validate that UI changes produce expected behavior
- Test beyond what unit tests can cover
- Provide visual evidence of test results

## When to use me
Use this when:
- Making UI changes or new features
- Refactoring CSS or component layouts
- Testing responsive design
- Validating user interactions and workflows
- Catching visual bugs that unit tests miss
- Testing cross-browser compatibility
- Validating accessibility features
- Before deploying UI changes to production
- When you need to verify behavior visually
- When manual testing would be too time-consuming

## How I behave
- Use browser automation to test UI interactively
- Visually check that changes work as expected
- Validate user interactions and form submissions
- Test responsive behavior across different viewports
- Take screenshots for visual regression comparison
- Test accessibility features (keyboard navigation, screen readers)
- Verify error states and edge cases in the UI
- Test real user flows from start to finish
- Use headless browsers for faster, automated testing
- Provide detailed logs and screenshots for debugging

## My goals
- Ensure UI actually works for real users
- Catch visual and interaction bugs before production
- Validate that code changes produce expected behavior
- Test beyond unit tests to catch integration issues
- Reduce manual testing time and effort
- Catch regressions automatically
- Verify responsive design across devices
- Ensure accessibility features work correctly
- Provide confidence that UI changes are safe to ship
- Catch issues that automated tests miss

## What I test

### UI elements
- **Buttons and links**: Verify clickability and behavior
- **Forms**: Test form submission, validation, error handling
- **Inputs**: Verify text inputs, selects, checkboxes, radios
- **Modals and dialogs**: Test opening, closing, and interactions
- **Navigation**: Verify menus, breadcrumbs, routing
- **Lists and tables**: Test rendering, sorting, filtering, pagination
- **Cards and components**: Verify layout and interactions

### User flows
- **Registration and login**: Complete sign-up and authentication flows
- **Checkout process**: Full e-commerce checkout flow
- **Search and filtering**: Search functionality with filters
- **Data entry**: Complete CRUD operations (create, read, update, delete)
- **Multi-step workflows**: Complex multi-step processes
- **Error recovery**: How the UI handles and recovers from errors

### Visual aspects
- **Layout**: Verify elements are positioned correctly
- **Spacing**: Check margins, padding, and alignment
- **Typography**: Verify fonts, sizes, weights, and colors
- **Images**: Ensure images load and display correctly
- **Responsiveness**: Test on different screen sizes and orientations
- **Theme**: Verify light/dark mode and theming works

### Accessibility
- **Keyboard navigation**: Test tab order and keyboard shortcuts
- **Screen readers**: Verify ARIA labels and screen reader announcements
- **Focus states**: Check visible focus indicators
- **Color contrast**: Verify sufficient color contrast for readability
- **Text scaling**: Test with larger text sizes
- **Reduced motion**: Test with reduced motion preferences

## Tools and approaches

### Browser automation
- **Puppeteer/Playwright**: Headless Chrome automation
- **Selenium**: Cross-browser automation
- **Cypress**: End-to-end testing framework
- **TestCafe**: Browser-based testing without WebDrivers

### Visual regression
- **Screenshot comparison**: Before/after screenshots
- **Pixel diff**: Detect visual changes
- **Ignore regions**: Areas that should be ignored (dynamic content)
- **Baseline management**: Manage expected screenshots

### Responsive testing
- **Viewport emulation**: Test different screen sizes
- **Device emulation**: Test specific devices and orientations
- **Touch simulation**: Test touch interactions

## Best practices

### Test design
- **Test user journeys, not just components**: Test complete flows
- **Focus on happy paths first**: Ensure core functionality works
- **Test edge cases**: Error states, empty states, loading states
- **Use realistic test data**: Don't always use perfect data
- **Test across browsers**: Verify cross-browser compatibility

### Maintenance
- **Make tests stable**: Avoid flaky tests that fail intermittently
- **Use waits properly**: Don't use arbitrary sleep delays
- **Isolate tests**: Tests shouldn't depend on each other
- **Clean up after tests**: Reset state between tests
- **Update baselines promptly**: Update visual regression baselines when expected changes occur

### Performance
- **Run tests in parallel**: Speed up test execution
- **Use headless browsers**: Faster than headed browsers
- **Optimize test suite**: Only run relevant tests for changes
- **Cache resources**: Speed up page loads during testing

## Common pitfalls to avoid

### Flaky tests
- **Hard-coded timeouts**: Use explicit waits instead
- **Tight timing dependencies**: Design tests to be resilient to timing variations
- **External dependencies**: Mock or stub external services when appropriate
- **State leakage**: Clean up state between tests

### False positives
- **Visual noise**: Ignore dynamic content in visual regression tests
- **Browser differences**: Account for minor rendering differences across browsers
- **Animations**: Disable or wait for animations during tests
- **Random content**: Use deterministic test data

### Maintenance burden
- **Over-specific selectors**: Use stable selectors that resist UI changes
- **Brittle tests**: Make tests resilient to minor UI changes
- **Too many tests**: Focus on high-value tests, not comprehensive coverage
- **Slow tests**: Keep tests fast to encourage frequent running

## Integration with other skills
- **Test-driven development**: Use visual tests to verify UI requirements
- **API contract definition**: Test that UI correctly consumes APIs
- **Declarative specification**: Translate requirements into visual tests
- **Code quality review**: Catch visual issues before code review
- **Context awareness**: Test UI in the context of the full application

## When visual verification isn't enough
- Complex business logic (unit/integration tests better)
- Performance testing (needs specialized tools)
- Security testing (needs security-focused approaches)
- Load testing (needs load testing tools)
- Cross-device testing on real devices (emulators not enough)
