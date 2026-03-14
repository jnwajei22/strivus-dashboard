import type { Patient, Device, WorkoutSession, CsvFile, FirmwareVersion, FirmwareDeployment, CommandLog, SystemLog, Alert, User, PatientProtocol, PatientSessionDay, ClinicalFlag } from '@/types';

export const currentUser: User = {
  id: 'u-001',
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@strivus.com',
  role: 'super_admin',
  lastLogin: '2026-03-14T08:30:00Z',
};

export const mockPatients: Patient[] = [
  { id: 'p-001', firstName: 'James', lastName: 'Morrison', dob: '1965-03-12', sex: 'M', email: 'james.m@email.com', phone: '(555) 234-5678', clinicianId: 'u-001', status: 'active', notes: 'Post-ACL reconstruction. Progressive loading protocol.', enrolledAt: '2025-11-15T00:00:00Z', deviceId: 'd-001', height: '5\'11"', weight: '185 lbs', providerFacility: 'Strivus Rehab Center', deploymentGroup: 'production' },
  { id: 'p-002', firstName: 'Linda', lastName: 'Vasquez', dob: '1978-07-22', sex: 'F', email: 'linda.v@email.com', phone: '(555) 345-6789', clinicianId: 'u-001', status: 'active', notes: 'Rotator cuff repair recovery. Focus on ROM.', enrolledAt: '2025-12-01T00:00:00Z', deviceId: 'd-002', height: '5\'5"', weight: '142 lbs', providerFacility: 'Peak Physical Therapy', deploymentGroup: 'production' },
  { id: 'p-003', firstName: 'Robert', lastName: 'Kim', dob: '1982-11-05', sex: 'M', email: 'robert.k@email.com', phone: '(555) 456-7890', clinicianId: 'u-001', status: 'active', notes: 'Knee replacement rehab. Bilateral protocol.', enrolledAt: '2026-01-10T00:00:00Z', deviceId: 'd-003', height: '5\'9"', weight: '172 lbs', providerFacility: 'Strivus Rehab Center', deploymentGroup: 'production' },
  { id: 'p-004', firstName: 'Maria', lastName: 'Santos', dob: '1990-01-18', sex: 'F', email: 'maria.s@email.com', phone: '(555) 567-8901', clinicianId: 'u-001', status: 'active', notes: 'Lower back rehabilitation. Core strengthening.', enrolledAt: '2026-02-05T00:00:00Z', deviceId: 'd-004', height: '5\'6"', weight: '138 lbs', providerFacility: 'CoreMotion Clinic', deploymentGroup: 'qa' },
  { id: 'p-005', firstName: 'David', lastName: 'Okonkwo', dob: '1955-06-30', sex: 'M', email: 'david.o@email.com', phone: '(555) 678-9012', clinicianId: 'u-001', status: 'inactive', notes: 'Hip replacement. Paused protocol — travel.', enrolledAt: '2025-10-20T00:00:00Z', deviceId: 'd-005', height: '6\'0"', weight: '198 lbs', providerFacility: 'Strivus Rehab Center', deploymentGroup: 'production' },
  { id: 'p-006', firstName: 'Emily', lastName: 'Thornton', dob: '1988-09-14', sex: 'F', email: 'emily.t@email.com', phone: '(555) 789-0123', clinicianId: 'u-001', status: 'discharged', notes: 'Completed full protocol. Discharged with home plan.', enrolledAt: '2025-08-01T00:00:00Z', height: '5\'7"', weight: '155 lbs', providerFacility: 'Peak Physical Therapy', deploymentGroup: 'production' },
  { id: 'p-007', firstName: 'Thomas', lastName: 'Brennan', dob: '1972-04-03', sex: 'M', email: 'thomas.b@email.com', phone: '(555) 890-1234', clinicianId: 'u-001', status: 'active', notes: 'Shoulder impingement. Conservative loading.', enrolledAt: '2026-02-20T00:00:00Z', deviceId: 'd-007', height: '5\'10"', weight: '176 lbs', providerFacility: 'CoreMotion Clinic', deploymentGroup: 'test' },
  { id: 'p-008', firstName: 'Aisha', lastName: 'Rahman', dob: '1995-12-25', sex: 'F', email: 'aisha.r@email.com', phone: '(555) 901-2345', clinicianId: 'u-001', status: 'active', notes: 'Ankle sprain recovery. Proprioceptive training.', enrolledAt: '2026-03-01T00:00:00Z', deviceId: 'd-008', height: '5\'4"', weight: '128 lbs', providerFacility: 'Strivus Rehab Center', deploymentGroup: 'production' },
];

