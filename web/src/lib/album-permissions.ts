import { AlbumRole } from '@prisma/client';

export type AlbumPermission =
  | 'view'
  | 'upload'
  | 'edit_metadata'
  | 'manage_members'
  | 'delete_any_item'
  | 'delete_album';

const ROLE_PERMISSIONS: Record<AlbumRole, AlbumPermission[]> = {
  owner: ['view', 'upload', 'edit_metadata', 'manage_members', 'delete_any_item', 'delete_album'],
  co_owner: ['view', 'upload', 'edit_metadata', 'manage_members', 'delete_any_item'],
  contributor: ['view', 'upload'],
};

/**
 * Get permissions for a user's role in an album
 */
export function getAlbumPermissions(role: AlbumRole | null): AlbumPermission[] {
  if (!role) {
    return ['view']; // Public viewer
  }
  return ROLE_PERMISSIONS[role] || ['view'];
}

/**
 * Check if a role has a specific permission
 */
export function hasAlbumPermission(role: AlbumRole | null, permission: AlbumPermission): boolean {
  const permissions = getAlbumPermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if user can delete an album item
 * Owner/co-owner can delete any item, contributors can only delete their own
 */
export function canDeleteAlbumItem(
  role: AlbumRole | null,
  isItemUploader: boolean
): boolean {
  if (!role) return false;
  if (role === 'owner' || role === 'co_owner') return true;
  if (role === 'contributor' && isItemUploader) return true;
  return false;
}

/**
 * Check if user can edit an album item (caption, order)
 * Owner/co-owner can edit any item, contributors can only edit their own
 */
export function canEditAlbumItem(
  role: AlbumRole | null,
  isItemUploader: boolean
): boolean {
  if (!role) return false;
  if (role === 'owner' || role === 'co_owner') return true;
  if (role === 'contributor' && isItemUploader) return true;
  return false;
}

/**
 * Check if a user can invite others with a specific role
 * Owners can invite anyone with any role (including co-owners)
 * Co-owners can only invite contributors
 */
export function canInviteWithRole(
  inviterRole: AlbumRole | null,
  targetRole: AlbumRole
): boolean {
  if (!inviterRole) return false;
  if (inviterRole === 'owner') return true;
  if (inviterRole === 'co_owner' && targetRole === 'contributor') return true;
  return false;
}

/**
 * Check if a user can change another member's role
 * Owners can change any role
 * Co-owners can only promote/demote contributors
 */
export function canChangeRole(
  changerRole: AlbumRole | null,
  targetCurrentRole: AlbumRole,
  targetNewRole: AlbumRole
): boolean {
  if (!changerRole) return false;
  if (changerRole === 'owner') {
    // Owner can change any role except their own
    return targetCurrentRole !== 'owner';
  }
  if (changerRole === 'co_owner') {
    // Co-owner can only manage contributors
    return targetCurrentRole === 'contributor' && targetNewRole === 'contributor';
  }
  return false;
}

/**
 * Check if a user can remove another member
 * Owners can remove anyone except themselves
 * Co-owners can only remove contributors
 */
export function canRemoveMember(
  removerRole: AlbumRole | null,
  targetRole: AlbumRole
): boolean {
  if (!removerRole) return false;
  if (removerRole === 'owner') return targetRole !== 'owner';
  if (removerRole === 'co_owner') return targetRole === 'contributor';
  return false;
}

// Album tier limits
export const ALBUM_LIMITS = {
  free: 3,
  standard: Infinity,
  pro: Infinity,
} as const;
