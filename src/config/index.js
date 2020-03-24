// 请求连接前缀
export const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://chuan602.top'
  : 'http://localhost:443';

// export const baseUrl = 'https://chuan602.top';

// socket请求baseURL
export const wsBaseUrl = 'wss://chuan602.top';

// 各权限可提前订票基本天数
export const stuBaseDay = 3;
export const teaBaseDay = 4;
export const manBaseDay = 6;

// 输出日志信息
export const noConsole = false;
