---
type: Learning
title: Result Monad Pattern
description: Using a Rust-style Ok/Err Result type for error handling
timestamp: "2026-06-25T18:30:00.000Z"
---

# Result Monad Pattern

The te9.dev codebase uses a custom Result monad (`src/lib/types/result.ts`) inspired by Rust's `Result<T, E>` type. It exports `Ok`, `Err`, `ok`, `err`, `isOk`, `isErr`, `unwrap`, `unwrapOr`, `unwrapOrElse`, `map`, `mapErr`, `andThen`, `toResult`, `collect`, and `collectOk`.

This avoids try/catch for expected errors and enables functional error chaining. The error types (`src/lib/types/errors.ts`) include:

- `AppError` — base class with `code`, `details`, `timestamp`, `originalError`
- `ValidationError` — input validation failures (400-level)
- `NetworkError` — network failures with optional `statusCode` and `url`
- `NotFoundError` — resource not found (404)
- `UnauthorizedError` — authentication required (401)
- `ForbiddenError` — access denied (403)

The `ErrorCode` enum categorizes errors into validation, auth, not-found, network, server, business-logic, and unknown. Helper functions `getUserMessage`, `isRetryableError`, and `getErrorSeverity` provide consistent error presentation across the app.
