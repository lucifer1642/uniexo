/**
 * Client-side auth helpers. 
 * Only perform non-cryptographic checks (like expiration).
 */
export const authClient = {
    /**
     * Decode a JWT-like token without verifying signature.
     */
    decodeToken(token: string) {
        try {
            const [, body] = token.split('.');
            if (!body) return null;
            return JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
        } catch {
            return null;
        }
    },

    /**
     * Check if a token is expired.
     */
    isTokenExpired(token: string) {
        const payload = this.decodeToken(token);
        if (!payload || !payload.exp) return true;
        
        const now = Math.floor(Date.now() / 1000);
        return now > payload.exp;
    }
};
