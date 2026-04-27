import { TeacherObservationsService } from './teacher-observations.service';
import { TeacherObservationCreateDto } from './dto/teacher-observation-create.dto';
import { TeacherObservationAiPolishDto } from './dto/teacher-observation-ai-polish.dto';
export declare class TeacherObservationsController {
    private readonly teacherObservationsService;
    constructor(teacherObservationsService: TeacherObservationsService);
    create(authorization: string | undefined, body: TeacherObservationCreateDto): Promise<{
        code: number;
        message: string;
        data: {
            id: number | null;
        };
    }>;
    aiPolish(authorization: string | undefined, body: TeacherObservationAiPolishDto): Promise<{
        code: number;
        message: string;
        data: {
            content: string;
        };
    }>;
}
