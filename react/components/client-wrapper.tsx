"use client"

import { ClerkProvider, useUser } from '@clerk/nextjs'
import { SchematicProvider, useSchematicEvents } from '@schematichq/schematic-react'
import { useEffect } from 'react'

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

export const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <SchematicProvider publishableKey={process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY || ''}>
        <SchematicWrapper>{children}</SchematicWrapper>
      </SchematicProvider>
    </ClerkProvider>
  )
}
