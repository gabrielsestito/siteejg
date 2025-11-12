import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth } from "next-auth/middleware";

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isDeliveryRoute = request.nextUrl.pathname.startsWith("/delivery");

  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // @ts-ignore - role exists in token
    const role = token.role as string | undefined;
    const allowedRoles = ["ADMIN", "FINANCIAL", "MANAGEMENT"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isDeliveryRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // @ts-ignore - role exists in token
    const role = token.role as string | undefined;
    if (!role || role !== "DELIVERY") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/delivery/:path*"],
}; 