import { createReadStream } from 'fs';
import { Strategy } from '../upload.strategy';
import request from 'request';
import * as fs from 'fs';
import * as uuid from 'uuid';
import path from 'path';
import mime from 'mime-types';
import FormData from 'form-data';

export class SmStrategy implements Strategy {
  upload(file: Express.Multer.File): Promise<string> {
    const { SM_SECRET_TOKEN } = process.env;
    return new Promise<string>((resolve, reject) => {
      request(
        {
          url: 'https://sm.ms/api/v2/upload',
          // proxy: 'http://127.0.0.1:10809',
          formData: {
            smfile: {
              value: file.buffer,
              options: {
                filename: file.originalname,
                contentType: file.mimetype,
              },
            },
            format: 'json',
          },
          headers: {
            Authorization: `Basic ${SM_SECRET_TOKEN}`,
          },
          method: 'POST',
        },
        (err, res, body: any) => {
          if (err) {
            reject(err);
          } else if (res.statusCode === 200) {
            const data = JSON.parse(body);
            if (data.success) {
              resolve(data.data.url);
            } else {
              reject(data.message);
            }
          } else reject();
        },
      );
    });
  }
}
