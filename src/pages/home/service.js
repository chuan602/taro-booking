import Request from '../../utils/request';

export const queryCarListByDateService = (date, isSixHour) =>
  Request({
    url: '/carList',
    method: 'GET',
    data: {
      date,
      isSixHour
    },
  });

export const queryBookingTicketService = (carId, num, userId) =>
  Request({
    url: '/booking',
    method: 'POST',
    data: {
      id: carId,
      num,
      userId
    }
  });

