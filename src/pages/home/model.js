import Taro from '@tarojs/taro';
import {
  queryBookingTicketService,
  queryCarListByDateService
} from './service';
import { queryIntegralService } from "../../models/globalService";
import {USER_INFO} from "../../utils/constants";
import {manBaseDay, stuBaseDay, teaBaseDay} from "../../config";
import dayjs from "dayjs";

const processAvailableBookingDay = (integral ,baseDay) => {
  const resultObj = { calcDay: 1, isSixHour: false };
  console.log('integral', integral);
  if (integral === 10) resultObj.calcDay = baseDay;
  if (integral >= 8 && integral <= 9) resultObj.calcDay = baseDay - 1;
  if (integral >= 4 && integral <= 7) resultObj.calcDay = baseDay - 2;
  if (integral >= 1 && integral <= 3) resultObj.isSixHour = true;
  return resultObj;
};

export default {
  namespace: 'home',
  state: {
    carList: [],
    h_ticket: [],
    b_ticket: [],
    tmp_orderId: '',
    isShowQr: false,
    tabList: [],
    isSixHour: false
  },
  effects: {
    *queryCarListByDate({tabCurrent}, { put, call, select }){
      try {
        const { id } = Taro.getStorageSync(USER_INFO);
        const result = yield call(queryIntegralService, id);
        const { data: integral } = result;
        yield put({
          type: 'queryTabList',
          integral
        });
        const {tabList, isSixHour} = yield select(({ home }) => home);
        console.log('tabList', tabList);
        const res = yield call(queryCarListByDateService, tabList[tabCurrent].value, isSixHour);
        yield put({
          type: 'queryCarListEnd',
          payload: res.data || []
        })
      } finally {
        Taro.hideLoading();
        Taro.stopPullDownRefresh();
      }
    },
    *queryBookingTicket({carId, num, userId}, { put, call }){
      Taro.showLoading({
        title: '',
        mask: true
      });
      const res = yield call(queryBookingTicketService, carId, num, userId);
      Taro.hideLoading();
      if (res.data) {
        yield put({
          type: 'queryBookingTicketEnd',
          payload: res.data
        });
        yield put({
          type: 'isShowQrEnd',
          payload: true
        })
      } else {
        Taro.showModal({
          title: '订票失败',
          content: '抱歉，您已订此班车票，不能重复订票',
          showCancel: false
        });
      }
    }
  },
  reducers: {
    queryCarListEnd(state, { payload }){
      const h_ticket = payload.filter(item => item.campus === '01');
      const b_ticket = payload.filter(item => item.campus === '02');
      return { ...state, carList: payload, h_ticket, b_ticket};
    },
    queryBookingTicketEnd(state, { payload, clear }){
      return {
        ...state,
        tmp_orderId: clear ? '' : payload
      }
    },
    isShowQrEnd(state, { payload }){
      return {
        ...state,
        isShowQr: payload
      }
    },
    queryTabList(state, { integral }){
      const authObj = Taro.getStorageSync(USER_INFO);
      const auth_stu = authObj.authority === 1;
      const auth_tea = authObj.authority === 2;
      const bookableDateObj = auth_stu
        ? processAvailableBookingDay(integral, stuBaseDay)
        : auth_tea
          ? processAvailableBookingDay(integral, teaBaseDay)
          : {calcDay: manBaseDay, isSixHour: false};
      const today = dayjs();
      const tabList = [];
      // 更新tabs日期
      for (let i = 0; i < bookableDateObj.calcDay; ++i) {
        tabList.push({
          title: today.add(i, 'day').format('M[月]DD'),
          value: today.add(i, 'day').format('YYYY-MM-DD')
        })
      }
      return {
        ...state,
        tabList,
        isSixHour: bookableDateObj.isSixHour
      }
    }
  },
};
