export interface AuthUserScope {
  scopeType: string;
  classId?: bigint | null;
  gradeCode?: string | null;
  subjectCode?: string | null;
}

export interface AuthUserClassAssignment {
  classId: bigint;
  roleInClass: string;
  subjectCode?: string | null;
  isPrimary: boolean;
}

export interface AuthUser {
  id: bigint;
  schoolId: bigint;
  username: string;
  name: string;
  roleCode: string;
  roleName: string;
  dutyTags: string[];
  scopes: AuthUserScope[];
  classAssignments: AuthUserClassAssignment[];
}
