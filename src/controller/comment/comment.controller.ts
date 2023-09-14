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
import { CommentService } from './comment.service';
@ApiTags('评论模块')
@ApiBearerAuth()
@Controller('/comment')
export class CommentController {
  constructor(private commentService: CommentService) {}
  @Get()
  @AllowAnon()
  async getCommentList(@Query() query: any) {
    return this.commentService.getCommentList(query);
    //
  }
  @Post()
  @AllowAnon()
  async save(@Body() commentData: any) {
    return this.commentService.saveComment(commentData);
  }
  @Put(':id')
  @AllowAnon()
  async updateComment(@Param('id') id: string, @Body() body: any) {
    body['id'] = id;
    return this.commentService.updateComment(body);
  }
}
