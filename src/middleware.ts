import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const host = request.headers.get("host") ?? "";
  if (host === "lofthouse14.com") {
    const url = request.nextUrl.clone();
    url.host = "www.lofthouse14.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
