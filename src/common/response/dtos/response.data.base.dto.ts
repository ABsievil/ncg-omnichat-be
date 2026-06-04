import { ApiProperty } from '@nestjs/swagger';
import { RelatedEntityDto } from './response.entity.dto';

export class ResponseDataBaseDto {
    @ApiProperty({
        type: [RelatedEntityDto],
        description: 'User who created the entity',
    })
    createdBy: RelatedEntityDto[];

    @ApiProperty({
        type: [RelatedEntityDto],
        description: 'User who last updated the entity',
    })
    updatedBy: RelatedEntityDto[];
}

