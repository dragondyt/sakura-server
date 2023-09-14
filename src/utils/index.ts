import { RedisKeyPrefix } from '../common/enums/redis-key-prefix.enum';

export function objectToString(o: any) {
  return Object.prototype.toString.call(o);
}
export function isArray(arg: any) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
export function isBoolean(arg: any) {
  return typeof arg === 'boolean';
}
export function isDate(d: any) {
  return objectToString(d) === '[object Date]';
}
export function isError(e: any) {
  return objectToString(e) === '[object Error]' || e instanceof Error;
}
export function isNumber(arg: any) {
  return typeof arg === 'number';
}
export function isObject(arg: any) {
  return typeof arg === 'object' && arg !== null;
}
export function isRegExp(re: any) {
  return objectToString(re) === '[object RegExp]';
}
export function isString(arg: any) {
  return typeof arg === 'string';
}
/**
 * true empty
 * @param  {Mixed} obj []
 * @return {Boolean}     []
 */
function isTrueEmpty(obj: any) {
  if (obj === undefined || obj === null || obj === '') return true;
  if (isNumber(obj) && isNaN(obj)) return true;
  return false;
}
/**
 * check object is mepty
 * @param  {[Mixed]}  obj []
 * @return {Boolean}     []
 */
export function isEmpty(obj: any) {
  if (isTrueEmpty(obj)) return true;
  if (isRegExp(obj)) {
    return false;
  } else if (isDate(obj)) {
    return false;
  } else if (isError(obj)) {
    return false;
  } else if (isArray(obj)) {
    return obj.length === 0;
  } else if (isString(obj)) {
    return obj.length === 0;
  } else if (isNumber(obj)) {
    return obj === 0;
  } else if (isBoolean(obj)) {
    return !obj;
  } else if (isObject(obj)) {
    for (const key in obj) {
      return false && key; // only for eslint
    }
    return true;
  }
  return false;
}

/**
 * 获取 模块前缀与唯一标识 整合后的 redis key
 * @param moduleKeyPrefix 模块前缀
 * @param id id 或 唯一标识
 */
export function getRedisKey(
  moduleKeyPrefix: RedisKeyPrefix,
  id: string | number,
): string {
  return `${moduleKeyPrefix}${id}`;
}
