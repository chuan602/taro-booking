import React from "react";
import Taro, { Component } from '@tarojs/taro';
import {View, Image, Text} from '@tarojs/components';
import { connect } from '@tarojs/redux';
import { AtForm, AtInput, AtButton, AtIcon, AtMessage } from "taro-ui";
import zhku from '../../images/zhku.png';
import './index.less';

@connect(({ login, global }) => ({
  ...login,
  ...global
}))
class Login extends Component {
  state = {
    accountErrToastOpen: false,
    osErrToastOpen: false,
    usernameVal: '',
    passwordVal: ''
  };

  config = {
    navigationBarTitleText: '登录',
  };

  usernameOnChange(val) {
    this.setState({
      usernameVal: val
    })
  };

  passwordOnChange(val) {
    this.setState({
      passwordVal: val
    })
  };

  handleLogin() {
    const { dispatch } = this.props;
    const { usernameVal, passwordVal} = this.state;
    dispatch({
      type: 'global/queryLogin',
      payload: {userNum: usernameVal, password: passwordVal}
    });
  };

  render() {
    const { loading, isLoginError, dispatch } = this.props;
    const { usernameVal, passwordVal } = this.state;
    return (
      <View className='login-page' id='login-page'>
        <View className='img-container'>
          <Image className='zhku-img' mode='aspectFit' src={zhku} />
        </View>
        <AtForm>
          <AtInput
            clear
            autoFocus
            className='username'
            name='username'
            placeholder='请输入学号/工号'
            value={ usernameVal }
            error={isLoginError}
            onChange={ this.usernameOnChange.bind(this) }
            onFocus={ () => dispatch({
              type: 'global/isLoginErrorEnd',
              payload: false
            }) }
          >
            <AtIcon value='user' size='30' color='#ccc'/>
          </AtInput>
          <AtInput
            clear
            className='password'
            name='password'
            placeholder='请输入密码'
            type='password'
            value={ passwordVal }
            error={isLoginError}
            onChange={ this.passwordOnChange.bind(this) }
            onFocus={ () => dispatch({
              type: 'global/isLoginErrorEnd',
              payload: false
            }) }
          >
            <AtIcon value='lock' size='30' color='#ccc'/>
          </AtInput>
          <AtButton
            type='primary'
            className='login-btn'
            loading={loading}
            onClick={this.handleLogin.bind(this)}
          >
            登陆
          </AtButton>
        </AtForm>
        <AtMessage />
      </View>
    );
  }
}

export default Login;
