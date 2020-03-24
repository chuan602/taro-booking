import Request from '../../utils/request';

//登陆并获取用户信息
export const loginService = ({ userNum, password }) => (
  Request({
    url: '/login',
    method: 'POST',
    data: {
      userNum,
      password
    }
  })
);


