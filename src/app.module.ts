import { Module } from '@nestjs/common';
import configuration from './config/index';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { UserModule } from './system/user/user.module';
import { JwtAuthGuard } from './common/guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './system/auth/auth.module';
import { ArticleModule } from './controller/article/article.module';
import { RedisClientOptions } from '@liaoliaots/nestjs-redis';
import { RedisModule } from './common/libs/redis/redis.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DetaDriver, DetaEntityManager } from './common/driver/DetaDriver';
import { DataSource } from 'typeorm';
import { CommentModule } from './controller/comment/comment.module';
import { OssModule } from './controller/file/oss.module';
import { MessageModule } from './controller/message/message.module';
import {AvatarModule} from "./common/avatar/avatar.module";

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    // 服务静态化, 生产环境最好使用 nginx 做资源映射， 可以根据环境配置做区分
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const fileUploadLocationConfig =
          config.get<string>('app.file.location') || '../upload';
        const rootPath = path.isAbsolute(fileUploadLocationConfig)
          ? `${fileUploadLocationConfig}`
          : path.join(process.cwd(), `${fileUploadLocationConfig}`);
        return [
          {
            rootPath,
            exclude: [`${config.get('app.prefix')}`],
            serveRoot: config.get('app.file.serveRoot'),
            serveStaticOptions: {
              cacheControl: true,
            },
          },
        ] as ServeStaticModuleOptions[];
      },
    }),
    // 数据库
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          type: 'mongodb',
          autoLoadEntities: true,
          keepConnectionAlive: true,
          projectKey: process.env.DETA_PROJECT_KEY,
        } as TypeOrmModuleOptions),
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);
        dataSource.driver = new DetaDriver(options);
        Object.assign(dataSource, {
          manager: new DetaEntityManager(dataSource),
        });
        return await dataSource.initialize();
      },
    }),
    // libs redis
    RedisModule.forRootAsync(
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          return {
            closeClient: true,
            readyLog: true,
            errorLog: true,
            config: config.get<RedisClientOptions>('redis'),
          };
        },
      },
      true,
    ),
    AvatarModule,
    UserModule,
    AuthModule,
    ArticleModule,
    CommentModule,
    OssModule,
    MessageModule,
  ],
  // app module 守卫，两个守卫分别依赖 UserService、PermService, 而 UserService、PermService 没有设置全局模块，
  // 所以这俩 守卫 不能再 main.ts 设置全局守卫
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
