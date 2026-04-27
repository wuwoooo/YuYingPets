import { RewardsService } from './rewards.service';
import { RewardUpsertDto } from './dto/reward-upsert.dto';
import { RewardOrderCreateDto } from './dto/reward-order-create.dto';
export declare class RewardsController {
    private readonly rewardsService;
    constructor(rewardsService: RewardsService);
    list(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            code: string;
            name: string;
            category: string | null;
            imageUrl: string | null;
            scoreCost: number;
            stockQty: number | null;
            isInfiniteStock: boolean;
            status: import(".prisma/client").$Enums.Status;
            rewardOrderCount: number;
        }[];
    }>;
    create(authorization: string | undefined, body: RewardUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    update(authorization: string | undefined, id: string, body: RewardUpsertDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    uploadRewardAsset(authorization: string | undefined, file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    } | undefined): Promise<{
        code: number;
        message: string;
        data: {
            url: string;
            originalName: string;
            mimeType: string;
            size: number;
        };
    }>;
    updateStatus(authorization: string | undefined, id: string, status: 'enabled' | 'disabled'): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            status: "enabled" | "disabled";
        };
    }>;
    deleteReward(authorization: string | undefined, id: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number;
        };
    }>;
    orders(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            classId: number | null;
            studentId: number | null;
            rewardId: number | null;
            operatorId: number | null;
            reward: {
                id: number | null;
                schoolId: number | null;
                name: string;
                status: import(".prisma/client").$Enums.Status;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                category: string | null;
                imageUrl: string | null;
                scoreCost: number;
                stockQty: number | null;
                isInfiniteStock: boolean;
            };
            student: {
                id: number | null;
                classId: number | null;
                name: string;
                studentNo: string;
            };
            status: import(".prisma/client").$Enums.RewardOrderStatus;
            createdAt: Date;
            sourceTerminal: import(".prisma/client").$Enums.TerminalType;
            scoreCost: number;
            operatorRole: string | null;
        }[];
    }>;
    createOrder(authorization: string | undefined, body: RewardOrderCreateDto): Promise<{
        code: number;
        message: string;
        data: {
            orderId: number | null;
            rewardId: number | null;
            studentId: number | null;
            scoreCost: number;
            status: import(".prisma/client").$Enums.RewardOrderStatus;
        };
    }>;
}
