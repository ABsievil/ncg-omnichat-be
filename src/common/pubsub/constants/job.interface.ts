import { ITaskQueueBody } from 'src/common/queues/interface/task-queue.interface';

export interface IPostItemJobBody extends ITaskQueueBody {
    postItemId: string;
}
