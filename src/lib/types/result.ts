/**
 * Result type pattern for functional error handling
 * Inspired by Rust's Result type — provides type-safe error handling
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

	map<U>(fn: (value: T) => U): Result<U, E> {
		return ok(fn(this.value));
	}

	mapErr<F>(_fn: (error: E) => F): Result<T, F> {
		return ok(this.value);
	}

	unwrap(): T {
		return this.value;
	}

	unwrapOr(_defaultValue: T): T {
		return this.value;
	}

	unwrapOrElse(_fn: (error: E) => T): T {
		return this.value;
	}

	isOk(): this is Ok<T, E> {
		return true;
	}

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

	map<U>(_fn: (value: T) => U): Result<U, E> {
		return err(this.error);
	}

	mapErr<F>(fn: (error: E) => F): Result<T, F> {
		return err(fn(this.error));
	}

	unwrap(): never {
		if (this.error instanceof Error) {
			throw this.error;
		}
		throw new Error(String(this.error));
	}

	unwrapOr(defaultValue: T): T {
		return defaultValue;
	}

	unwrapOrElse(fn: (error: E) => T): T {
		return fn(this.error);
	}

	isOk(): this is Ok<T, E> {
		return false;
	}

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
