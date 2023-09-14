import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AllowAnon } from '../../common/decorators/allow-anon.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResultData } from '../../utils/result';
@ApiTags('消息模块')
@ApiBearerAuth()
@Controller('/message')
export class MessageController {
  @Get('list')
  @AllowAnon()
  async getMessageList(@Query() query: any) {
    return ResultData.ok();
    //
  }
}
