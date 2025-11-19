export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reader/:path*',
    '/digests/:path*',
    '/settings/:path*',
    '/analytics/:path*',
    '/api/feeds/:path*',
    '/api/items/:path*',
    '/api/digests/:path*',
    '/api/preferences/:path*',
    '/api/analytics/:path*',
  ],
}
