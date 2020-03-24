import Taro from '@tarojs/taro';
import { loginService } from '../pages/login/service';
import { USER_INFO } from '../utils/constants';
import {queryIntegralService} from "./globalService";

export default {
  namespace: 'global',
  state: {
    access_token: Taro.getStorageSync('access_token'),
    loginLoading: false,
    isLoginError: false,
    username: '',
    password: '',
    myIntegral: 0
  },

  effects: {
    *queryLogin({ payload }, { put, call }){
      try {
        yield put({
          type: 'loginLoadingEnd',
          payload: true
        });
        const res = yield call(loginService, payload);
        const { status, data } = res.data;
        let msg = '账号或密码错误！';
        if (Math.floor(res.statusCode/500) === 1) {
          msg = '服务器出错，请联系管理员';
          Taro.atMessage({
            type: 'error',
            message: msg
          });
          yield put({
            type: 'isLoginErrorEnd',
            payload: true
          });
          return;
        }
        switch (status) {
          case 200:
            //登陆验证成功
            Taro.setStorageSync(USER_INFO, data);
            Taro.switchTab({
              url: '/pages/home/index'
            });
            break;
          case 400:
            // 显示出错标语
            msg = '抱歉，账号积分为0，账号暂停使用';
            Taro.atMessage({
              type: 'error',
              message: msg
            });
            yield put({
              type: 'isLoginErrorEnd',
              payload: true
            });
            break;
          case 401:
            // 显示出错标语
            msg = '账号密码错误，请重新输入';
            Taro.atMessage({
              type: 'error',
              message: msg
            });
            yield put({
              type: 'isLoginErrorEnd',
              payload: true
            });
            break;
          default:
            break;
        }
      } catch (e) {
        Taro.atMessage({
          type: 'error',
          message: '系统错误！请联系管理员！'
        });
      } finally {
        yield put({
          type: 'loginLoadingEnd',
          payload: false
        });
      }
    },
    *queryIntegral({}, { call, put }) {
      const { id } = Taro.getStorageSync(USER_INFO);
      const { data } = yield call(queryIntegralService, id);
      yield put({
        type: 'queryIntegralEnd',
        payload: data || 0
      })
    },
  },

  reducers: {
    username(state, { username }) {
      return { ...state, username };
    },
    password(state, { password }) {
      return { ...state, password }
    },
    loginLoadingEnd(state, { payload }) {
      return { ...state, loginLoading: payload }
    },
    isLoginErrorEnd(state, { payload }) {
      return { ...state, isLoginError: payload }
    },
    queryIntegralEnd(state, { payload }){
      return {
        ...state,
        myIntegral: payload
      }
    }
  },
};
