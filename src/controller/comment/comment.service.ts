import { Inject, Injectable, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';
import { REQUEST } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { getMarkdownParser } from '../../common/markdown';
import { isBoolean, isEmpty } from '../../utils';
import { UserEntity } from '../../system/user/user.entity';
import {AvatarService} from "../../common/avatar/avatar.service";
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly avatarService: AvatarService,
  ) {}
  //
  async saveComment(commentData: any) {
    const { comment, link, mail, nick, pid, rid, ua, url, at } = commentData;
    const data = {
      link,
      mail,
      nick,
      pid,
      rid,
      ua,
      url,
      comment,
      ip: '',
      status: 'waiting',
      insertedAt: new Date(),
      user_id: this.request['user']?.id,
    };
    if (pid) {
      data.comment = `[@${at}](#${pid}): ` + data.comment;
    }
    const commentEntity = plainToInstance(
      CommentEntity,
      { ...data },
      { enableImplicitConversion: true },
    );
    const user = this.request['user'];

    if (!user || user.type !== 'administrator') {
      const duplicate = await this.commentRepository.findBy({
        url,
        mail: data.mail,
        nick: data.nick,
        link: data.link,
        comment: data.comment,
      });
      if (!isEmpty(duplicate)) {
        return {
          errno: 1000,
          errmsg: '发送的内容之前已经发过',
          data: '',
        };
      }
    } else {
      data.status = 'approved';
    }
    const result = await this.commentRepository.insert(commentEntity);
    return {
      errno: 0,
      errmsg: '',
      data: await this.formatCmt(result.raw, user ? [user] : [], {}, user),
    };
  }

  async formatCmt(
    { ua, ip, ...comment }: any,
    users: UserEntity[] = [],
    { avatarProxy, deprecated }: any,
    loginUser: any,
  ) {
    const user: any = users.find(
      ({ objectId }) => comment.user_id === objectId,
    );

    if (!isEmpty(user)) {
      comment.nick = user.display_name;
      comment.mail = user.email;
      comment.link = user.url;
      comment.type = user.type;
      comment.label = user.label;
    }

    const avatarUrl = user && user.avatar ? user.avatar : await this.avatarService.stringify(comment);

    comment.avatar =
      avatarProxy && !avatarUrl.includes(avatarProxy)
        ? avatarProxy + '?url=' + encodeURIComponent(avatarUrl)
        : avatarUrl;

    const isAdmin = loginUser && loginUser.type === 'administrator';

    if (loginUser) {
      comment.orig = comment.comment;
    }
    if (!isAdmin) {
      delete comment.mail;
    } else {
      comment.ip = ip;
    }

    comment.comment = getMarkdownParser()(comment.comment);
    comment.like = Number(comment.like) || 0;

    // compat sql storage return number flag to string
    if (typeof comment.sticky === 'string') {
      comment.sticky = Boolean(Number(comment.sticky));
    }

    comment.time = new Date(comment.insertedAt).getTime();
    if (!deprecated) {
      delete comment.insertedAt;
    }
    delete comment.createdAt;
    delete comment.updatedAt;

    return comment;
  }

  async getCommentList(query: any) {
    const { page, pageSize, path: url } = query;
    let rootCount = 0;
    const totalCount = await this.commentRepository.count({ where: { url } });
    const pageOffset = Math.max((page - 1) * pageSize, 0);
    let comments: CommentEntity[] = [];
    let rootComments: CommentEntity[] = [];
    const where = { url };
    if (totalCount < 1000) {
      comments = await this.commentRepository.find({ where });
      rootCount = comments.filter(({ rid }) => !rid).length;
      rootComments = [
        ...comments.filter(({ rid, sticky }) => !rid && sticky),
        ...comments.filter(({ rid, sticky }) => !rid && !sticky),
      ].slice(pageOffset, pageOffset + pageSize);
      const rootIds = {};

      rootComments.forEach(({ objectId }) => {
        rootIds[objectId] = true;
      });
      comments = comments.filter(
        (cmt) => rootIds[cmt.objectId] || rootIds[cmt.rid],
      );
    }
    const user_ids = Array.from(
      new Set(comments.map(({ user_id }) => user_id).filter((v) => v)),
    );
    let users: UserEntity[] = [];
    if (user_ids.length) {
      users = await this.userRepository.find({
        where: {
          objectId: In(user_ids),
        },
      });
    }
    return {
      page,
      totalPages: Math.ceil(rootCount / pageSize),
      count: totalCount,
      data: await Promise.all(
        rootComments.map(async (comment) => {
          const cmt = await this.formatCmt(
            comment,
            users,
            {},
            this.request['user'],
          );
          cmt.children = await Promise.all(
            comments
              .filter(({ rid }) => rid === cmt.objectId)
              .map((cmt) =>
                this.formatCmt(cmt, users, {}, this.request['user']),
              )
              .reverse(),
          );
          return cmt;
        }),
      ),
    };
  }

  async updateComment(data: any) {
    const userInfo = this.request['user'];
    const oldData = await this.commentRepository.findOne({
      where: { objectId: data.id },
    });
    if (isBoolean(data.like)) {
      const likeIncMax = 1;
      data.like =
        (Number(oldData.like) || 0) +
        (data.like ? Math.ceil(Math.random() * likeIncMax) : -1);
      data.like = Math.max(data.like, 0);
    }
    const newData = await this.commentRepository.update(data.id, data);
    let cmtUser;
    const cmtReturn = await this.formatCmt(
      newData.raw[0],
      cmtUser ? [cmtUser] : [],
      {},
      userInfo,
    );
    console.log(oldData);
    return Promise.resolve({
      errno: 0,
      errmsg: '',
      data: cmtReturn,
    });
  }
}
