import { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'auth_token';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
