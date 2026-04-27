import { HonorCategory } from '@prisma/client';
export declare class HonorUpsertDto {
    code: string;
    name: string;
    category: HonorCategory;
    iconUrl: string;
    description?: string;
    conditionType?: string;
    conditionConfig?: Record<string, unknown>;
}
