import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ArticleEntity } from './article.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: MongoRepository<ArticleEntity>,
  ) {}

  async list(page: number, pageSize: number) {
    return this.articleRepository.find({
      take: pageSize,
      offset: Math.max((page - 1) * pageSize, 0),
    });
  }

  async add(article: ArticleEntity) {
    return this.articleRepository.insertOne(article);
  }

  async selectOne(where: any) {
    return await this.articleRepository.findOne({ where });
  }

  async deleteByIds(ids: string[]) {
    await Promise.all(
      ids.map((id) => this.articleRepository.deleteOne({ objectId: id })),
    );
  }
}
