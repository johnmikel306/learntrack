
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { isValidRole, type UserRole } from '@/lib/auth-utils'

// Handle role assignment after sign-up
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the request body to get the selected role
    const body = await request.json()
    const { role } = body

    // Validate the role using our utility function
    if (!role || !isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided. Must be one of: tutor, student, parent' },
        { status: 400 }
      )
    }

    // Update the user's metadata with the selected role
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Role assigned successfully',
        role: role
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's current role
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's current role
    const user = await clerkClient.users.getUser(userId)
    const role = user.publicMetadata?.role

    return NextResponse.json(
      {
        success: true,
        role: role || null,
        hasRole: !!role
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error getting user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Legacy callback handler for existing flows
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('__clerk_created_session')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
  }

  try {
    const session = await clerkClient.sessions.getSession(sessionId)
    const userId = session.userId

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = await clerkClient.users.getUser(userId)
    const role = user.unsafeMetadata?.role

    if (role && isValidRole(role)) {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          role: role,
        },
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role: undefined, // Clear the role from unsafeMetadata
        },
      })
    }

    return NextResponse.redirect(new URL('/dashboard', req.url))
  } catch (error) {
    console.error('Error in auth callback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
