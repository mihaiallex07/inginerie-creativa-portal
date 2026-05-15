export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redirect to Google OAuth login — fetches the URL from backend so it works on any domain
export const redirectToLogin = async () => {
  const origin = window.location.origin;
  const res = await fetch(`/api/oauth/google-url?origin=${encodeURIComponent(origin)}`);
  const data = await res.json();
  window.location.href = data.url;
};

// Legacy sync alias kept for backward compatibility — use redirectToLogin() instead
export const getLoginUrl = () => {
  // Returns a placeholder; use redirectToLogin() for actual navigation
  return `/api/oauth/google-url?origin=${encodeURIComponent(window.location.origin)}`;
};
