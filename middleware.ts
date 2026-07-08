import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApi) return NextResponse.next();

  const session = req.cookies.get("llb_session")?.value;
  if (session !== "admin-session") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
