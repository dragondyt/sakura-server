import { Injectable } from '@nestjs/common';
import { UploadStrategyFactory } from '../../common/upload/upload.service';
import * as uuid from 'uuid';
import mime from 'mime-types';
import { plainToInstance } from 'class-transformer';
import { OssEntity } from './oss.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
@Injectable()
export class OssService {
  constructor(
    private readonly strategyFactory: UploadStrategyFactory,
    @InjectRepository(OssEntity)
    private readonly ossRepository: MongoRepository<OssEntity>,
  ) {}
  //
  async uploadFile(
    files: Express.Multer.File[],
    business: string,
    user: { id: string; username: string },
  ): Promise<OssEntity[] | OssEntity> {
    const ossList = files.map(async (file) => {
      // 重新命名文件， uuid, 根据 mimeType 决定 文件扩展名， 直接拿后缀名不可靠
      const path = await this.strategyFactory.createStrategy('sm').upload(file);
      const ossFile = {
        url: path,
        size: file.size,
        type: file.mimetype,
        business: business || '',
        userId: user.id,
        userAccount: user.username,
      };
      return plainToInstance(OssEntity, ossFile);
    });
    const entities = await Promise.all(ossList);
    console.log(entities);
    await this.ossRepository.insertMany(entities);
    return entities;
    //
  }
}
