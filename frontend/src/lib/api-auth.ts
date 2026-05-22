import { NextResponse } from 'next/server';
import { authHelpers } from '@/modules/auth/auth.helpers';

/**
 * Middleware wrapper for API routes to enforce authentication and RBAC.
 * @param requiredRole If specified, the user must have this role.
 * @param handler The actual API route handler.
 */
export function withAuth(
  handler: (req: Request, user: any) => Promise<NextResponse>,
  requiredRole?: 'user' | 'vendor' | 'admin'
) {
  return async (req: Request) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      const decodedUser = authHelpers.verifyToken(token);

      if (!decodedUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
      }

      if (requiredRole && decodedUser.role !== requiredRole && decodedUser.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
      }

      // Proceed with the request, passing the decoded user
      return await handler(req, decodedUser);
    } catch (err: any) {
      console.error('[API AUTH ERROR]', err);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
