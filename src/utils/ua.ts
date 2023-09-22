import {UAParser} from 'ua-parser-js';

const OS_VERSION_MAP = {Windows: {'NT 11.0': '11',},};

export function uaParser(uaText) {
    const ua =  UAParser(uaText);
    if (OS_VERSION_MAP[ua.os.name] && OS_VERSION_MAP[ua.os.name][ua.os.version]) ua.os.version = OS_VERSION_MAP[ua.os.name][ua.os.version];
    return ua;
}