export const mockDevices: Device[] = [
  { id: 'd-001', serialNumber: 'SW-8821-A', model: 'SmartWeight Pro', firmwareVersion: 'v2.4.0', status: 'online', battery: 87, signal: -42, lastSync: '2026-03-14T08:15:00Z', lastContact: '2026-03-14T08:25:00Z', patientId: 'p-001' },
  { id: 'd-002', serialNumber: 'SW-8822-A', model: 'SmartWeight Pro', firmwareVersion: 'v2.4.0', status: 'online', battery: 92, signal: -38, lastSync: '2026-03-14T07:45:00Z', lastContact: '2026-03-14T08:20:00Z', patientId: 'p-002' },
  { id: 'd-003', serialNumber: 'SW-8823-B', model: 'SmartWeight Pro', firmwareVersion: 'v2.3.1', status: 'syncing', battery: 65, signal: -55, lastSync: '2026-03-14T08:28:00Z', lastContact: '2026-03-14T08:28:00Z', patientId: 'p-003' },
  { id: 'd-004', serialNumber: 'SW-8824-A', model: 'SmartWeight Lite', firmwareVersion: 'v2.4.0', status: 'online', battery: 78, signal: -45, lastSync: '2026-03-14T06:30:00Z', lastContact: '2026-03-14T08:10:00Z', patientId: 'p-004' },
  { id: 'd-005', serialNumber: 'SW-8825-B', model: 'SmartWeight Pro', firmwareVersion: 'v2.2.0', status: 'offline', battery: 12, signal: -85, lastSync: '2026-03-12T14:00:00Z', lastContact: '2026-03-12T14:05:00Z', patientId: 'p-005' },
  { id: 'd-006', serialNumber: 'SW-8826-A', model: 'SmartWeight Lite', firmwareVersion: 'v2.4.0', status: 'idle', battery: 100, signal: -30, lastSync: '2026-03-13T10:00:00Z', lastContact: '2026-03-14T08:00:00Z' },
  { id: 'd-007', serialNumber: 'SW-8827-A', model: 'SmartWeight Pro', firmwareVersion: 'v2.3.1', status: 'warning', battery: 23, signal: -72, lastSync: '2026-03-14T05:00:00Z', lastContact: '2026-03-14T07:30:00Z', patientId: 'p-007' },
  { id: 'd-008', serialNumber: 'SW-8828-B', model: 'SmartWeight Pro', firmwareVersion: 'v2.4.0', status: 'online', battery: 95, signal: -35, lastSync: '2026-03-14T08:20:00Z', lastContact: '2026-03-14T08:26:00Z', patientId: 'p-008' },
  { id: 'd-009', serialNumber: 'SW-8829-A', model: 'SmartWeight Pro', firmwareVersion: 'v2.4.0', status: 'online', battery: 81, signal: -40, lastSync: '2026-03-14T07:50:00Z', lastContact: '2026-03-14T08:22:00Z' },
  { id: 'd-010', serialNumber: 'SW-8830-B', model: 'SmartWeight Lite', firmwareVersion: 'v2.3.1', status: 'offline', battery: 0, signal: -95, lastSync: '2026-03-10T09:00:00Z', lastContact: '2026-03-10T09:05:00Z' },
];

