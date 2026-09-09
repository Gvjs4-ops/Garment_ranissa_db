import { supabase } from "../lib/supabase";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      `Failed to read login session: ${error.message}`
    );
  }

  if (!session) {
    throw new Error(
      "No Supabase login session found"
    );
  }

  if (!session.access_token) {
    throw new Error(
      "Supabase session exists but access token is missing"
    );
  }

  const headers = new Headers(
    options.headers || {}
  );

  headers.set(
    "Content-Type",
    "application/json"
  );

  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message =
      `Request failed: ${response.status}`;

    try {
      const errorData =
        await response.json();

      message =
        errorData.detail ||
        errorData.message ||
        message;
    } catch {
      // Non-JSON response
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
