import { forwardRef, Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../system/user/user.entity';
import { CommentEntity } from './comment.entity';
import {AvatarService} from "../../common/avatar/avatar.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity]),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [CommentController],
  providers: [CommentService,AvatarService],
  exports: [CommentService],
})
export class CommentModule {}