export const mockSessions: WorkoutSession[] = [
  { id: 's-001', patientId: 'p-001', deviceId: 'd-001', startedAt: '2026-03-14T07:00:00Z', endedAt: '2026-03-14T07:35:00Z', duration: 35, status: 'completed', summary: '3 sets x 12 reps leg press. Peak load 145 lbs.', reps: 36, exercises: 3, peakLoad: 145 },
  { id: 's-002', patientId: 'p-002', deviceId: 'd-002', startedAt: '2026-03-14T06:30:00Z', endedAt: '2026-03-14T07:00:00Z', duration: 30, status: 'completed', summary: 'ROM exercises. Reached 120° flexion.', reps: 24, exercises: 4 },
  { id: 's-003', patientId: 'p-003', deviceId: 'd-003', startedAt: '2026-03-14T08:00:00Z', duration: 25, status: 'in_progress', summary: 'Bilateral knee extension. In progress.', reps: 18, exercises: 2 },
  { id: 's-004', patientId: 'p-004', deviceId: 'd-004', startedAt: '2026-03-13T14:00:00Z', endedAt: '2026-03-13T14:40:00Z', duration: 40, status: 'completed', summary: 'Core stabilization protocol. Good adherence.', reps: 30, exercises: 5, peakLoad: 45 },
  { id: 's-005', patientId: 'p-001', deviceId: 'd-001', startedAt: '2026-03-13T07:00:00Z', endedAt: '2026-03-13T07:30:00Z', duration: 30, status: 'completed', summary: '3 sets x 10 reps leg press. Peak load 140 lbs.', reps: 30, exercises: 3, peakLoad: 140 },
  { id: 's-006', patientId: 'p-007', deviceId: 'd-007', startedAt: '2026-03-13T10:00:00Z', endedAt: '2026-03-13T10:25:00Z', duration: 25, status: 'completed', summary: 'Shoulder external rotation. Light resistance.', reps: 20, exercises: 2 },
  { id: 's-007', patientId: 'p-008', deviceId: 'd-008', startedAt: '2026-03-14T06:00:00Z', endedAt: '2026-03-14T06:20:00Z', duration: 20, status: 'completed', summary: 'Balance board + ankle circles. Stability improving.', reps: 16, exercises: 3 },
  { id: 's-008', patientId: 'p-001', deviceId: 'd-001', startedAt: '2026-03-12T07:00:00Z', endedAt: '2026-03-12T07:32:00Z', duration: 32, status: 'completed', summary: '3 sets x 10 reps. Progressive loading.', reps: 30, exercises: 3, peakLoad: 138 },
  { id: 's-009', patientId: 'p-002', deviceId: 'd-002', startedAt: '2026-03-12T08:00:00Z', endedAt: '2026-03-12T08:28:00Z', duration: 28, status: 'completed', summary: 'ROM exercises. 115° flexion.', reps: 20, exercises: 4 },
  { id: 's-010', patientId: 'p-004', deviceId: 'd-004', startedAt: '2026-03-12T14:00:00Z', endedAt: '2026-03-12T14:15:00Z', duration: 15, status: 'cancelled', summary: 'Patient reported discomfort. Session ended early.', reps: 8, exercises: 1 },
  { id: 's-011', patientId: 'p-001', deviceId: 'd-001', startedAt: '2026-03-11T07:00:00Z', endedAt: '2026-03-11T07:30:00Z', duration: 30, status: 'completed', summary: 'Standard leg press protocol.', reps: 30, exercises: 3, peakLoad: 135 },
  { id: 's-012', patientId: 'p-003', deviceId: 'd-003', startedAt: '2026-03-11T09:00:00Z', endedAt: '2026-03-11T09:35:00Z', duration: 35, status: 'completed', summary: 'Bilateral knee extension. Good ROM.', reps: 28, exercises: 3 },
  { id: 's-013', patientId: 'p-007', deviceId: 'd-007', startedAt: '2026-03-11T10:00:00Z', endedAt: '2026-03-11T10:10:00Z', duration: 10, status: 'cancelled', summary: 'Device low battery. Session aborted.', reps: 4, exercises: 1 },
  { id: 's-014', patientId: 'p-008', deviceId: 'd-008', startedAt: '2026-03-11T06:00:00Z', endedAt: '2026-03-11T06:22:00Z', duration: 22, status: 'completed', summary: 'Ankle stability drill.', reps: 18, exercises: 3 },
  { id: 's-015', patientId: 'p-002', deviceId: 'd-002', startedAt: '2026-03-10T08:00:00Z', endedAt: '2026-03-10T08:30:00Z', duration: 30, status: 'completed', summary: 'ROM + light resistance band.', reps: 22, exercises: 4 },
  { id: 's-016', patientId: 'p-004', deviceId: 'd-004', startedAt: '2026-03-10T14:00:00Z', endedAt: '2026-03-10T14:38:00Z', duration: 38, status: 'completed', summary: 'Core stabilization. Full protocol.', reps: 32, exercises: 5, peakLoad: 50 },
  { id: 's-017', patientId: 'p-001', deviceId: 'd-001', startedAt: '2026-03-10T07:00:00Z', endedAt: '2026-03-10T07:33:00Z', duration: 33, status: 'completed', summary: 'Leg press progressive load.', reps: 30, exercises: 3, peakLoad: 132 },
  { id: 's-018', patientId: 'p-003', deviceId: 'd-003', startedAt: '2026-03-09T09:00:00Z', endedAt: '2026-03-09T09:30:00Z', duration: 30, status: 'completed', summary: 'Knee extension protocol.', reps: 24, exercises: 3 },
  { id: 's-019', patientId: 'p-008', deviceId: 'd-008', startedAt: '2026-03-09T06:00:00Z', endedAt: '2026-03-09T06:20:00Z', duration: 20, status: 'completed', summary: 'Balance + proprioception.', reps: 14, exercises: 2 },
  { id: 's-020', patientId: 'p-007', deviceId: 'd-007', startedAt: '2026-03-09T10:00:00Z', duration: 5, status: 'cancelled', summary: 'Patient declined. Reported soreness.', reps: 0, exercises: 0 },
];

