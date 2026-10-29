"use client"

import { ClerkProvider, useUser } from '@clerk/nextjs'
import { SchematicProvider, useSchematicEvents } from '@schematichq/schematic-react'
import { useEffect, useMemo } from 'react'

// The billing hooks call this once per session, and again on a 401.
const fetchAccessToken = async () => {
  const response = await fetch('/api/accessToken')
  const result = await response.json()
  if (!result.accessToken) throw new Error(result.message ?? 'No access token')
  return result.accessToken as string
}

const SchematicWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, user, isLoaded } = useUser()
  const { identify } = useSchematicEvents()

  const clerkId = user?.id
  const email = user?.primaryEmailAddress?.emailAddress

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkId) {
      identify({
        keys: {
          clerkid: clerkId,
          email: email || "",
        },
        name: email,
        company: {
          keys: {
            'id': 'demo',
          },
        },
      })
    }
  }, [isLoaded, isSignedIn, clerkId, email, identify])

  return <>{children}</>
}

const SchematicSession = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, user } = useUser()
  const clerkId = user?.id

  // Undefined until Clerk knows who's here, so the billing hooks wait rather
  // than load under one session and immediately switch to another.
  const session = useMemo(
    () => (isLoaded ? { company: 'demo', user: clerkId, token: fetchAccessToken } : undefined),
    [isLoaded, clerkId],
  )

  return (
    <SchematicProvider
      publishableKey={process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY || ''}
      session={session}
    >
      <SchematicWrapper>{children}</SchematicWrapper>
    </SchematicProvider>
  )
}

export const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <SchematicSession>{children}</SchematicSession>
    </ClerkProvider>
  )
}
