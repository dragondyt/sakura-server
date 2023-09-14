import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Request,
  Headers,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AllowAnon } from '../../common/decorators/allow-anon.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResultData } from '../../utils/result';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import { LoginUser } from './dto/login-user.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
@ApiTags('登录注册')
@Controller('/user')
export class UserController {
  constructor(private userService: UserService) {}
  @ApiOperation({ summary: '登录' })
  @ApiResult(CreateTokenDto)
  @AllowAnon()
  @Post('login')
  async login(@Body() dto: LoginUser): Promise<ResultData> {
    return await this.userService.login(dto.username, dto.password);
  }
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResult(UserEntity)
  @AllowAnon()
  async create(@Body() user: CreateUserDto): Promise<ResultData> {
    return await this.userService.create(user);
  }
  @Post('info')
  async info(@Req() req: Request) {
    const user: UserEntity = req['user'];
    return ResultData.ok({
      name: user.username,
      avatar: user.avatar,
      email: user.email,
      job: 'frontend',
      jobName: '前端艺术家',
      organization: 'Frontend',
      organizationName: '前端',
      location: 'beijing',
      locationName: '北京',
      introduction: '人潇洒，性温存',
      personalWebsite: 'https://www.arco.design',
      phone: user.phoneNum,
      registrationDate: '2013-05-10 12:10:00',
      accountId: user.objectId,
      certification: 1,
      role: 'admin',
    });
  }
  @Post('logout')
  logout() {
    return {
      code: 200,
    };
  }
}