export const mockCsvFiles: CsvFile[] = [
  { id: 'f-001', patientId: 'p-001', deviceId: 'd-001', fileName: 'session_20260314_070000.csv', fileUrl: '#', uploadedAt: '2026-03-14T07:36:00Z', size: 245000 },
  { id: 'f-002', patientId: 'p-002', deviceId: 'd-002', fileName: 'session_20260314_063000.csv', fileUrl: '#', uploadedAt: '2026-03-14T07:01:00Z', size: 189000 },
  { id: 'f-003', patientId: 'p-001', deviceId: 'd-001', fileName: 'session_20260313_070000.csv', fileUrl: '#', uploadedAt: '2026-03-13T07:31:00Z', size: 210000 },
  { id: 'f-004', patientId: 'p-004', deviceId: 'd-004', fileName: 'session_20260313_140000.csv', fileUrl: '#', uploadedAt: '2026-03-13T14:41:00Z', size: 312000 },
  { id: 'f-005', patientId: 'p-003', deviceId: 'd-003', fileName: 'session_20260312_090000.csv', fileUrl: '#', uploadedAt: '2026-03-12T09:36:00Z', size: 198000 },
  { id: 'f-006', patientId: 'p-008', deviceId: 'd-008', fileName: 'session_20260311_060000.csv', fileUrl: '#', uploadedAt: '2026-03-11T06:23:00Z', size: 156000 },
  { id: 'f-007', patientId: 'p-007', deviceId: 'd-007', fileName: 'session_20260309_100000_corrupt.csv', fileUrl: '#', uploadedAt: '2026-03-09T10:06:00Z', size: 8200 },
];

// Adherence / prescribed sessions per patient (last 7 days)
export interface PatientAdherence {
  patientId: string;
  prescribed: number;
  completed: number;
  missed: number;
  cancelled: number;
  adherenceRate: number;
}

export const mockAdherence: PatientAdherence[] = [
  { patientId: 'p-001', prescribed: 5, completed: 4, missed: 0, cancelled: 1, adherenceRate: 80 },
  { patientId: 'p-002', prescribed: 5, completed: 3, missed: 2, cancelled: 0, adherenceRate: 60 },
  { patientId: 'p-003', prescribed: 4, completed: 3, missed: 1, cancelled: 0, adherenceRate: 75 },
  { patientId: 'p-004', prescribed: 5, completed: 3, missed: 1, cancelled: 1, adherenceRate: 60 },
  { patientId: 'p-005', prescribed: 3, completed: 0, missed: 3, cancelled: 0, adherenceRate: 0 },
  { patientId: 'p-007', prescribed: 4, completed: 2, missed: 0, cancelled: 2, adherenceRate: 50 },
  { patientId: 'p-008', prescribed: 5, completed: 4, missed: 1, cancelled: 0, adherenceRate: 80 },
];

// Workout trend data (daily for last 7 days)
export interface DailyTrend {
  date: string;
  sessions: number;
  avgDuration: number;
  totalMinutes: number;
  completed: number;
  cancelled: number;
}

export const mockWorkoutTrends: DailyTrend[] = [
  { date: '03/08', sessions: 3, avgDuration: 27, totalMinutes: 80, completed: 2, cancelled: 1 },
  { date: '03/09', sessions: 3, avgDuration: 18, totalMinutes: 55, completed: 2, cancelled: 1 },
  { date: '03/10', sessions: 3, avgDuration: 34, totalMinutes: 101, completed: 3, cancelled: 0 },
  { date: '03/11', sessions: 4, avgDuration: 24, totalMinutes: 97, completed: 3, cancelled: 1 },
  { date: '03/12', sessions: 3, avgDuration: 25, totalMinutes: 75, completed: 2, cancelled: 1 },
  { date: '03/13', sessions: 3, avgDuration: 32, totalMinutes: 95, completed: 3, cancelled: 0 },
  { date: '03/14', sessions: 4, avgDuration: 28, totalMinutes: 110, completed: 3, cancelled: 0 },
];

// Protocol / care plan changes
export interface ProtocolChange {
  id: string;
  patientId: string;
  change: string;
  changedAt: string;
  actor: string;
}

