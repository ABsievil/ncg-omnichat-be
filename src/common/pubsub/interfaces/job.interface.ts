import { ITaskQueueBody } from 'src/common/queues/interface/task-queue.interface';

export interface IMembershipContractJob extends ITaskQueueBody {
    membershipContractId: string;
}
