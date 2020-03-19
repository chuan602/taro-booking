import React from "react";
import Taro, {Component} from '@tarojs/taro';
import {View, Text, Image, ScrollView, Button} from '@tarojs/components';
import {connect} from '@tarojs/redux';
import {
  AtModal, AtModalAction, AtModalContent, AtModalHeader,
  AtTabs, AtTabsPane
} from 'taro-ui';
import './index.less';
import Blank from "../../components/Blank";
import OrderItem from "../../components/OrderItem";
import {baseUrl} from "../../config";

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
    tmp_orderId: ''
  };

  config = {
    navigationBarTitleText: '我的订单',
    enablePullDownRefresh: true
  };

  onPullDownRefresh = () => {
    this.queryAllOrderData();
  };


  componentDidMount = () => {
    this.queryAllOrderData();
  };

  queryAllOrderData = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'order/queryOrderList',
    });
  };

  handleTabClick = (current) => {
    this.setState({
      tabCurrent: current
    })
  };

  handleModalClose = () => {
    this.setState({
      isModalOpen: false
    })
  };

  handleShowQrClick = (id) => {
    this.setState({
      isModalOpen: true,
      tmp_orderId: id
    })
  };

  handleReturnTicketClick = (id) => {
    this.setState({
      tmp_orderId: id
    }, () => {
      Taro.showModal({
        title: '退票确认',
        content: '你确定要退回该车票？'
      })
        .then(({confirm}) => {
          confirm && this.handleReturnConfirm();
        });
    });
  };

  handleReturnCancel = () => {
    this.setState({
      isModalOpen: false
    })
  };

  handleReturnConfirm = () => {
    const {dispatch} = this.props;
    const {tmp_orderId} = this.state;
    dispatch({
      type: 'order/queryOrderReturn',
      payload: tmp_orderId
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
    return (
      <View className="order">
        <AtTabs
          current={tabCurrent}
          tabList={tabList}
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
