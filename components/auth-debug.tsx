'use client'

import { useUser } from '@clerk/nextjs'

export default function AuthDebug() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (typeof window === 'undefined') return null

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm z-50 opacity-80">
      <div>isLoaded: {String(isLoaded)}</div>
      <div>isSignedIn: {String(isSignedIn)}</div>
      <div>userId: {user?.id || 'none'}</div>
      <div>role: {String(user?.publicMetadata?.role) || 'none'}</div>
      <div>path: {window.location.pathname}</div>
    </div>
  )
}