export const mockProtocolChanges: ProtocolChange[] = [
  { id: 'pc-001', patientId: 'p-001', change: 'Progressive loading increased by 10% — leg press protocol updated', changedAt: '2026-03-13T09:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'pc-002', patientId: 'p-003', change: 'Added bilateral knee flexion to protocol', changedAt: '2026-03-12T11:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'pc-003', patientId: 'p-008', change: 'Transitioned from ankle stability to proprioceptive training phase 2', changedAt: '2026-03-11T08:30:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'pc-004', patientId: 'p-004', change: 'Reduced core stabilization intensity due to discomfort report', changedAt: '2026-03-12T15:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'pc-005', patientId: 'p-005', change: 'Protocol paused — patient travel. Resume after 03/20.', changedAt: '2026-03-10T10:00:00Z', actor: 'Dr. Sarah Chen' },
];

// Upload statuses
export interface UploadRecord {
  id: string;
  fileName: string;
  patientId: string;
  status: 'parsed' | 'failed' | 'pending_review';
  uploadedAt: string;
  size: number;
  errorMessage?: string;
}

export const mockUploads: UploadRecord[] = [
  { id: 'up-001', fileName: 'session_20260314_070000.csv', patientId: 'p-001', status: 'parsed', uploadedAt: '2026-03-14T07:36:00Z', size: 245000 },
  { id: 'up-002', fileName: 'session_20260314_063000.csv', patientId: 'p-002', status: 'parsed', uploadedAt: '2026-03-14T07:01:00Z', size: 189000 },
  { id: 'up-003', fileName: 'session_20260314_060000.csv', patientId: 'p-008', status: 'pending_review', uploadedAt: '2026-03-14T06:21:00Z', size: 156000 },
  { id: 'up-004', fileName: 'session_20260313_140000.csv', patientId: 'p-004', status: 'parsed', uploadedAt: '2026-03-13T14:41:00Z', size: 312000 },
  { id: 'up-005', fileName: 'session_20260309_corrupt.csv', patientId: 'p-007', status: 'failed', uploadedAt: '2026-03-09T10:06:00Z', size: 8200, errorMessage: 'Malformed CSV — missing header row' },
  { id: 'up-006', fileName: 'session_20260313_070000.csv', patientId: 'p-001', status: 'parsed', uploadedAt: '2026-03-13T07:31:00Z', size: 210000 },
];

// Patient protocols
export const mockPatientProtocols: PatientProtocol[] = [
  { patientId: 'p-001', focusArea: 'Knee — ACL Reconstruction', frequency: '5x / week', setsReps: '3 sets × 10-12 reps', progressionNotes: 'Progressive loading +10% every 2 weeks. Currently at 145 lbs peak.', lastUpdated: '2026-03-13T09:00:00Z' },
  { patientId: 'p-002', focusArea: 'Shoulder — Rotator Cuff', frequency: '5x / week', setsReps: '4 exercises × 3 sets', progressionNotes: 'Focus on ROM recovery. Target 130° flexion by week 14.', lastUpdated: '2026-03-08T10:00:00Z' },
  { patientId: 'p-003', focusArea: 'Knee — Bilateral Replacement', frequency: '4x / week', setsReps: '3 sets × 10 reps bilateral', progressionNotes: 'Added bilateral knee flexion. Progressing well with weight bearing.', lastUpdated: '2026-03-12T11:00:00Z' },
  { patientId: 'p-004', focusArea: 'Lumbar — Core Strengthening', frequency: '5x / week', setsReps: '5 exercises × 3 sets', progressionNotes: 'Reduced intensity due to discomfort report on 03/12. Reassess next week.', lastUpdated: '2026-03-12T15:00:00Z' },
  { patientId: 'p-005', focusArea: 'Hip — Total Replacement', frequency: '3x / week (paused)', setsReps: '3 sets × 8 reps', progressionNotes: 'Protocol paused — patient travel. Resume after 03/20.', lastUpdated: '2026-03-10T10:00:00Z' },
  { patientId: 'p-007', focusArea: 'Shoulder — Impingement', frequency: '4x / week', setsReps: '2 exercises × 3 sets', progressionNotes: 'Conservative loading. Patient reports intermittent soreness.', lastUpdated: '2026-03-09T14:00:00Z' },
  { patientId: 'p-008', focusArea: 'Ankle — Sprain Recovery', frequency: '5x / week', setsReps: '3 exercises × 3 sets', progressionNotes: 'Phase 2 proprioceptive training. Stability improving.', lastUpdated: '2026-03-11T08:30:00Z' },
];

