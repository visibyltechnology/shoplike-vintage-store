import { getAdminToken } from "./api";

export const customFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};
