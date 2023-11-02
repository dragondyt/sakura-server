import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { $enum } from 'ts-enum-util';

import { UserType, StatusValue } from '../../common/enums/common.enum';

@Entity('Comment')
export class CommentEntity {
  @ApiProperty({ type: String, description: 'id' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  public objectId: string;

  @ApiProperty({ type: String, description: 'url' })
  @Column({ type: 'varchar', length: 200, nullable: false, comment: '地址' })
  public url: string;
  @ApiProperty({ type: String, description: 'rid' })
  public rid: string;
  @ApiProperty({ type: String, description: 'mail' })
  public mail: string;
  @ApiProperty({ type: String, description: 'nick' })
  public nick: string;
  @ApiProperty({ type: String, description: 'link' })
  public link: string;
  @ApiProperty({ type: String, description: 'comment' })
  public comment: string;
  @ApiProperty({ type: String, description: 'user_id' })
  public user_id: string;
  @ApiProperty({ type: Boolean, description: 'sticky' })
  public sticky: boolean;
  @ApiProperty({ type: Number, description: 'sticky' })
  public like: number;
  @ApiProperty({ type: Date, description: 'insertedAt' })
  public insertedAt: Date;
}
