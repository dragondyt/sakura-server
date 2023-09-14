import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadStrategyFactory } from '../../common/upload/upload.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import { OssEntity } from './oss.entity';
import { OssService } from './oss.service';
@Controller('/file')
@ApiBearerAuth()
@ApiTags('文件模块')
export class OssController {
  constructor(
    private readonly strategyFactory: UploadStrategyFactory,
    private ossService: OssService,
  ) {}

  //
  @Post('upload')
  @ApiOperation({ summary: '文件上传,返回 url 地址' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          description: '文件',
          type: 'string',
          format: 'binary',
        },
        business: {
          description: '上传文件描述，可以是纯字符串，也可以是JSON字符串',
          type: 'string',
          format: 'text',
        },
      },
    },
  })
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiResult(OssEntity)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() params: { business: string },
    @Req() req: any,
  ) {
    const result = await this.ossService.uploadFile(
      [file],
      params.business || '',
      req.user,
    );
    const data = Array.isArray(result) ? result[0] : result;
    console.log(data);
    return {
      code: 200,
      data: {
        uid: data.id,
        name: data.url,
        url: data.url,
      },
    };
  }
}
