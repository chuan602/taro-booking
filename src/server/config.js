//是否使用https
exports.isHttps = false;

// 发车前截止订票时间，单位分钟
exports.DEADLINE_TIME = 10;

// 车票超过发车时间的过期时间，单位分钟
exports.INVALIDATION_TIME = 10;

// 扫码端获取班车列表 延后时间
exports.SCAN_DEADLINE_TIME = 30;

// 存储Socket对象的Map
exports.SocketMap = new Map();
