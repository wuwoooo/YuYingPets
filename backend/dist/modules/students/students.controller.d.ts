import { StudentsService } from './students.service';
import { StudentAdoptPetDto } from './dto/student-adopt-pet.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    list(authorization: string | undefined, query: Record<string, string>): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            classId: number | null;
            studentNo: string;
            name: string;
            gender: string | null;
            avatarUrl: string | null;
            className: string;
            currentScore: number;
            totalScore: number;
            currentPetLevel: number;
            pet: {
                id: number | null;
                name: string;
                coverUrl: string | null;
                currentStageNo: number;
                currentImageUrl: string | null;
                currentLevel: number;
                totalScore: number;
            } | null;
        }[];
    }>;
    detail(authorization: string | undefined, id: string): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
            schoolId: number | null;
            classId: number | null;
            className: string;
            studentNo: string;
            name: string;
            gender: string | null;
            avatarUrl: string | null;
            profile: {
                currentScore: number;
                totalScore: number;
                currentPetLevel: number;
                rewardsCount: number;
                honorsCount: number;
                positiveCount7d: number;
                negativeCount7d: number;
            } | null;
            group: {
                id: number | null;
                name: string;
                groupNo: number;
            } | null;
            pet: {
                id: number | null;
                petId: number | null;
                name: string;
                coverUrl: string | null;
                currentLevel: number;
                currentStageNo: number;
                totalScore: number;
                stages: {
                    id: number | null;
                    stageNo: number;
                    levelNo: number;
                    name: string;
                    imageUrl: string;
                    needScoreTotal: number;
                }[];
            } | null;
            teacherObservations: {
                id: number | null;
                teacherId: number | null;
                observationType: string | null;
                content: string;
                createdAt: Date;
            }[];
        };
    }>;
    import(authorization: string | undefined, body: Record<string, unknown>): Promise<{
        code: number;
        message: string;
        data: {
            createdCount: number;
            studentIds: number[];
        };
    }>;
    adoptPet(authorization: string | undefined, id: string, body: StudentAdoptPetDto): Promise<{
        code: number;
        message: string;
        data: {
            studentId: number;
            studentName: string;
            petId: number | null;
            petCode: string;
            petName: string;
            coverUrl: string | null;
            studentPetId: number | null;
        };
    }>;
}