// Patient session day data (for per-patient charts)
export const mockPatientSessionDays: Record<string, PatientSessionDay[]> = {
  'p-001': [
    { date: '03/08', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/09', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/10', sessions: 1, duration: 33, reps: 30, completed: 1 },
    { date: '03/11', sessions: 1, duration: 30, reps: 30, completed: 1 },
    { date: '03/12', sessions: 1, duration: 32, reps: 30, completed: 1 },
    { date: '03/13', sessions: 1, duration: 30, reps: 30, completed: 1 },
    { date: '03/14', sessions: 1, duration: 35, reps: 36, completed: 1 },
  ],
  'p-002': [
    { date: '03/08', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/09', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/10', sessions: 1, duration: 30, reps: 22, completed: 1 },
    { date: '03/11', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/12', sessions: 1, duration: 28, reps: 20, completed: 1 },
    { date: '03/13', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/14', sessions: 1, duration: 30, reps: 24, completed: 1 },
  ],
  'p-003': [
    { date: '03/08', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/09', sessions: 1, duration: 30, reps: 24, completed: 1 },
    { date: '03/10', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/11', sessions: 1, duration: 35, reps: 28, completed: 1 },
    { date: '03/12', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/13', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/14', sessions: 1, duration: 25, reps: 18, completed: 1 },
  ],
  'p-004': [
    { date: '03/08', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/09', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/10', sessions: 1, duration: 38, reps: 32, completed: 1 },
    { date: '03/11', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/12', sessions: 1, duration: 15, reps: 8, completed: 0 },
    { date: '03/13', sessions: 1, duration: 40, reps: 30, completed: 1 },
    { date: '03/14', sessions: 0, duration: 0, reps: 0, completed: 0 },
  ],
  'p-007': [
    { date: '03/08', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/09', sessions: 1, duration: 5, reps: 0, completed: 0 },
    { date: '03/10', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/11', sessions: 1, duration: 10, reps: 4, completed: 0 },
    { date: '03/12', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/13', sessions: 1, duration: 25, reps: 20, completed: 1 },
    { date: '03/14', sessions: 0, duration: 0, reps: 0, completed: 0 },
  ],
  'p-008': [
    { date: '03/08', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/09', sessions: 1, duration: 20, reps: 14, completed: 1 },
    { date: '03/10', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/11', sessions: 1, duration: 22, reps: 18, completed: 1 },
    { date: '03/12', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/13', sessions: 0, duration: 0, reps: 0, completed: 0 },
    { date: '03/14', sessions: 1, duration: 20, reps: 16, completed: 1 },
  ],
};

// Clinical flags
export const mockClinicalFlags: ClinicalFlag[] = [
  { id: 'cf-001', patientId: 'p-005', type: 'missed_sessions', severity: 'high', description: 'All 3 prescribed sessions missed this week. Protocol paused.', createdAt: '2026-03-14T06:00:00Z' },
  { id: 'cf-002', patientId: 'p-007', type: 'incomplete_sessions', severity: 'medium', description: '2 of 3 sessions cancelled — reported soreness and device battery issue.', createdAt: '2026-03-13T12:00:00Z' },
  { id: 'cf-003', patientId: 'p-004', type: 'discomfort_report', severity: 'medium', description: 'Reported discomfort on 03/12. Session ended early. Protocol intensity reduced.', createdAt: '2026-03-12T15:00:00Z' },
  { id: 'cf-004', patientId: 'p-002', type: 'missed_sessions', severity: 'low', description: '2 sessions missed this week. Adherence at 60%.', createdAt: '2026-03-14T06:00:00Z' },
  { id: 'cf-005', patientId: 'p-007', type: 'device_issue', severity: 'medium', description: 'Device SW-8827-A battery at 23%. May impact next session.', createdAt: '2026-03-14T05:30:00Z' },
  { id: 'cf-006', patientId: 'p-004', type: 'early_ended', severity: 'low', description: 'Session on 03/12 ended after 15 minutes (prescribed 40 min).', createdAt: '2026-03-12T14:20:00Z' },
];

export const mockFirmwareVersions: FirmwareVersion[] = [
  { id: 'fw-001', version: 'v2.4.0', releaseDate: '2026-02-28T00:00:00Z', notes: 'Improved MQTT stability. Added OTA progress reporting. Fixed BLE reconnection edge case.', status: 'active', fileUrl: '#', deviceCount: 6 },
  { id: 'fw-002', version: 'v2.3.1', releaseDate: '2026-01-15T00:00:00Z', notes: 'Hotfix for sensor calibration drift. Updated TLS certificates.', status: 'active', fileUrl: '#', deviceCount: 3 },
  { id: 'fw-003', version: 'v2.3.0', releaseDate: '2025-12-01T00:00:00Z', notes: 'Added workout auto-pause. New low-battery warning threshold.', status: 'deprecated', fileUrl: '#', deviceCount: 0 },
  { id: 'fw-004', version: 'v2.2.0', releaseDate: '2025-10-15T00:00:00Z', notes: 'Initial production release. Core workout tracking and sync.', status: 'deprecated', fileUrl: '#', deviceCount: 1 },
  { id: 'fw-005', version: 'v2.4.1-rc1', releaseDate: '2026-03-10T00:00:00Z', notes: 'Release candidate. Enhanced telemetry, new diagnostic commands.', status: 'staged', fileUrl: '#', deviceCount: 0 },
];

export const mockDeployments: FirmwareDeployment[] = [
  { id: 'dep-001', firmwareVersionId: 'fw-001', deviceId: 'd-001', deployedAt: '2026-03-01T10:00:00Z', result: 'success', actor: 'Dr. Sarah Chen' },
  { id: 'dep-002', firmwareVersionId: 'fw-001', deviceId: 'd-002', deployedAt: '2026-03-01T10:05:00Z', result: 'success', actor: 'Dr. Sarah Chen' },
  { id: 'dep-003', firmwareVersionId: 'fw-001', deviceId: 'd-004', deployedAt: '2026-03-02T14:00:00Z', result: 'success', actor: 'Ops Team' },
];

export const mockCommandLogs: CommandLog[] = [
  { id: 'cmd-001', deviceId: 'd-001', patientId: 'p-001', commandType: 'sync', result: 'success', createdAt: '2026-03-14T08:15:00Z', actor: 'System' },
  { id: 'cmd-002', deviceId: 'd-005', patientId: 'p-005', commandType: 'reboot', result: 'timeout', createdAt: '2026-03-13T16:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'cmd-003', deviceId: 'd-003', patientId: 'p-003', commandType: 'start_workout', result: 'success', createdAt: '2026-03-14T08:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'cmd-004', deviceId: 'd-007', commandType: 'network_check', result: 'success', createdAt: '2026-03-14T07:30:00Z', actor: 'System' },
  { id: 'cmd-005', deviceId: 'd-001', commandType: 'update_firmware', payload: 'v2.4.0', result: 'success', createdAt: '2026-03-01T10:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'cmd-006', deviceId: 'd-010', commandType: 'reboot', result: 'failed', createdAt: '2026-03-10T09:10:00Z', actor: 'Ops Team' },
];

export const mockSystemLogs: SystemLog[] = [
  { id: 'log-001', category: 'system', severity: 'info', status: 'info', title: 'System startup', body: 'Kinetica Platform initialized. All services nominal.', createdAt: '2026-03-14T06:00:00Z', actor: 'System' },
  { id: 'log-002', category: 'alert', severity: 'critical', status: 'open', title: 'Device #8825 offline', body: 'SW-8825-B lost MQTT connection. Last ACK 48h ago. Battery critically low (12%).', createdAt: '2026-03-12T14:10:00Z', actor: 'System', deviceId: 'd-005', patientId: 'p-005' },
  { id: 'log-003', category: 'command', severity: 'warning', status: 'open', title: 'Reboot timeout', body: 'Reboot command to SW-8825-B timed out after 30s. No ACK received.', createdAt: '2026-03-13T16:00:30Z', actor: 'Dr. Sarah Chen', deviceId: 'd-005' },
  { id: 'log-004', category: 'firmware', severity: 'info', status: 'info', title: 'Firmware v2.4.1-rc1 staged', body: 'Release candidate uploaded and staged for beta deployment.', createdAt: '2026-03-10T11:00:00Z', actor: 'Ops Team' },
  { id: 'log-005', category: 'note', severity: 'info', status: 'info', title: 'Patient protocol update', body: 'Updated James Morrison protocol to increase progressive loading by 10%.', createdAt: '2026-03-13T09:00:00Z', actor: 'Dr. Sarah Chen', patientId: 'p-001' },
  { id: 'log-006', category: 'alert', severity: 'warning', status: 'open', title: 'Low battery warning', body: 'SW-8827-A battery at 23%. Recommend charging before next session.', createdAt: '2026-03-14T05:30:00Z', actor: 'System', deviceId: 'd-007', patientId: 'p-007' },
  { id: 'log-007', category: 'system', severity: 'info', status: 'resolved', title: 'Firmware deployment complete', body: '3 devices updated to v2.4.0 successfully.', createdAt: '2026-03-02T14:30:00Z', actor: 'System' },
  { id: 'log-008', category: 'auth', severity: 'info', status: 'info', title: 'User login', body: 'Dr. Sarah Chen authenticated via passwordless email.', createdAt: '2026-03-14T08:30:00Z', actor: 'Auth System' },
  { id: 'log-009', category: 'alert', severity: 'error', status: 'open', title: 'Device #8830 unresponsive', body: 'SW-8830-B has been offline for 4 days. Battery depleted. Requires physical intervention.', createdAt: '2026-03-13T08:00:00Z', actor: 'System', deviceId: 'd-010' },
  { id: 'log-010', category: 'command', severity: 'info', status: 'info', title: 'Sync completed', body: 'SW-8821-A synced 245KB of session data successfully.', createdAt: '2026-03-14T08:15:30Z', actor: 'System', deviceId: 'd-001' },
  { id: 'log-011', category: 'patient', severity: 'info', status: 'info', title: 'Maria Santos — discomfort noted', body: 'Patient reported lower back discomfort during session on 03/12. Protocol intensity reduced.', createdAt: '2026-03-12T15:10:00Z', actor: 'Dr. Sarah Chen', patientId: 'p-004' },
  { id: 'log-012', category: 'device', severity: 'warning', status: 'pending', title: 'Device d-003 sync anomaly', body: 'SW-8823-B reporting intermittent sync delays. Monitoring.', createdAt: '2026-03-14T07:00:00Z', actor: 'System', deviceId: 'd-003' },
  { id: 'log-013', category: 'note', severity: 'info', status: 'info', title: 'Weekly ops review', body: 'All deployment group devices accounted for. QA group firmware staged for next week.', createdAt: '2026-03-13T17:00:00Z', actor: 'Ops Team' },
  { id: 'log-014', category: 'general', severity: 'info', status: 'info', title: 'Staff meeting follow-up', body: 'Discussed rollout timeline for v2.4.1. Target: end of March for production group.', createdAt: '2026-03-12T10:00:00Z', actor: 'Dr. Sarah Chen' },
  { id: 'log-r01', category: 'note', severity: 'info', status: 'info', title: 'Re: Device #8825 offline', body: 'Contacted patient David Okonkwo. Device is at home — patient traveling. Will charge on return.', createdAt: '2026-03-12T16:00:00Z', actor: 'Dr. Sarah Chen', parentId: 'log-002', deviceId: 'd-005', patientId: 'p-005' },
  { id: 'log-r02', category: 'note', severity: 'info', status: 'info', title: 'Re: Maria Santos — discomfort noted', body: 'Reduced protocol to 2x/week until follow-up. Monitor ROM carefully.', createdAt: '2026-03-13T08:00:00Z', actor: 'Dr. Sarah Chen', parentId: 'log-011', patientId: 'p-004' },
];

export const mockAlerts: Alert[] = [
  { id: 'a-001', deviceId: 'd-005', patientId: 'p-005', type: 'device_offline', severity: 'critical', status: 'active', title: 'Device SW-8825-B offline — 48+ hours', createdAt: '2026-03-12T14:10:00Z' },
  { id: 'a-002', deviceId: 'd-010', type: 'device_offline', severity: 'high', status: 'active', title: 'Device SW-8830-B unresponsive — battery depleted', createdAt: '2026-03-10T09:10:00Z' },
  { id: 'a-003', deviceId: 'd-007', patientId: 'p-007', type: 'low_battery', severity: 'medium', status: 'active', title: 'SW-8827-A battery at 23%', createdAt: '2026-03-14T05:30:00Z' },
  { id: 'a-004', deviceId: 'd-005', patientId: 'p-005', type: 'command_timeout', severity: 'high', status: 'acknowledged', title: 'Reboot command to SW-8825-B timed out', createdAt: '2026-03-13T16:00:30Z' },
  { id: 'a-005', deviceId: 'd-003', patientId: 'p-003', type: 'sync_failed', severity: 'low', status: 'resolved', title: 'Sync retry succeeded for SW-8823-B', createdAt: '2026-03-14T08:00:00Z' },
];

// Helpers
export const getPatientName = (patientId: string): string => {
  const p = mockPatients.find(p => p.id === patientId);
  return p ? `${p.firstName} ${p.lastName}` : 'Unassigned';
};

export const getDeviceSerial = (deviceId: string): string => {
  const d = mockDevices.find(d => d.id === deviceId);
  return d ? d.serialNumber : 'Unknown';
};
