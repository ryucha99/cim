import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PATH = '/admin';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    const cookie = req.cookies.get('admin_auth');
    if (cookie?.value !== 'ok') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}
