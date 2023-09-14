import { Strategy } from '../upload.strategy';
import * as uuid from 'uuid';
import mime from 'mime-types';
import { Deta } from 'deta';
import * as process from 'process';
export class DetaStrategy implements Strategy {
  upload(file: Express.Multer.File): Promise<string> {
    const drive = Deta(process.env.DETA_PROJECT_KEY).Drive('oss');
    const id = uuid.v4().replace(/-/g, '');
    const newFileName = `${id}.${mime.extension(file.mimetype)}`;
    return drive.put(newFileName, {
      data: file.buffer,
    });
  }
}
