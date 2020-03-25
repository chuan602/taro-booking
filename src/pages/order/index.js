import React from "react";
import Taro, {Component} from '@tarojs/taro';
import {View, Text, Image, ScrollView, Button} from '@tarojs/components';
import {connect} from '@tarojs/redux';
import {
  AtModal, AtModalAction, AtModalContent, AtModalHeader,
  AtTabs, AtTabsPane
} from 'taro-ui';
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
import './index.less';
import Blank from "../../components/Blank";
import OrderItem from "../../components/OrderItem";
import {baseUrl, wsBaseUrl} from "../../config";
import {USER_INFO} from "../../utils/constants";

const tabList = [
  {
    title: '全部'
  },
  {
    title: '待出行'
  },
  {
    title: '已出行'
  },
  {
    title: '已过期'
  },
  {
    title: '已退票'
  }
];

@connect(({order}) => ({
  ...order,
}))
class Order extends Component {

  state = {
    tabCurrent: 0,
    isModalOpen: false,
    tmp_orderId: '',
    socket: {}
  };

  config = {
    navigationBarTitleText: '我的订单',
    enablePullDownRefresh: true
  };

  onPullDownRefresh = () => {
    Taro.showLoading({
      title: '正在加载...',
      mask: true,
    });
    this.queryAllOrderData();
  };


