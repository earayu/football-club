import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Paths that logged-in users should be redirected away from
const AUTH_ONLY_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { response, user } = await updateSession(request, intlResponse);

  if (user) {
    const pathname = request.nextUrl.pathname;
    // Strip locale prefix to get the actual path
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

    if (AUTH_ONLY_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
      const locale = pathname.split("/")[1] || "en";
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
