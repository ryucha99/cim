// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API는 건드리지 않음
  if (pathname.startsWith('/api')) return NextResponse.next();

  // /admin 보호
  if (pathname.startsWith('/admin')) {
    // 로그인 페이지는 통과
    if (pathname === '/admin/login') return NextResponse.next();

    const cookie = req.cookies.get('admin_auth');
    if (cookie?.value !== 'ok') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// (선택) 매처로 /admin 하위에만 미들웨어 적용
export const config = {
  matcher: ['/admin/:path*', '/api/:path*'], // api는 위에서 즉시 통과시킴
};
