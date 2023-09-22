import {Injectable} from "@nestjs/common";
import nunjucks from 'nunjucks';
import {Md5} from 'ts-md5';
import {CommentEntity} from "../../controller/comment/comment.entity";

const {GRAVATAR_STR} = process.env;
const DEFAULT_GRAVATAR_STR: string = `{%- set numExp = r/^[0-9]+$/g -%}
{%- set qqMailExp = r/^[0-9]+@qq.com$/ig -%}
{%- if numExp.test(nick) -%}
  https://q1.qlogo.cn/g?b=qq&nk={{nick}}&s=100
{%- elif qqMailExp.test(mail) -%}
  https://q1.qlogo.cn/g?b=qq&nk={{mail|replace('@qq.com', '')}}&s=100
{%- else -%}
  https://seccdn.libravatar.org/avatar/{{mail|md5}}
{%- endif -%}`;
const env = new nunjucks.Environment();
env.addFilter('md5', (str) => Md5.hashStr(str));

@Injectable()
export class AvatarService {

    async stringify(comment: CommentEntity) {
        const gravatarStr = GRAVATAR_STR || DEFAULT_GRAVATAR_STR;

        return env.renderString(gravatarStr, comment);
    }
}