import { ApiProperty } from '@nestjs/swagger';

/**
 * Related Entity DTO
 * Common DTO for related entities in responses
 */
export class RelatedEntityDto {
    @ApiProperty({ description: 'Entity ID' })
    _id: string;

    @ApiProperty({ description: 'Entity name', required: false })
    name?: string;

    @ApiProperty({ description: 'Entity full name', required: false })
    fullName?: string;
}

