import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * @description:初始化环境变量
 * @Date: 2023-05-25 15:23:29
 * @Author: mulingyuer
 */
(function initEnv() {
  const customPath = resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);
  config({ path: customPath });
})();

export default process.env;
