import HeaderAuth from "@/components/header-auth";
import Link from "next/link";
import OauthSignIn from "@/components/auth-forms/oauth-sign-in"

export default function SignIn() {
  return (
    <main className="min-h-dvh flex flex-col bg-background">
      <nav className="w-full max-w-7xl mx-auto h-16 flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="font-heading font-bold text-2xl sm:text-3xl">
          <Link href="/">NEO</Link>
        </div>
        <HeaderAuth />
      </nav>

      <section className="w-full max-w-7xl mx-auto flex-1 flex items-center justify-center py-16 md:py-24 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl p-8 shadow-lg text-foreground border border-foreground/10">
              <h2 className="font-heading text-2xl font-bold mb-6">Sign in to NEO</h2>
              <OauthSignIn />
              <p className="text-sm text-foreground/70 text-center mt-6">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}