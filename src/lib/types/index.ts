export { type Result, Ok, Err, ok, err, isOk, isErr, unwrap, unwrapOr, unwrapOrElse, map, mapErr, andThen, toResult, collect, collectOk } from './result';

export {
	ErrorCode,
	AppError,
	ValidationError,
	NetworkError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
	getUserMessage,
	isRetryableError,
	getErrorSeverity,
	type ErrorSeverity,
} from './errors';
