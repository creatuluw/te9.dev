/**
 * Result type pattern for functional error handling
 * Inspired by Rust's Result type - provides type-safe error handling
 */

/**
 * Result type that represents either success (Ok) or failure (Err)
 */
export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

/**
 * Success variant of Result
 */
export class Ok<T, E = Error> {
	readonly success = true as const;
	readonly value: T;

	constructor(value: T) {
		this.value = value;
	}

	/**
	 * Map the value if Result is Ok
	 */
	map<U>(fn: (value: T) => U): Result<U, E> {
		return ok(fn(this.value));
	}

	/**
	 * Map the error if Result is Err (no-op for Ok)
	 */
	mapErr<F>(_fn: (error: E) => F): Result<T, F> {
		return ok(this.value);
	}

	/**
	 * Unwrap the value (safe for Ok)
	 */
	unwrap(): T {
		return this.value;
	}

	/**
	 * Unwrap with default value (no-op for Ok)
	 */
	unwrapOr(_defaultValue: T): T {
		return this.value;
	}

	/**
	 * Unwrap or compute default (no-op for Ok)
	 */
	unwrapOrElse(_fn: (error: E) => T): T {
		return this.value;
	}

	/**
	 * Check if Result is Ok
	 */
	isOk(): this is Ok<T, E> {
		return true;
	}

	/**
	 * Check if Result is Err
	 */
	isErr(): this is Err<T, E> {
		return false;
	}
}

/**
 * Error variant of Result
 */
export class Err<T, E = Error> {
	readonly success = false as const;
	readonly error: E;

	constructor(error: E) {
		this.error = error;
	}

	/**
	 * Map the value if Result is Ok (no-op for Err)
	 */
	map<U>(_fn: (value: T) => U): Result<U, E> {
		return err(this.error);
	}

	/**
	 * Map the error if Result is Err
	 */
	mapErr<F>(fn: (error: E) => F): Result<T, F> {
		return err(fn(this.error));
	}

	/**
	 * Unwrap the value (throws for Err)
	 */
	unwrap(): never {
		if (this.error instanceof Error) {
			throw this.error;
		}
		throw new Error(String(this.error));
	}

	/**
	 * Unwrap with default value
	 */
	unwrapOr(defaultValue: T): T {
		return defaultValue;
	}

	/**
	 * Unwrap or compute default
	 */
	unwrapOrElse(fn: (error: E) => T): T {
		return fn(this.error);
	}

	/**
	 * Check if Result is Ok
	 */
	isOk(): this is Ok<T, E> {
		return false;
	}

	/**
	 * Check if Result is Err
	 */
	isErr(): this is Err<T, E> {
		return true;
	}
}

/**
 * Create an Ok result
 */
export function ok<T, E = Error>(value: T): Ok<T, E> {
	return new Ok(value);
}

/**
 * Create an Err result
 */
export function err<T, E = Error>(error: E): Err<T, E> {
	return new Err(error);
}

/**
 * Check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
	return result.success === true;
}

/**
 * Check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
	return result.success === false;
}

/**
 * Unwrap a Result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (result.success) {
		return result.value;
	}
	return result.unwrap();
}

/**
 * Unwrap a Result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
	if (result.success) {
		return result.value;
	}
	return defaultValue;
}

/**
 * Unwrap a Result or compute default from error
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
	if (result.success) {
		return result.value;
	}
	return fn(result.error);
}

/**
 * Map over the value in a Result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
	return result.map(fn);
}

/**
 * Map over the error in a Result
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
	return result.mapErr(fn);
}

/**
 * Chain Results together (flatMap)
 */
export function andThen<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Result<U, E>
): Result<U, E> {
	if (result.success) {
		return fn(result.value);
	}
	return err(result.error);
}

/**
 * Convert a Promise to a Result
 */
export async function toResult<T, E = Error>(
	promise: Promise<T>,
	mapError?: (error: unknown) => E
): Promise<Result<T, E>> {
	try {
		const value = await promise;
		return ok(value);
	} catch (error) {
		if (mapError) {
			return err(mapError(error));
		}
		return err(error as E);
	}
}

/**
 * Collect multiple Results into one
 */
export function collect<T, E>(results: Result<T, E>[]): Result<T[], E> {
	const values: T[] = [];
	for (const result of results) {
		if (result.success) {
			values.push(result.value);
		} else {
			return err(result.error);
		}
	}
	return ok(values);
}

/**
 * Collect Results that are Ok, ignore Err
 */
export function collectOk<T, E>(results: Result<T, E>[]): T[] {
	const values: T[] = [];
	for (const result of results) {
		if (result.success) {
			values.push(result.value);
		}
	}
	return values;
}

