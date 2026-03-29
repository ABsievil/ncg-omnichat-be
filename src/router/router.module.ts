import { Module } from '@nestjs/common';
import { RouterModule as NestRouterModule } from '@nestjs/core';
import { RoutesAdminModule } from 'src/router/routes/routes.admin.module';
import { RoutesPublicModule } from 'src/router/routes/routes.public.module';
import { RoutesUserModule } from 'src/router/routes/routes.user.module';

@Module({
  imports: [
    NestRouterModule.register([
      { path: 'public', module: RoutesPublicModule },
      { path: '', module: RoutesUserModule },
      { path: 'admin', module: RoutesAdminModule },
    ]),
    RoutesPublicModule,
    RoutesUserModule,
    RoutesAdminModule,
  ],
})
export class AppRouterModule {}
