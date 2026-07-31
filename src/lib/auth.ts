const COOKIE_NAME = 'workout_auth';

export const authLib = {
  getValidTokens(): string[] {
    const tokensStr = import.meta.env.VITE_AUTH_TOKENS || '';
    return tokensStr.split(',').map((t: string) => t.trim()).filter(Boolean);
  },

  getStoredToken(): string | null {
    // 1. Check URL search param (?token=XYZ)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        // Save to localStorage & cookie
        this.saveToken(urlToken);
        // Clean URL without reloading page
        params.delete('token');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        return urlToken;
      }

      // 2. Check localStorage
      const localToken = localStorage.getItem(COOKIE_NAME);
      if (localToken) return localToken;

      // 3. Check Cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === COOKIE_NAME) return value;
      }
    }
    return null;
  },

  saveToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_NAME, token);
      document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(COOKIE_NAME);
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
    }
  },

  isAuthenticated(): boolean {
    const validTokens = this.getValidTokens();
    // Si no hay tokens configurados en el entorno, permitir acceso
    if (validTokens.length === 0) return true;

    const token = this.getStoredToken();
    return !!(token && validTokens.includes(token));
  }
};
