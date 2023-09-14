import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from './user.entity';
import { RedisKeyPrefix } from '../../common/enums/redis-key-prefix.enum';
import { getRedisKey } from '../../utils';
import { RedisService } from '../../common/libs/redis/redis.service';
import { ResultData } from '../../utils/result';
import { CreateTokenDto } from './dto/create-token.dto';
import { ConfigService } from '@nestjs/config';
import { AppHttpCode } from '../../common/enums/code.enum';
import { genSalt, hash, compare, genSaltSync, hashSync } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import ms from 'ms';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { validEmail, validPhone } from '../../utils/validate';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 生成 token 与 刷新 token
   * @param payload
   * @returns
   */
  genToken(payload: { id: string }): CreateTokenDto {
    const accessToken = `Bearer ${this.jwtService.sign(payload)}`;
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('jwt.refreshExpiresIn'),
    });
    return { accessToken, refreshToken };
  }

  /** 校验 token */
  verifyToken(token: string): string {
    try {
      if (!token) return null;
      const id = this.jwtService.verify(token.replace('Bearer ', ''));
      return id;
    } catch (error) {
      return null;
    }
  }

  /**
   * 登录
   * account 有可能是 账号/手机/邮箱
   */
  async login(account: string, password: string): Promise<ResultData> {
    let user = null;
    if (validPhone(account)) {
      // 手机登录
      user = await this.userRepo.findOne({ where: { phoneNum: account } });
    } else if (validEmail(account)) {
      // 邮箱
      user = await this.userRepo.findOne({ where: { email: account } });
    } else {
      // 账号
      user = await this.findOneByAccount(account);
    }
    if (!user)
      return ResultData.fail(
        AppHttpCode.USER_PASSWORD_INVALID,
        '帐号或密码错误',
      );
    const checkPassword = await compare(password, user.password);
    if (!checkPassword)
      return ResultData.fail(
        AppHttpCode.USER_PASSWORD_INVALID,
        '帐号或密码错误',
      );
    if (user.status === 0)
      return ResultData.fail(
        AppHttpCode.USER_ACCOUNT_FORBIDDEN,
        '您已被禁用，如需正常使用请联系管理员',
      );
    // 生成 token
    const data = this.genToken({ id: user.id });
    return ResultData.ok(data);
  }

  async findOneById(id: string): Promise<UserEntity> {
    const redisKey = getRedisKey(RedisKeyPrefix.USER_INFO, id);
    const result = await this.redisService.hGetAll(redisKey);
    // plainToInstance 去除 password slat
    let user = plainToInstance(UserEntity, result, {
      enableImplicitConversion: true,
    });
    if (!user?.objectId) {
      user = await this.userRepo.findOne({ where: { objectId: id } });
      user = plainToInstance(
        UserEntity,
        { ...user },
        { enableImplicitConversion: true },
      );
      await this.redisService.hmset(
        redisKey,
        instanceToPlain(user),
        ms(this.config.get<string>('jwt.expiresin')) / 1000,
      );
    }
    user.password = '';
    user.salt = '';
    return user;
  }

  async findOneByAccount(account: string): Promise<UserEntity> {
    return await this.userRepo.findOne({ where: { username: account } });
  }

  /** 创建用户 */
  async create(dto: CreateUserDto): Promise<ResultData> {
    if (dto.password !== dto.confirmPassword)
      return ResultData.fail(
        AppHttpCode.USER_PASSWORD_INVALID,
        '两次输入密码不一致，请重试',
      );
    const salt = await genSalt();
    dto.password = await hash(dto.password, salt);
    // plainToInstance  忽略转换 @Exclude 装饰器
    const user = plainToInstance(
      UserEntity,
      { salt, ...dto },
      { ignoreDecorators: true },
    );
    const result = await this.userRepo.save(user);
    return ResultData.ok(instanceToPlain(result));
  }
}
