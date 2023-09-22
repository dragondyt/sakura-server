import { Module } from '@nestjs/common';
import {AvatarService} from "./avatar.service";

@Module({
    providers: [AvatarService],
})
export class AvatarModule {}
