/**
 * Authentication and role management utilities
 */

export const VALID_ROLES = ['tutor', 'student', 'parent'] as const
export type UserRole = typeof VALID_ROLES[number]

/**
 * Validates if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole)
}

/**
 * Gets the display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    tutor: 'Tutor',
    student: 'Student', 
    parent: 'Parent'
  }
  return roleNames[role]
}

/**
 * Gets the role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions = {
    tutor: 'Create assignments, manage students, and track progress',
    student: 'Complete assignments, track your progress, and learn',
    parent: 'Monitor your child\'s progress and communicate with tutors'
  }
  return descriptions[role]
}

/**
 * Gets the role features list
 */
export function getRoleFeatures(role: UserRole): string[] {
  const features = {
    tutor: [
      'AI-powered question generation',
      'Student progress tracking', 
      'Assignment management',
      'Parent communication'
    ],
    student: [
      'Interactive assignments',
      'Personal progress tracking',
      'Achievement system',
      'Real-time feedback'
    ],
    parent: [
      'Child progress monitoring',
      'Performance insights',
      'Tutor communication',
      'Assignment tracking'
    ]
  }
  return features[role]
}

/**
 * Safely assigns a role to a user via API
 */
export async function assignUserRole(role: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidRole(role)) {
      return { success: false, error: 'Invalid role provided' }
    }

    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Failed to assign role' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error assigning role:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error occurred' 
    }
  }
}

/**
 * Clears temporary role storage
 */
export function clearTemporaryRole(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('selectedRole')
  }
}

/**
 * Gets temporary role from storage
 */
export function getTemporaryRole(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('selectedRole')
  }
  return null
}

/**
 * Sets temporary role in storage
 */
export function setTemporaryRole(role: UserRole): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('selectedRole', role)
  }
}
