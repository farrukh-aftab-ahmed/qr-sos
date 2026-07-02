import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      qrCodeId?: string;
      profileImage?: string;
      phone?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    qrCodeId?: string;
    profileImage?: string;
    phone?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    qrCodeId?: string;
    profileImage?: string;
    phone?: string;
  }
}
