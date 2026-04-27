import { ClassesService } from './classes.service';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    list(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            code: string;
            gradeCode: string;
            gradeName: string;
            name: string;
            slogan: string | null;
            targetScore: number | null;
            sortOrder: number | null;
            displayStatus: string | null;
            studentCount: number;
            currentScoreTotal: number;
            totalScoreTotal: number;
            homeroomTeacher: {
                id: number | null;
                name: string;
                username: string;
            } | null;
        }[];
    }>;
    create(authorization: string | undefined, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    detail(authorization: string | undefined, id: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            semesterId: number | null;
            code: string;
            gradeCode: string;
            gradeName: string;
            name: string;
            slogan: string | null;
            targetScore: number | null;
            sortOrder: number | null;
            displayStatus: string | null;
            semester: {
                id: number | null;
                name: string;
                isCurrent: boolean;
            };
            homeroomTeacher: {
                id: number | null;
                name: string;
                username: string;
            } | null;
            studentCount: number;
            scoreSummary: {
                currentScoreTotal: number;
                totalScoreTotal: number;
            };
        };
    }>;
    update(authorization: string | undefined, id: string, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    groups(authorization: string | undefined, id: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            classId: number | null;
            groupNo: number;
            name: string;
            studentCount: number;
            currentScoreTotal: number;
            students: {
                id: number | null;
                name: string;
                studentNo: string;
                currentScore: number;
            }[];
        }[];
    }>;
    updateGroups(authorization: string | undefined, id: string, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            groupCount: number;
        };
    }>;
}
