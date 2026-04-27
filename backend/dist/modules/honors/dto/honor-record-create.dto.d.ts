export declare class HonorRecordCreateDto {
    honorId: number;
    targetType: 'student' | 'class';
    targetId: number;
    classId: number;
    remark?: string;
}
