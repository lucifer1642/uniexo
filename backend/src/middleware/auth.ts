import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { supabase } from '../config/supabase';
import { firebaseDb } from '../config/firebase';
import { logger } from '../config/logger';

/**
 * Authenticate middleware — verifies the Supabase JWT from the Authorization header
 * and attaches the user profile to the request.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[AUTH] Missing or malformed Authorization header');
      throw new UnauthorizedError('No authentication token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
      logger.warn(`[AUTH] Invalid token format detected: "${token?.substring(0, 10)}..."`);
      throw new UnauthorizedError('The authentication token provided is invalid or malformed.');
    }

    // 2. Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.error('[AUTH] Supabase getUser failed', { 
        code: authError?.status, 
        message: authError?.message,
        tokenPrefix: token.substring(0, 15)
      });
      
      const message = authError?.message?.includes('JWT') 
        ? 'Your session has expired or is invalid. Please log in again.' 
        : `Authentication failed: ${authError?.message || 'User session not found'}`;
      
      throw new UnauthorizedError(message);
    }

    // 3. Fetch the profile from public.profiles
    // Note: We use maybeSingle() to prevent .single() from throwing if no row is found
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, name, is_deleted, is_suspended')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error(`[AUTH] Profile fetch error for ${user.id}`, { error: profileError.message });
      throw new UnauthorizedError('Platform error: Unable to verify your profile at this time.');
    }

    if (!profile) {
      logger.warn(`[AUTH] No profile found for user ${user.id} (${user.email}). Auto-creating...`);
      const meta = user.user_metadata || {};
      
      const newProfile: any = {
         id: user.id,
         email: user.email,
         role: meta.role || 'user',
         name: meta.name || user.email?.split('@')[0] || 'User',
         phone: meta.phone || null,
         business_name: meta.business_name || meta.businessName || null,
         service_type: meta.service_type || meta.serviceType || null,
         university_id: meta.university_id || meta.universityId || null,
         location: meta.location || null,
         kyc_status: 'none',
      };
      
      // Filter out nulls for a cleaner upsert
      Object.keys(newProfile).forEach(key => (newProfile[key] === null) && delete newProfile[key]);
      
      const { data: createdProfile, error: createError } = await supabase
         .from('profiles')
         .upsert(newProfile, { onConflict: 'id', ignoreDuplicates: false })
         .select('id, email, role, name, is_deleted, is_suspended')
         .single();
         
      if (createError || !createdProfile) {
         logger.error(`[AUTH] Profile upsert failed for ${user.id}`, { 
           error: createError?.message || createError,
           details: createError?.details,
           code: createError?.code
         });
         throw new UnauthorizedError(`Database synchronization failed: ${createError?.message || 'Check your registration details'}`);
      }
      profile = createdProfile;

      // SYNC SPECIALIZED OPTIONS (Laundy, PG, Bike etc.)
      const serviceType = (meta.service_type || meta.serviceType || '').toLowerCase();
      const specializedData: any = {};

      if (profile.role === 'vendor') {
         if (serviceType === 'laundry') {
            logger.info(`[AUTH] Syncing Laundry options for vendor ${user.id}`);
            const laundryData = {
               vendor_id: user.id,
               name: meta.business_name || meta.businessName || `${profile.name}'s Laundry`,
               onsite_pickup: meta.onsite_pickup ?? meta.onsitePickup ?? false,
               on_store_service: meta.on_store_service ?? meta.onStoreService ?? true,
               onsite_pickup_charge: Number(meta.onsite_pickup_charge ?? meta.onsitePickupCharge ?? 0),
               provider_name: meta.name || profile.name,
               provider_phone: meta.phone || null,
            };
            specializedData.laundry = laundryData;
            await supabase.from('laundry_services').upsert(laundryData, { onConflict: 'vendor_id' });
         } else if (serviceType === 'house' || serviceType === 'house_rental') {
            logger.info(`[AUTH] Initializing PG options for vendor ${user.id}`);
         } else if (serviceType === 'vehicle' || serviceType === 'bike_rental') {
            logger.info(`[AUTH] Initializing Vehicle options for vendor ${user.id}`);
         }
      }

      // DUAL SYNC TO FIREBASE
      try {
         await firebaseDb.ref(`profiles/${user.id}`).set({
            ...newProfile,
            ...specializedData,
            lastSynced: new Date().toISOString()
         });
         logger.info(`[AUTH] Dual-sync successful for ${user.id} to Firebase`);
      } catch (fbError) {
         logger.warn(`[AUTH] Firebase sync failed but Supabase succeeded for ${user.id}`, fbError);
      }
    }

    if (profile.is_deleted) {
      logger.warn(`[AUTH] Access denied for deleted account: ${user.id}`);
      throw new UnauthorizedError('This account has been permanently deleted.');
    }

    if (profile.is_suspended) {
      logger.warn(`[AUTH] Access denied for suspended account: ${user.id}`);
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    // 4. Attach to request
    (req as AuthRequest).user = {
      userId: profile.id,
      role: profile.role,
      email: profile.email,
      name: profile.name
    };

    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('DEBUG [Auth Middleware Failure]:', error);
    }
    next(error);
  }
};

/**
 * Optional auth — silently continues if no token or invalid token is provided.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) return next();

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return next();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      (req as AuthRequest).user = {
        userId: profile.id,
        role: profile.role,
        email: profile.email,
        name: profile.name
      };
    }
    next();
  } catch (err) {
    logger.debug('[AUTH] Optional auth suppressed error:', err);
    next();
  }
};
