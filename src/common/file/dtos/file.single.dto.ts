import { ApiProperty } from '@nestjs/swagger';
import type { IFile } from 'src/common/file/interfaces/file.interface';

export class FileSingleDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Single file',
    })
    file: IFile;
}
