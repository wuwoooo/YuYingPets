export declare class GradeSettingItemDto {
    id?: number;
    name: string;
    sortOrder?: number;
    status?: string;
}
export declare class GradeSettingsUpdateDto {
    grades: GradeSettingItemDto[];
}
