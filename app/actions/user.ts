'use server'

import { clerkClient } from '@clerk/nextjs/server'

export async function updateUserRole(userId: string, role: string) {
  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to update user role:', error)
    return { success: false, error: 'Failed to update role.' }
  }
}
