import { v4 as uuidV4 } from 'uuid';
import { DatabaseProp } from 'src/common/database/decorators/database.decorator';

export class DatabaseEntityBase {
    @DatabaseProp({
        type: String,
        default: () => uuidV4(),
    })
    _id: string;

    @DatabaseProp({
        required: true,
        index: true,
        default: false,
    })
    deleted: boolean;

    @DatabaseProp({
        required: false,
        index: 'asc',
        type: Date,
    })
    createdAt?: Date;

    @DatabaseProp({
        required: false,
        index: true,
    })
    createdBy?: string;

    @DatabaseProp({
        required: false,
        index: 'asc',
        type: Date,
    })
    updatedAt?: Date;

    @DatabaseProp({
        required: false,
        index: true,
    })
    updatedBy?: string;

    @DatabaseProp({
        required: false,
        index: true,
        type: Date,
    })
    deletedAt?: Date;

    @DatabaseProp({
        required: false,
        index: true,
    })
    deletedBy?: string;

    @DatabaseProp({
        required: false,
        type: Date,
    })
    approvedAt?: Date;

    @DatabaseProp({
        required: false,
        type: String,
    })
    approvedBy?: string;
}
