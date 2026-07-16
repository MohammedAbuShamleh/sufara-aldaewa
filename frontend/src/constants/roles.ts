// الأدوار والصلاحيات المبنية على النطاق (المحافظة / الفريق)

export const ROLES = {
  ADMIN: 'admin',
  ADMIN_SECRETARY: 'admin_secretary',
  CENTRAL_MANAGER: 'central_manager',
  GOVERNORATE_MANAGER: 'governorate_manager',
  TEAM_LEADER: 'team_leader',
  PREACHER: 'preacher',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// الأدوار التي يحق لها فتح لوحة التقارير (بأي نطاق)
const REPORT_VIEWER_ROLES: string[] = [
  ROLES.ADMIN,
  ROLES.ADMIN_SECRETARY,
  ROLES.CENTRAL_MANAGER,
  ROLES.GOVERNORATE_MANAGER,
  ROLES.TEAM_LEADER,
]

// الأدوار التي ترى كل التقارير في كل المحافظات
const ALL_REPORTS_ROLES: string[] = [
  ROLES.ADMIN,
  ROLES.ADMIN_SECRETARY,
  ROLES.CENTRAL_MANAGER,
]

export function canViewReports(role: string | null | undefined): boolean {
  return !!role && REPORT_VIEWER_ROLES.includes(role)
}

export function canViewAllReports(role: string | null | undefined): boolean {
  return !!role && ALL_REPORTS_ROLES.includes(role)
}

// إدارة حسابات المستخدمين — للأدمن فقط
export function canManageUsers(role: string | null | undefined): boolean {
  return role === ROLES.ADMIN
}

// الأدوار القابلة للإسناد من واجهة إدارة المستخدمين
export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: ROLES.PREACHER, label: 'داعية' },
  { value: ROLES.TEAM_LEADER, label: 'مسؤول فريق' },
  { value: ROLES.GOVERNORATE_MANAGER, label: 'مسؤول المحافظة' },
  { value: ROLES.CENTRAL_MANAGER, label: 'مسؤول مركزي' },
  { value: ROLES.ADMIN_SECRETARY, label: 'السكرتير / الإداري' },
  { value: ROLES.ADMIN, label: 'أدمن' },
]

export function roleLabel(role: string | null | undefined): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? (role ?? '—')
}
