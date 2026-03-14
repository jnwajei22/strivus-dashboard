export type UserRole = 'super_admin' | 'clinician' | 'operations' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  lastLogin: string;
}

export type PatientStatus = 'active' | 'inactive' | 'discharged';
export type DeploymentGroup = 'production' | 'qa' | 'test';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: 'M' | 'F' | 'Other';
  email: string;
  phone: string;
  clinicianId: string;
  status: PatientStatus;
  notes: string;
  enrolledAt: string;
  deviceId?: string;
  height?: string;
  weight?: string;
  medicareId?: string;
  providerFacility?: string;
  deploymentGroup?: DeploymentGroup;
}

export type DeviceStatus = 'online' | 'offline' | 'syncing' | 'warning' | 'idle';

export interface Device {
  id: string;
  serialNumber: string;
  model: string;
  firmwareVersion: string;
  status: DeviceStatus;
  battery: number;
  signal: number;
  lastSync: string;
  lastContact: string;
  patientId?: string;
}

export type SessionStatus = 'completed' | 'in_progress' | 'cancelled';

export interface WorkoutSession {
  id: string;
  patientId: string;
  deviceId: string;
  startedAt: string;
  endedAt?: string;
  duration: number;
  status: SessionStatus;
  summary: string;
  reps?: number;
  exercises?: number;
  peakLoad?: number;
}

export interface CsvFile {
  id: string;
  patientId: string;
  deviceId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  size: number;
}

export type FirmwareStatus = 'active' | 'staged' | 'deprecated';

export interface FirmwareVersion {
  id: string;
  version: string;
  releaseDate: string;
  notes: string;
  status: FirmwareStatus;
  fileUrl: string;
  deviceCount: number;
}

export type DeploymentResult = 'success' | 'failed' | 'pending' | 'in_progress';

export interface FirmwareDeployment {
  id: string;
  firmwareVersionId: string;
  deviceId: string;
  deployedAt: string;
  result: DeploymentResult;
  actor: string;
}

export type CommandType = 'sync' | 'reboot' | 'network_check' | 'start_workout' | 'request_logs' | 'update_firmware' | 'rollback_firmware' | 'send_command';

export interface CommandLog {
  id: string;
  deviceId: string;
  patientId?: string;
  commandType: CommandType;
  payload?: string;
  result: 'success' | 'failed' | 'pending' | 'timeout';
  createdAt: string;
  actor: string;
}

export type LogCategory = 'system' | 'alert' | 'command' | 'note' | 'firmware' | 'auth' | 'device' | 'patient' | 'general';
export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';
export type LogStatus = 'open' | 'resolved' | 'info' | 'pending';

export interface SystemLog {
  id: string;
  category: LogCategory;
  severity: LogSeverity;
  status: LogStatus;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  actor: string;
  patientId?: string;
  deviceId?: string;
  parentId?: string; // for reply threads
}

export type AlertType = 'device_offline' | 'low_battery' | 'sync_failed' | 'firmware_update' | 'command_timeout';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  deviceId?: string;
  patientId?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  createdAt: string;
}

// Patient-specific clinical data
export interface PatientProtocol {
  patientId: string;
  focusArea: string;
  frequency: string;
  setsReps: string;
  progressionNotes: string;
  lastUpdated: string;
}

export interface PatientSessionDay {
  date: string;
  sessions: number;
  duration: number;
  reps: number;
  completed: number;
}

export interface ClinicalFlag {
  id: string;
  patientId: string;
  type: 'missed_sessions' | 'incomplete_sessions' | 'discomfort_report' | 'early_ended' | 'device_issue' | 'declining_participation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
}

// --- INTERNAL: Future movement metrics framework ---
// These interfaces are scaffolded for future use.
// Do NOT expose Barrons or MovementScore in visible UI yet.
export interface _InternalMovementMetrics {
  patientId: string;
  barrons?: number; // custom unit of movement — hidden
  movementScore?: number; // age-adjusted quality score — hidden
  ageBaseline?: number;
  lastCalculated?: string;
}
