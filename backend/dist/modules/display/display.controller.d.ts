import { DisplayUnlockDto } from './dto/display-unlock.dto';
import { DisplayService } from './display.service';
import { DisplayLockDto } from './dto/display-lock.dto';
import { DisplayTerminalInitializeDto } from './dto/display-terminal-initialize.dto';
import { DisplayWeatherQueryDto } from './dto/display-weather-query.dto';
export declare class DisplayController {
    private readonly displayService;
    constructor(displayService: DisplayService);
    terminalState(terminalCode: string): Promise<{
        code: number;
        message: string;
        data: {
            terminalCode: string;
            terminalName: string;
            isInitialized: boolean;
            initializedAt: Date | null;
            lastBoundAt: Date | null;
            classId: number | null;
            classInfo: {
                id: number | null;
                gradeName: string;
                className: string;
                slogan: string | null;
                homeroomTeacherName: string | null;
            } | null;
        };
    }>;
    terminals(authorization: string | undefined): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            terminalCode: string;
            terminalName: string;
            classId: number | null;
            classInfo: {
                id: number | null;
                gradeName: string;
                className: string;
                displayStatus: string | null;
            } | null;
            onlineStatus: string;
            initializedAt: Date | null;
            lastBoundAt: Date | null;
            lastOnlineAt: Date | null;
        }[];
    }>;
    terminalInitialize(authorization: string | undefined, dto: DisplayTerminalInitializeDto): Promise<{
        code: number;
        message: string;
        data: {
            terminalId: number | null;
            terminalCode: string;
            terminalName: string;
            classId: number;
            classInfo: {
                id: number | null;
                gradeName: string;
                className: string;
                slogan: string | null;
                homeroomTeacherName: string | null;
            };
        };
    }>;
    unlock(authorization: string | undefined, dto: DisplayUnlockDto): Promise<{
        code: number;
        message: string;
        data: {
            classId: number;
            displayTerminalCode: string;
            unlockSessionId: number | null;
            expiredAt: string;
        };
    }>;
    unlockStatus(classId: string, code: string): Promise<{
        code: number;
        message: string;
        data: {
            classId: number;
            displayTerminalCode: string;
            status: string;
            unlockSessionId: number | null;
            expiredAt: Date | null;
        };
    }>;
    lock(authorization: string | undefined, dto: DisplayLockDto): Promise<{
        code: number;
        message: string;
        data: {
            updatedCount: number;
        };
    }>;
    entryConfig(classId?: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            classId: number | null;
            bgImageUrl: string | null;
            title: string | null;
            subtitle: string | null;
            animationSpeed: string | null;
            allowSkipAnimation: boolean;
            defaultMode: string | null;
        } | null;
    }>;
    weather(query: DisplayWeatherQueryDto): Promise<{
        code: number;
        message: string;
        data: {
            label: string;
            title: string;
            icon: string;
            temperatureC: number | null;
            temperatureText: string;
            conditionText: string;
            provider: string;
            observedAt: string | null;
            isStale: boolean;
        };
    }>;
    petCatalog(): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            code: string;
            name: string;
            category: string | null;
            rarity: string | null;
            description: string | null;
            coverUrl: string | null;
            sourceType: string;
            status: import(".prisma/client").$Enums.Status;
            stageCount: number;
            stages: {
                id: number | null;
                stageNo: number;
                levelNo: number;
                name: string;
                imageUrl: string;
                needScoreTotal: number;
                animationKey: string | null;
            }[];
        }[];
    }>;
    home(classId: string): Promise<{
        code: number;
        message: string;
        data: {
            classId: number;
            className: string;
            gradeName: string;
            slogan: string | null;
            targetScore: number | null;
            homeroomTeacher: {
                id: number | null;
                name: string;
            } | null;
            studentCount: number;
            scoreSummary: {
                currentScoreTotal: number;
                totalScoreTotal: number;
            };
            topStudents: {
                id: number | null;
                name: string;
                avatarUrl: string | null;
                currentScore: number;
                currentPetLevel: number;
                petName: string | null;
            }[];
        };
    }>;
    leaderboard(classId: string, type: string): Promise<{
        code: number;
        message: string;
        data: {
            classId: number;
            type: string;
            rows: {
                rank: number;
                id: number | null;
                name: string;
                avatarUrl: string | null;
                currentScore: number;
                currentPetLevel: number;
                petName: string | null;
            }[];
        };
    }>;
    rewardCenter(classId: string): Promise<{
        code: number;
        message: string;
        data: {
            classId: number;
            rewards: {
                id: number | null;
                code: string;
                name: string;
                category: string | null;
                imageUrl: string | null;
                scoreCost: number;
                stockQty: number | null;
                isInfiniteStock: boolean;
            }[];
            latestOrders: {
                id: number | null;
                studentId: number | null;
                studentName: string;
                rewardId: number | null;
                rewardName: string;
                scoreCost: number;
                status: import(".prisma/client").$Enums.RewardOrderStatus;
                createdAt: Date;
            }[];
        };
    }>;
}
