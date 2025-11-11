import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Get domains from environment variables
  const marketingTargetUrl = process.env.NEXT_PUBLIC_MARKETING_TARGET_URL || 'https://felix-tay.systeme.io/neo-beta';
  
  // Handle /home route - always rewrite to marketing content (for both authenticated and unauthenticated users)
  if (pathname === '/home') {
    return NextResponse.rewrite(`${marketingTargetUrl}`);
  }
  
  // For all other routes, handle authentication logic
  return handleAppLogic(request);
};

async function handleAppLogic(request: NextRequest, isDevelopment: boolean = false) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Handle home page (/) redirects based on authentication status
    if (pathname === "/") {
      if (user.error) {
        // User is not authenticated, redirect to marketing page
        return NextResponse.redirect(new URL("/home", request.url));
      } else {
        // User is authenticated, redirect to app
        return NextResponse.redirect(new URL("/app", request.url));
      }
    }

    // Protected routes - redirect to sign-in if not authenticated
    if (pathname.startsWith("/app") && user.error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return response;
  } catch (e) {
    console.log('error in supabase middleware client', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};