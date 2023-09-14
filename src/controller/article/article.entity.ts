import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('Article')
export class ArticleEntity {
  @ApiProperty({ description: 'id' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  public id: number;

  @ApiProperty({ description: '上传用户id' })
  @Column({ type: 'varchar', name: 'user_id', comment: '上传用户id' })
  public articleTitle: string;

  @ApiProperty({ description: '上传用户id' })
  @Column({ type: 'varchar', name: 'user_id', comment: '上传用户id' })
  public articleContent: string;

  @ApiProperty({ description: '上传用户id' })
  @Column({ type: 'varchar', name: 'user_id', comment: '上传用户id' })
  public articleCover: string;

  @ApiProperty({ description: '上传用户id' })
  @Column({ type: 'varchar', name: 'user_id', comment: '上传用户id' })
  public tagNameList: string[];

  @ApiProperty({ description: '上传时间' })
  @CreateDateColumn({
    type: 'timestamp',
    name: 'create_date',
    comment: '创建时间',
  })
  createDate: Date | string;
}
