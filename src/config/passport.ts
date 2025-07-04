import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OIDCStrategy as MicrosoftStrategy } from 'passport-azure-ad';

import { config } from '@/config';
import prisma from '@/db';

/**
 * Configure Passport.js strategies for authentication.
 */
// Serialize/deserialize user for session support
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Helper to check if all values are set
function allSet(obj: Record<string, string | undefined | null>): boolean {
  return Object.values(obj).every(v => typeof v === 'string' && v.trim() !== '');
}

// Google OAuth Strategy
if (allSet({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: config.GOOGLE_CALLBACK_URL,
})) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google account email not found.'), null);
          }
          
          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (user) {
            // If user exists but googleId is not set, link the account
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, provider: 'google' },
              });
            }
          } else {
            // Create new user if not found
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email,
                username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substring(2, 6),
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                provider: 'google',
                isEmailVerified: true,
                password: '', // Not used for OAuth
              },
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error, null);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('[Passport] Google OAuth strategy not registered: missing config');
}

// Microsoft OAuth Strategy
if (allSet({
  clientID: config.MICROSOFT_CLIENT_ID,
  clientSecret: config.MICROSOFT_CLIENT_SECRET,
  redirectUrl: config.MICROSOFT_CALLBACK_URL,
})) {
  passport.use(
    new MicrosoftStrategy(
      {
        identityMetadata: `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration`,
        clientID: config.MICROSOFT_CLIENT_ID,
        clientSecret: config.MICROSOFT_CLIENT_SECRET,
        responseType: 'code',
        responseMode: 'form_post',
        redirectUrl: config.MICROSOFT_CALLBACK_URL,
        scope: ['profile', 'email'],
        allowHttpForRedirectUrl: true, // For development
        passReqToCallback: false,
      },
      async (iss, sub, profile, accessToken, refreshToken, done) => {
        try {
          const email = profile._json.email || profile._json.preferred_username;
          if (!email) {
              return done(new Error('Microsoft account email not found.'), null);
          }

          let user = await prisma.user.findFirst({
              where: { OR: [{ microsoftId: profile.oid }, { email }] },
          });

          if (user) {
              if (!user.microsoftId) {
                  user = await prisma.user.update({
                      where: { id: user.id },
                      data: { microsoftId: profile.oid, provider: 'microsoft' },
                  });
              }
          } else {
              user = await prisma.user.create({
                  data: {
                      microsoftId: profile.oid,
                      email,
                      username: (profile.displayName?.replace(/\s+/g, '').toLowerCase() || 'user') + Math.random().toString(36).substring(2, 6),
                      firstName: profile.name?.givenName || '',
                      lastName: profile.name?.familyName || '',
                      provider: 'microsoft',
                      isEmailVerified: true,
                      password: '',
                  },
              });
          }
          return done(null, user);
      } catch (err) {
          return done(err as Error, null);
      }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('[Passport] Microsoft OAuth strategy not registered: missing config');
}

export default passport; 