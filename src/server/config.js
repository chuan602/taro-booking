//是否使用https
exports.isHttps = false;

// 发车前截止订票时间，单位分钟
exports.DEADLINE_TIME = 10;

// 车票超过发车时间的过期时间，单位分钟
exports.INVALIDATION_TIME = 10;

// 扫码端获取班车列表 提前时间
exports.SCAN_DEADLINE_TIME = 30;

// 存储Socket对象的Map
exports.SocketMap = new Map();

// 车票过期 扣除积分
exports.INVALID_INTEGRAL = 4;

// 1~4小时 扣除积分
exports.ONE_TO_FOUR_INTEGRAL = 2;

// 1小时内 扣除积分
exports.IN_ONE_INTEGRAL = 1;

// 积分满分值
exports.ORIGINAL_INTEGRAL = 10;
