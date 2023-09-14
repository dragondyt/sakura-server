import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArticleEntity } from './article.entity';
import {AllowAnon} from "../../common/decorators/allow-anon.decorator";

@Controller('/article')
@ApiTags('文章模块')
@ApiBearerAuth()
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}
  @Post()
  async saveArticle(@Body() article: ArticleEntity) {
    await this.articleService.add(article);
    return {
      code: 200,
      data: {
        flag: true,
      },
    };
  }
  @Get(':articleId')
  async get(@Param('articleId') articleId: any) {
    const article = await this.articleService.selectOne({
      objectId: articleId,
    });
    if (article == null) {
      return {
        code: 200,
        data: {
          flag: true,
        },
      };
    }
    return {
      code: 200,
      data: {
        flag: true,
        data: article,
      },
    };
  }
  @Get()
  async list(@Query('current') page: number, @Query('size') pageSize: number) {
    const articles = this.articleService.list(page, pageSize);
    return {
      code: 200,
      data: {
        recordList: await articles,
      },
    };
  }
  @Delete()
  async delete(@Body('ids') ids: string[]) {
    await this.articleService.deleteByIds(ids);
    return {
      code: 200,
      data: {
        flag: true,
      },
    };
  }
  @Post('import')
  @AllowAnon()
  async importArticle(@Body() article: ArticleEntity) {
    await this.articleService.add(article);
    return {
      code: 200,
      data: {
        flag: true,
      },
    };
  }
}
