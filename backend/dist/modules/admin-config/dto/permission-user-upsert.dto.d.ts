declare class PermissionUserSubjectScopeDto {
    classId: number;
    subjectCode: string;
}
export declare class PermissionUserUpsertDto {
    name: string;
    username: string;
    roleCode: string;
    phone?: string;
    classIds?: number[];
    subjectScopes?: PermissionUserSubjectScopeDto[];
    resetPassword?: boolean;
}
export {};
