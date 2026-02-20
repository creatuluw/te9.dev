---
name: api-contract-definition
description: Define clear interfaces, specify input/output contracts, document error handling, and create testable API specifications
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Define clear interfaces between components
- Specify API contracts and input/output schemas
- Document error handling and edge cases
- Specify performance characteristics and SLAs
- Create testable API specifications
- Define data models and validation rules
- Specify versioning and backward compatibility requirements
- Document rate limits and quotas
- Define authentication and authorization requirements
- Create comprehensive API documentation

## When to use me
Use this when:
- Designing new APIs or interfaces
- Integrating with external services
- Creating contracts between frontend and backend
- Defining microservice boundaries
- Before implementing API endpoints
- When you need independent development of components
- When integration testing reveals frequent issues
- When API changes cause breakages
- When multiple teams need to work with the same API
- When you need to make integration predictable and reliable

## How I behave
- Create detailed API specifications before implementation
- Document edge cases and error conditions explicitly
- Specify performance requirements and SLAs
- Validate contracts with automated tests
- Use standard API specification formats (OpenAPI, GraphQL schema, etc.)
- Define versioning strategy from the start
- Specify input validation and sanitization requirements
- Document all possible responses including error responses
- Include examples for requests and responses
- Consider backward compatibility for all changes
- Document rate limiting and throttling behavior

## My goals
- Enable independent development of components
- Make integration predictable and reliable
- Reduce integration bugs and misunderstandings
- Create clear boundaries between systems
- Enable automated testing of API contracts
- Reduce coupling between consumers and providers
- Make API changes safer through versioning
- Provide comprehensive documentation for API consumers
- Ensure API design is consistent and follows best practices
- Reduce the cost of integration and maintenance

## What I define in an API contract

### Request specification
- **Endpoint**: URL path, HTTP method
- **Headers**: Required and optional headers with validation rules
- **Parameters**: Path parameters, query parameters, body schema
- **Authentication**: How to authenticate (tokens, API keys, etc.)
- **Content types**: Supported request content types (JSON, XML, etc.)
- **Validation rules**: Required fields, data types, formats, constraints
- **Examples**: Example requests for common use cases

### Response specification
- **Success responses**: Status codes, response body schema, headers
- **Error responses**: Error status codes, error body schema, error codes
- **Headers**: Response headers (caching, rate limits, etc.)
- **Content types**: Supported response content types
- **Examples**: Example responses for success and error cases
- **Rate limiting headers**: Information about rate limits and quotas

### Data models
- **Objects**: Detailed schema for all objects referenced in requests/responses
- **Enums**: Enumerated values with descriptions
- **Validation rules**: Constraints and validation for all fields
- **Relationships**: How objects relate to each other
- **Examples**: Example representations of all data models

### Behavior specification
- **Idempotency**: Whether operations are idempotent and how to handle retries
- **Caching**: Cacheability and caching strategies
- **Rate limiting**: Rate limit quotas and how limits are enforced
- **Pagination**: How pagination works for list endpoints
- **Sorting and filtering**: Supported sorting and filtering options
- **Webhooks**: Webhook notifications and event schemas
- **Async operations**: How to handle long-running operations

### Non-functional requirements
- **Performance**: Response time expectations, throughput requirements
- **Availability**: Uptime guarantees and maintenance windows
- **Security**: Security requirements, data protection measures
- **Scalability**: How the API scales with load
- **Observability**: Logging, metrics, and tracing support

## Versioning strategy

### Semantic versioning
- **Major version**: Breaking changes to contract
- **Minor version**: Non-breaking additions
- **Patch version**: Bug fixes without contract changes

### Best practices
- Use URL path versioning (e.g., `/api/v1/...`) for breaking changes
- Maintain backward compatibility when possible
- Deprecate endpoints before removing them
- Document migration paths between versions
- Communicate breaking changes clearly
- Support multiple versions during transition periods

## Contract testing

### Consumer-driven contracts
- Define expectations from consumer perspective
- Verify provider implementation matches consumer expectations
- Use tools like Pact for contract testing
- Test contracts as part of CI/CD pipeline

### Provider testing
- Validate responses match contract specification
- Test edge cases and error conditions
- Validate input validation and error handling
- Verify performance meets specified SLAs

## Documentation

### What to document
- Overview and purpose of the API
- Authentication and authorization
- All endpoints with full request/response details
- Data models with all fields and types
- Error codes and their meanings
- Rate limits and quotas
- Pagination, sorting, and filtering
- Webhooks and events
- Code examples in multiple languages
- SDKs and client libraries
- Changelog and version history

### Documentation best practices
- Keep documentation in sync with implementation
- Provide working examples
- Include common use cases and patterns
- Document edge cases and gotchas
- Provide troubleshooting guides
- Make documentation searchable
- Include quick start guides

## Contract evolution

### Making changes safely
- Prefer additive changes over breaking changes
- Add new optional fields before making them required
- Deprecate old fields before removing them
- Document all changes clearly
- Communicate changes to API consumers
- Provide migration guides for breaking changes
- Monitor usage of deprecated endpoints

### Breaking change checklist
- [ ] Is the change necessary?
- [ ] Can it be done without breaking existing consumers?
- [ ] Have all consumers been notified?
- [ ] Is there a migration path?
- [ ] Is the old version supported for a transition period?
- [ ] Is the documentation updated?
- [ ] Are tests updated to reflect the change?
- [ ] Is the changelog updated?

## Common API design patterns

### RESTful conventions
- Use appropriate HTTP verbs (GET, POST, PUT, DELETE, PATCH)
- Use noun-based resource paths
- Use plural nouns for collections
- Nest resources appropriately
- Use query parameters for filtering, sorting, pagination
- Use status codes correctly (200, 201, 400, 401, 403, 404, 500, etc.)

### GraphQL considerations
- Define clear schema with types and fields
- Document all types, fields, and arguments
- Specify resolver behaviors and side effects
- Define pagination connections and cursors
- Specify error handling and error codes
- Consider query complexity and depth limits

### RPC considerations
- Define service interfaces and method signatures
- Specify request and message types
- Document streaming behavior if applicable
- Specify timeout and retry behavior
- Define error codes and handling