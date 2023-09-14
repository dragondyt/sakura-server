import { Module } from '@nestjs/common';
import { OssController } from './oss.controller';
import { UploadStrategyFactory } from '../../common/upload/upload.service';
import { OssService } from './oss.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OssEntity } from './oss.entity';
@Module({
  imports: [TypeOrmModule.forFeature([OssEntity])],
  providers: [UploadStrategyFactory, OssService],
  controllers: [OssController],
})
export class OssModule {}
