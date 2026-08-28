export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export function success<T>(
  data: T,
  message = "Success",
  status = 200
): Response {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function created<T>(
  data: T,
  message = "Created successfully"
): Response {
  return success(data, message, 201);
}

export function error(
  message: string,
  status = 400,
  errors?: unknown
): Response {
  const body: ApiResponse = {
    success: false,
    message,
    errors,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function unauthorized(
  message = "Unauthorized"
): Response {
  return error(message, 401);
}

export function forbidden(
  message = "Forbidden"
): Response {
  return error(message, 403);
}

export function notFound(
  message = "Resource not found"
): Response {
  return error(message, 404);
}

export function conflict(
  message = "Conflict"
): Response {
  return error(message, 409);
}

export function serverError(
  err: unknown
): Response {

  console.error(err);

  return error(
    "Internal Server Error",
    500,
    err instanceof Error ? err.message : err
  );
}