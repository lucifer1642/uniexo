/**
 * Client-side auth helpers. 
 * Only perform non-cryptographic checks (like expiration).
 */
export const authClient = {
    /**
     * Decode a JWT-like token without verifying signature.
     * Handles base64url encoding with proper padding.
     */
    decodeToken(token: string) {
        try {
            if (!token || typeof token !== 'string') return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const body = parts[1];
            if (!body) return null;
            
            // Convert base64url to standard base64, then add padding
            const base64 = body.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            
            return JSON.parse(atob(padded));
        } catch {
            return null;
        }
    },

    /**
     * Check if a token is expired.
     */
    isTokenExpired(token: string) {
        try {
            const payload = this.decodeToken(token);
            if (!payload || !payload.exp) return true;
            
            const now = Math.floor(Date.now() / 1000);
            return now > payload.exp;
        } catch {
            return true;
        }
    }
};
