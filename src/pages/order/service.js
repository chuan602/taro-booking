import Request from '../../utils/request';

export const queryOrderListService = (userId) =>
  Request({
    url: '/order/list/' + encodeURIComponent(userId),
    method: 'GET'
  });

export const queryOrderReturnService = (orderId, punishIntegral, userId) =>
  Request({
    url: '/order/return',
    method: 'POST',
    data: {
      orderId,
      punishIntegral,
      userId
    }
  });
