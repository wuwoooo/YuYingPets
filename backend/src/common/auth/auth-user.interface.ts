export interface AuthUserScope {
  scopeType: string;
  classId?: bigint | null;
  gradeCode?: string | null;
  subjectCode?: string | null;
}

export interface AuthUser {
  id: bigint;
  schoolId: bigint;
  username: string;
  name: string;
  roleCode: string;
  roleName: string;
  scopes: AuthUserScope[];
}
