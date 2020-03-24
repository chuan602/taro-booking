import Request from '../utils/request';

export const queryIntegralService = (userId) =>
  Request({
    url: '/integral/' + encodeURIComponent(userId),
    method: 'get',
  });
