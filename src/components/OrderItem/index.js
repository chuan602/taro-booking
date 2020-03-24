import Taro, { Component } from '@tarojs/taro';
import {Text, View, Button} from "@tarojs/components";
import 'taro-ui/dist/style/index.scss';
import './index.less';

import iconTogo from '../../images/order/order_togo.png';
import iconHaveWent from '../../images/order/order_already.png';
import iconReturn from '../../images/order/order_return.png';
import iconOutofdate from '../../images/order/order_outofdate.png';

export default class OrderItem extends Component{
  processStatusCode = (togo, haveWent, haveReturn, invalidation) => {
    const { statusCode } = this.props;
    switch (statusCode) {
      case 0:
        return togo;
      case 1:
        return haveWent;
      case 2:
        return haveReturn;
      case 3:
        return invalidation;
      default:
        return ;
    }
  };

  render() {
    const {
      key,
      departure,
      destination,
      orderTime,
      departTime,
      departPlace,
      ticketNum,
      carNum,
      statusCode,
      onShowQrClick=()=>{},
      onReturnTicketClick=()=>{}
    } = this.props;
    const btnGroup = (
      <View className='btn-group-container'>
        <Button
          className='btn btn-show-qr'
          size='mini'
          onClick={onShowQrClick}
        >
          查看二维码
        </Button>
        <Button
          className='btn btn-return-ticket'
          size='mini'
          onClick={onReturnTicketClick}
        >
          退票
        </Button>
      </View>
    );
    return (
      <View
        key={key}
        className='order-container'
      >
        <View className='title-container'>
          <View className='title-left'>
            <Image
              src={
                this.processStatusCode(iconTogo, iconHaveWent, iconReturn, iconOutofdate)
              }
              className='title-icon'
            />
            <Text>
              {departure}
              <Text style={{ color: '#ccc', padding: '0 10px' }}>至</Text>
              {destination}
            </Text>
          </View>
          <Text className='title-right' style={{ color: this.processStatusCode('#1afa29', '#e6e6e6', '#707070', '#f83261') }}>
            {
              this.processStatusCode('待出行','已出行', '已退票', '已过期')
            }
          </Text>
        </View>
        <View className='content'>
          <View className='content-item'>
            发车时间：{ departTime }
          </View>
          <View className='content-item'>
            上车地点：{ departPlace }
          </View>
          <View className='content-item'>
            订票时间：{ orderTime }
          </View>
          <View className='content-item'>
            车牌号码：{ carNum }
          </View>
          <View className='content-item'>
            订票数量：{ ticketNum }
          </View>
          {
            statusCode === 3 ? (
              <View className='content-item' style={{color: '#F83261'}}>
                已扣除4积分
              </View>
            ) : ''
          }
        </View>
        {
          statusCode === 0 ? btnGroup : ''
        }
      </View>
    )
  }
}


