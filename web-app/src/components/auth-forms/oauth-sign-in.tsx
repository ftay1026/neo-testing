'use client'

import { signInWithOAuth } from '@/utils/auth-helpers/client'
import { type Provider } from '@supabase/supabase-js'
import GoogleButton from '@/components/google/google-button'
import { JSX } from "react";

type OAuthProviders = {
  name: Provider
  displayName: string
  icon: JSX.Element
}

export default function OauthSignIn() {
  const oAuthProviders: OAuthProviders[] = [
    {
      name: 'google',
      displayName: 'Google',
      icon: <GoogleButton />
    }
    /* Add desired OAuth providers here */
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    await signInWithOAuth(e)
  }

  return (
    <div className="flex justify-center">
      {oAuthProviders.map((provider) => (
        <form
          key={provider.name}
          className=""
          onSubmit={(e) => handleSubmit(e)}
        >
          <input type="hidden" name="provider" value={provider.name} />
          <div className="flex justify-center">
            {provider.icon}
          </div>
        </form>
      ))}
    </div>
  )
}