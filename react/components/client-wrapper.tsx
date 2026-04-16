"use client"

import { ClerkProvider, useUser } from '@clerk/nextjs'
import { SchematicProvider, useSchematicEvents } from '@schematichq/schematic-react'
import { useEffect } from 'react'

const SchematicWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, user, isLoaded } = useUser()
  const { identify } = useSchematicEvents()

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      identify({
        keys: { 
          clerkid: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        name: user.primaryEmailAddress?.emailAddress,
        company: {
          keys: {
            'id': 'demo',
          },
        },
      })
    }
  }, [isLoaded, isSignedIn, user, identify])

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
