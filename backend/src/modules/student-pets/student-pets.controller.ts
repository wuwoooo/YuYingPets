import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/auth/public.decorator';
import { StudentPetsService } from './student-pets.service';
import { RenamePetDto } from './dto/rename-pet.dto';

@ApiTags('StudentPets')
@Controller('student-pets')
export class StudentPetsController {
  constructor(private readonly service: StudentPetsService) {}

  @Post(':studentPetId/rename')
  @Public()
  rename(
    @Param('studentPetId') studentPetId: string,
    @Body() dto: RenamePetDto,
  ) {
    return this.service.rename(Number(studentPetId), dto);
  }
}
