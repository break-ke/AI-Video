import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/sign-in", "/api/auth", "/uploads"];

export default auth((req) => {
  if (!req.auth && !publicPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
