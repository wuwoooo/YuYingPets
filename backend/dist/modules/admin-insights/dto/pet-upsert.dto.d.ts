export declare class PetStageUpsertDto {
    stageNo: number;
    levelNo: number;
    name: string;
    imageUrl: string;
    needScoreTotal: number;
    animationKey?: string;
}
export declare class PetUpsertDto {
    code: string;
    name: string;
    category?: string;
    rarity?: string;
    sourceType?: 'system' | 'custom';
    coverUrl?: string;
    description?: string;
    stages: PetStageUpsertDto[];
}
