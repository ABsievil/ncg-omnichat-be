import { v4 as uuidv4 } from 'uuid';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class DatabaseDto {
    @Expose()
    @ApiProperty({
        description: 'Alias id of api key',
        example: uuidv4(),
        required: true,
    })
    _id: string;

    @ApiProperty({
        description: 'Date created at',
        example: new Date(),
        required: true,
    })
    createdAt: Date;

    @ApiProperty({
        description: 'created by',
        required: false,
    })
    createdBy?: string;

    @ApiProperty({
        description: 'Date updated at',
        example: new Date(),
        required: true,
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'updated by',
        required: false,
    })
    updatedBy?: string;

    @ApiProperty({
        description: 'Flag for deleted',
        default: false,
        required: true,
    })
    deleted: boolean;

    @ApiProperty({
        description: 'Date delete at',
        required: false,
    })
    deletedAt?: Date;

    @ApiProperty({
        description: 'Delete by',
        required: false,
    })
    deletedBy?: string;

    @ApiHideProperty()
    @Exclude()
    __v?: string;
}