  componentDidMount = () => {
    Taro.showLoading({
      title: '正在加载...',
      mask: true,
    });
    this.queryAllOrderData();
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isModalOpen } = this.state;
    // Modal关闭时间执行
    if (prevState.isModalOpen && prevState.isModalOpen !== isModalOpen){
      this.queryAllOrderData();
    }
  }

  queryAllOrderData = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'order/queryOrderList',
    });
  };

  handleTabClick = (current) => {
    const { tabCurrent } = this.state;
    current !== tabCurrent && this.setState({
      tabCurrent: current
    }, () => {
      Taro.showLoading({
        title: '正在加载...',
        mask: true,
      });
      this.queryAllOrderData();
    })
  };

  handleModalClose = () => {
    const { socket } = this.state;
    // 关闭socket
    socket.close && socket.close();
    this.setState({
      isModalOpen: false
    });
  };

  createSocketConnection = (orderId) => {
    const _that = this;
    Taro.connectSocket({
      url: `${wsBaseUrl}/wss?orderId=${encodeURIComponent(orderId)}`
    })
      .then(socket => {
        socket.onMessage(function (msg) {
          const { data } = msg;
          if (data === 'ok') {
            socket.close();
            Taro.showToast({
              title: '乘车成功',
              icon: 'success',
              duration: 3000,
              mask: true
            });
            setTimeout(() => {
              _that.setState({
                isModalOpen: false
              })
            }, 3000);
          }
        });
        this.setState({
          socket
        })
      })
  };

  handleShowQrClick = (id) => {
    this.createSocketConnection(id);
    this.setState({
      isModalOpen: true,
      tmp_orderId: id
    })
  };

  processPunishIntegral = (orderId) => {
    const { allOrder } = this.props;
    const {depart_date, depart_time} = allOrder.find(item => item.id === orderId) || {};
    const departTime = dayjs(`${depart_date} ${depart_time}`);
    const departTimeOneHourBefore = departTime.subtract(1, 'hour');
    const departTimeFourHourBefore = departTime.subtract(4, 'hour');
    const now = dayjs();
    if (now.isAfter(departTimeOneHourBefore)) return 2;
    if (now.isBetween(departTimeFourHourBefore, departTimeOneHourBefore, 'second', '[]')) return 1;
    return 0;
  };

  handleReturnTicketClick = (id) => {
    const { authority } = Taro.getStorageSync(USER_INFO);
    const isManager = authority === 3;
    // 计算退票时间离发车时长，并据此计算所要扣积分数
    const punishIntegral = isManager ? 0 : this.processPunishIntegral(id);
    let content = isManager
      ? '你确定要退回该车票？'
      : punishIntegral
        ? `你确定要退回该车票？ \n将会扣除 ${punishIntegral} 积分`
        : `你确定要退回该车票？ \n将不会扣除积分`;
    this.setState({
      tmp_orderId: id
    }, () => {
      Taro.showModal({
        title: '退票确认',
        content
      })
        .then(({confirm}) => {
          confirm && this.handleReturnConfirm(punishIntegral);
        });
    });
  };

  handleReturnCancel = () => {
    this.setState({
      isModalOpen: false
    })
  };

  handleReturnConfirm = (punishIntegral) => {
    const {dispatch} = this.props;
    const {tmp_orderId} = this.state;
    dispatch({
      type: 'order/queryOrderReturn',
      orderId: tmp_orderId,
      punishIntegral
    });
  };

  renderQrLayout = () => {
    const {tmp_orderId} = this.state;
    return (
      <View>
        <AtModalContent>
          <View className='modal-qr-container'>
            <Text>二维码凭证：</Text>
          </View>
          <View className='modal-image-container'>
            <Image
              mode='aspectFit'
              src={`${baseUrl}/qr/${encodeURIComponent(tmp_orderId)}`}
            />
          </View>
        </AtModalContent>
      </View>
    );
  };

  renderModal = () => {
    const {isModalOpen} = this.state;
    return (
      <AtModal
        isOpened={isModalOpen}
        onClose={this.handleModalClose}
      >
        {
          this.renderQrLayout()
        }
      </AtModal>
    )
  };

  render() {
    const {tabCurrent} = this.state;
    const {allOrder} = this.props;
    const togoOrder = allOrder.filter(order => order.order_status === 0) || [];
    const expiredOrder = allOrder.filter(order => order.order_status === 1) || [];
    const returnedOrder = allOrder.filter(order => order.order_status === 2) || [];
    const invalidOrder = allOrder.filter(order => order.order_status === 3) || [];
    return (
      <View className="order">
        <AtTabs
          current={tabCurrent}
          tabList={tabList}
          className='order-tabs'
          onClick={this.handleTabClick}
        >
          <AtTabsPane className='order-tabPane' current={tabCurrent} index={0}>
            <ScrollView
              scrollY
              enableBackToTop
              className='order-scroll-list'
            >
              <View className='order-tabPane-container'>
                {
                  allOrder.length ? allOrder.map(order => (
                    <OrderItem
                      key={order.id}
                      statusCode={order.order_status}
                      departure={order.campus === '01' ? '海珠校区' : '白云校区'}
                      destination={order.campus === '01' ? '白云校区' : '海珠校区'}
                      orderTime={order.order_time}
                      departTime={`${order.depart_date}  ${order.depart_time}`}
                      departPlace={order.depart_place}
                      ticketNum={order.ticket_num}
                      carNum={order.car_num}
                      onShowQrClick={() => this.handleShowQrClick(order.id)}
                      onReturnTicketClick={() => this.handleReturnTicketClick(order.id)}
                    />
                  )) : <Blank/>
                }
              </View>
            </ScrollView>
          </AtTabsPane>
          <AtTabsPane className='order-tabPane' current={tabCurrent} index={1}>
            <ScrollView
              scrollY
              enableBackToTop
              className='order-scroll-list'
            >
              <View className='order-tabPane-container'>
                {
                  togoOrder.length ? togoOrder.map(order => (
                    <OrderItem
                      key={order.id}
                      statusCode={order.order_status}
                      departure={order.campus === '01' ? '海珠校区' : '白云校区'}
                      destination={order.campus === '01' ? '白云校区' : '海珠校区'}
                      orderTime={order.order_time}
                      departTime={`${order.depart_date}  ${order.depart_time}`}
                      departPlace={order.depart_place}
                      ticketNum={order.ticket_num}
                      carNum={order.car_num}
                      onShowQrClick={() => this.handleShowQrClick(order.id)}
                      onReturnTicketClick={() => this.handleReturnTicketClick(order.id)}
                    />
                  )) : <Blank/>
                }
              </View>
            </ScrollView>
          </AtTabsPane>
          <AtTabsPane className='order-tabPane' current={tabCurrent} index={2}>
            <ScrollView
              scrollY
              enableBackToTop
              className='order-scroll-list'
            >
              <View className='order-tabPane-container'>
                {
                  expiredOrder.length ? expiredOrder.map(order => (
                    <OrderItem
                      key={order.id}
                      statusCode={order.order_status}
                      departure={order.campus === '01' ? '海珠校区' : '白云校区'}
                      destination={order.campus === '01' ? '白云校区' : '海珠校区'}
                      orderTime={order.order_time}
                      departTime={`${order.depart_date}  ${order.depart_time}`}
                      departPlace={order.depart_place}
                      ticketNum={order.ticket_num}
                      carNum={order.car_num}
                    />
                  )) : <Blank/>
                }
              </View>
            </ScrollView>
          </AtTabsPane>
          <AtTabsPane className='order-tabPane' current={tabCurrent} index={3}>
            <ScrollView
              scrollY
              enableBackToTop
              className='order-scroll-list'
            >
              <View className='order-tabPane-container'>
                {
                  invalidOrder.length ? invalidOrder.map(order => (
                    <OrderItem
                      key={order.id}
                      statusCode={order.order_status}
                      departure={order.campus === '01' ? '海珠校区' : '白云校区'}
                      destination={order.campus === '01' ? '白云校区' : '海珠校区'}
                      orderTime={order.order_time}
                      departTime={`${order.depart_date}  ${order.depart_time}`}
                      departPlace={order.depart_place}
                      ticketNum={order.ticket_num}
                      carNum={order.car_num}
                    />
                  )) : <Blank/>
                }
              </View>
            </ScrollView>
          </AtTabsPane>
          <AtTabsPane className='order-tabPane' current={tabCurrent} index={4}>
            <ScrollView
              scrollY
              enableBackToTop
              className='order-scroll-list'
            >
              <View className='order-tabPane-container'>
                {
                  returnedOrder.length ? returnedOrder.map(order => (
                    <OrderItem
                      key={order.id}
                      statusCode={order.order_status}
                      departure={order.campus === '01' ? '海珠校区' : '白云校区'}
                      destination={order.campus === '01' ? '白云校区' : '海珠校区'}
                      orderTime={order.order_time}
                      departTime={`${order.depart_date}  ${order.depart_time}`}
                      departPlace={order.depart_place}
                      ticketNum={order.ticket_num}
                      carNum={order.car_num}
                    />
                  )) : <Blank/>
                }
              </View>
            </ScrollView>
          </AtTabsPane>
        </AtTabs>
        {
          /*
          * 渲染模态框
          * */
          this.renderModal()
        }
      </View>
    );
  }
}

export default Order;
