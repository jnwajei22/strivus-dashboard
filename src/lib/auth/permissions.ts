// src/lib/auth/permissions.ts

export const PERMISSIONS = {
  // Patients
  PATIENTS_READ: "patients:read",
  PATIENTS_CREATE: "patients:create",
  PATIENTS_UPDATE: "patients:update",
  PATIENTS_DELETE: "patients:delete",

  // Devices
  DEVICES_READ: "devices:read",
  DEVICES_REGISTER: "devices:register",
  DEVICES_UPDATE: "devices:update",
  DEVICES_ACTIONS: "devices:actions",
  DEVICES_DELETE: "devices:delete",

  // Firmware
  FIRMWARE_READ: "firmware:read",
  FIRMWARE_CREATE: "firmware:create",
  FIRMWARE_UPDATE: "firmware:update",
  FIRMWARE_DEPLOY: "firmware:deploy",
  FIRMWARE_DELETE: "firmware:delete",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE_PROFILE: "settings:update_profile",
  SETTINGS_UPDATE_SYSTEM: "settings:update_system",

  // Logs
  LOGS_READ: "logs:read",
  LOGS_CREATE: "logs:create",
  LOGS_UPDATE: "logs:update",
  LOGS_DELETE: "logs:delete",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS = {
  patients: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.PATIENTS_DELETE,
  ],
  devices: [
    PERMISSIONS.DEVICES_READ,
    PERMISSIONS.DEVICES_REGISTER,
    PERMISSIONS.DEVICES_UPDATE,
    PERMISSIONS.DEVICES_ACTIONS,
    PERMISSIONS.DEVICES_DELETE,
  ],
  firmware: [
    PERMISSIONS.FIRMWARE_READ,
    PERMISSIONS.FIRMWARE_CREATE,
    PERMISSIONS.FIRMWARE_UPDATE,
    PERMISSIONS.FIRMWARE_DEPLOY,
    PERMISSIONS.FIRMWARE_DELETE,
  ],
  settings: [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_PROFILE,
    PERMISSIONS.SETTINGS_UPDATE_SYSTEM,
  ],
  logs: [
    PERMISSIONS.LOGS_READ,
    PERMISSIONS.LOGS_CREATE,
    PERMISSIONS.LOGS_UPDATE,
    PERMISSIONS.LOGS_DELETE,
  ],
} as const;

export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  CLINICIAN_PROVIDER: "clinician_provider",
  OPERATIONS_SUPPORT: "operations_support",
  VIEWER_READ_ONLY: "viewer_read_only",
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  [ROLE_KEYS.SUPER_ADMIN]: [...ALL_PERMISSIONS],

  [ROLE_KEYS.CLINICIAN_PROVIDER]: [
    // Patients = Full
    ...PERMISSION_GROUPS.patients,

    // Devices = Read + Actions
    PERMISSIONS.DEVICES_READ,
    PERMISSIONS.DEVICES_ACTIONS,

    // Firmware = Read
    PERMISSIONS.FIRMWARE_READ,

    // Settings = Profile Only
    PERMISSIONS.SETTINGS_UPDATE_PROFILE,

    // Logs = Read + Create
    PERMISSIONS.LOGS_READ,
    PERMISSIONS.LOGS_CREATE,
  ],

  [ROLE_KEYS.OPERATIONS_SUPPORT]: [
    // Patients = Read
    PERMISSIONS.PATIENTS_READ,

    // Devices = Full
    ...PERMISSION_GROUPS.devices,

    // Firmware = Full
    ...PERMISSION_GROUPS.firmware,

    // Settings = System
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_SYSTEM,

    // Logs = Full
    ...PERMISSION_GROUPS.logs,
  ],

  [ROLE_KEYS.VIEWER_READ_ONLY]: [
    // Patients = Read
    PERMISSIONS.PATIENTS_READ,

    // Devices = Read
    PERMISSIONS.DEVICES_READ,

    // Firmware = Read
    PERMISSIONS.FIRMWARE_READ,

    // Settings = Profile Only
    PERMISSIONS.SETTINGS_UPDATE_PROFILE,

    // Logs = Read
    PERMISSIONS.LOGS_READ,
  ],
};

export function hasPermission(
  userPermissions: string[] | undefined | null,
  permission: Permission
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.includes(permission);
}

export function hasAnyPermission(
  userPermissions: string[] | undefined | null,
  permissions: Permission[]
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return permissions.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(
  userPermissions: string[] | undefined | null,
  permissions: Permission[]
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return permissions.every((permission) => userPermissions.includes(permission));
}

export function getRolePermissions(roleKey: string): Permission[] {
  return ROLE_PERMISSIONS[roleKey as RoleKey] ?? [];
}
