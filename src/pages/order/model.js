import Taro from '@tarojs/taro';
import { queryOrderListService, queryOrderReturnService } from './service';
import { USER_INFO } from '../../utils/constants';

export default {
  namespace: 'order',
  state: {
    allOrder: []
  },
  effects: {
    *queryOrderList({ payload }, { put, call }){
      try {
        const auth = Taro.getStorageSync(USER_INFO);
        const { id } = auth;
        const res = yield call(queryOrderListService, id);
        const { status, data } = res.data;
        if (status === 400){
          Taro.showModal({
            title: '警告',
            content: '由于新增过期车票，导致您的积分已达0分，现暂停该账号使用',
            showCancel: false,
          })
            .then(() => {
              Taro.clearStorage();
              Taro.reLaunch({
                url: '/pages/login/index'
              })
            })
        }
        yield put({
          type: 'queryOrderListEnd',
          payload: data || []
        })
      } finally {
        Taro.hideLoading();
        Taro.stopPullDownRefresh();
      }
    },
    *queryOrderReturn({ orderId, punishIntegral }, { put, call }){
      const { id } = Taro.getStorageSync(USER_INFO);
      const res = yield call(queryOrderReturnService, orderId, punishIntegral, id);
      const { status } = res.data;
      if (status === 200) Taro.showToast({
        title: '退票成功',
        icon: 'success',
        mask: true
      });
      // 更新数据
      yield put({
        type: 'queryOrderList'
      });
    }
  },
  reducers: {
    queryOrderListEnd(state, { payload }){
      return {
        ...state,
        allOrder: payload
      }
    }
  },
};
