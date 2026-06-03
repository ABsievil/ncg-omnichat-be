import { v4 as uuidv4 } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DatabaseSoftDeleteDto {
    @ApiProperty({
        description: 'Alias id of api key',
        example: uuidv4(),
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    deletedBy: string;
}
