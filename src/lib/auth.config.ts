import type { NextAuthConfig } from 'next-auth';

// Edge-runtime-safe config — no Prisma, no bcrypt, no Node.js-only modules.
// Used by the middleware (proxy.ts) which runs in the Edge runtime.
// The full config (with Credentials provider + Prisma) lives in auth.ts.
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, trigger, session: sessionData }: any) {
      if (trigger === 'update' && sessionData) {
        const d = sessionData as Record<string, unknown>;
        if (d.profileImage !== undefined) token.profileImage = d.profileImage as string;
        if (d.name !== undefined) token.name = d.name as string;
      }
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = user.id;
        token.qrCodeId = u.qrCodeId as string | undefined;
        token.profileImage = u.profileImage as string | undefined;
        token.phone = u.phone as string | undefined;
        token.isAdmin = u.isAdmin as boolean | undefined;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        const su = session.user as unknown as Record<string, unknown>;
        su.qrCodeId = token.qrCodeId;
        su.profileImage = token.profileImage;
        su.phone = token.phone;
        su.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
