import { Module } from '@nestjs/common';
import { TodoController } from 'src/common/pubsub/example-use/todo/controllers/todo.controller';
import { TodoSubscriber } from 'src/common/pubsub/example-use/todo/subscribers/todo.subscriber';

@Module({
    controllers: [TodoController],
    providers: [TodoSubscriber],
    exports: [],
    imports: [],
})
export class TodoModule {}
