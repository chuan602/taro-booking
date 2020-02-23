import React from "react";
import Taro, { Component } from '@tarojs/taro';
import {View, Text, AtIcon, ScrollView, Button} from '@tarojs/components';
import { connect } from '@tarojs/redux';
import { AtTabs, AtTabsPane, AtInputNumber,
  AtModal, AtModalHeader, AtList, AtListItem,
  AtModalContent, AtModalAction,
  AtButton  } from 'taro-ui';
import './index.less';
import { ListItem } from "../../components/ListItem";
import {USER_INFO} from "../../utils/constants";

const tabList = [
  {
    title: '1月30'
  },
  {
    title: '1月31'
  },
  {
    title: '2月01'
  },
  {
    title: '2月02'
  },
  {
    title: '2月03'
  },
  {
    title: '2月04'
  }
];

@connect(({ home }) => ({
  ...home,
}))
class Index extends Component {

  state = {
    tabCurrent: 0,
    isHaizhuCampus: true,
    isModalOpen: false,
    carId: '',
    ticketBookingNum: 1
  };

  config = {
    navigationBarTitleText: '首页',
  };

  componentDidMount = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'home/queryCarListByDate',
      payload: '2020-01-30'
    });
  };

  handleItemClick = (id) => {
    this.setState({
      isModalOpen: true,
      carId: id
    })
  };

  handleTabClick = (current) => {
    this.setState({
      tabCurrent: current,
      isHaizhuCampus: true
    })
  };

  handleDepartureChange = () => {
    this.setState(({isHaizhuCampus}) => ({
      isHaizhuCampus: !isHaizhuCampus
    }))
  };

  handleTicketNumChange = (val) => {
    this.setState({
      ticketBookingNum: val
    })
  };

  handleModalClose = () => {
    this.setState({
      isModalOpen: false
    })
  };

  handleBooking = (carId, num, userId) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'home/queryBookingTicket',
      carId,
      num,
      userId
    })
  };

  renderDestCard = () => {
    const { isHaizhuCampus } = this.state;
    return (
      <View className='header-banner-outer'>
        <View className='at-row at-row__align--center inner'>
          <View className='at-col at-col-5 home-location departure'>
            <Text className='departure-label'>出发地</Text>
            <Text className='departure-name'>
              { isHaizhuCampus ? '海珠校区' : '白云校区' }
            </Text>
          </View>
          <View
            className='at-col at-col-2 home-location-exchange'
            onClick={this.handleDepartureChange}
          >
            <AtIcon value='repeat-play' color='#6190E8' size='32' />
          </View>
          <View className='at-col at-col-5 home-location destination'>
            <Text className='destination-label'>目的地</Text>
            <Text className='destination-name'>
              { isHaizhuCampus ? '白云校区' : '海珠校区' }
            </Text>
          </View>
        </View>
      </View>
    )
  };

  renderTicketList = () => {
    const { h_ticket, b_ticket } = this.props;
    const { isHaizhuCampus } = this.state;
    const ticketData = isHaizhuCampus ? h_ticket : b_ticket;
    const list = ticketData.map((item) => (
      <ListItem
        key={item.id}
        departTime={item.depart_time}
        restTicket={item.rest_ticket}
        departure={item.depart_place}
        carNum={item.car_num}
        disabled={item.rest_ticket === 0}
        onClick={() => this.handleItemClick(item.id)}
      />
    ));

    return (
      <ScrollView
        scrollY
        enableBackToTop
        className='ticket-scroll-list'
      >
        { list }
      </ScrollView>
    );
  };

  renderModal = () => {
    const { isModalOpen, ticketBookingNum, carId } = this.state;
    const { carList } = this.props;
    const authObj = Taro.getStorageSync(USER_INFO);
    const auth_stu = authObj.authority === 1;
    const auth_tea = authObj.authority === 2;
    const data = carList.find(item => item.id === carId) || {};
    return (
      <AtModal
        isOpened={isModalOpen}
        onClose={this.handleModalClose}
      >
        <AtModalHeader>车票信息确认</AtModalHeader>
        <AtModalContent>
          <View className='modal-container'>
            <View className='modal-content-item'>
              <Text className='item-title'>发车日期</Text>
              <Text className='item-value'>{data.depart_date}</Text>
            </View>
            <View className='modal-content-item'>
              <Text className='item-title'>发车时间</Text>
              <Text className='item-value'>{data.depart_time}</Text>
            </View>
            <View className='modal-content-item'>
              <Text className='item-title'>发车校区</Text>
              <Text className='item-value'>{data.campus === '01' ? '海珠校区' : '白云校区'}</Text>
            </View>
            <View className='modal-content-item'>
              <Text className='item-title'>上车地点</Text>
              <Text className='item-value'>{data.depart_place}</Text>
            </View>
            <View className='modal-content-item'>
              <Text className='item-title'>校车车牌号</Text>
              <Text className='item-value'>{data.car_num}</Text>
            </View>
            <View className='modal-content-item'>
              <Text className='item-title'>订票数</Text>
              {
                auth_stu ? 1 : (
                  <AtInputNumber
                    disabled={auth_stu}
                    max={auth_tea ? 3 : data.rest_ticket}
                    min={1}
                    value={ticketBookingNum}
                    onChange={this.handleTicketNumChange}
                  />
                )
              }
            </View>
          </View>
        </AtModalContent>
        <AtModalAction>
          <Button
            type='primary'
            className='modal-btn'
            onClick={() => this.handleBooking(carId, ticketBookingNum, authObj.id)}
          >
            订票
          </Button>
        </AtModalAction>
      </AtModal>
    )
  };

  render() {
    const { tabCurrent } = this.state;
    return (
      <View className="home">
        <AtTabs
          current={this.state.tabCurrent}
          scroll
          tabList={tabList}
          onClick={this.handleTabClick.bind(this)}
        >
          <AtTabsPane className='home-tabPane' current={tabCurrent} index={0}>
            <View className='home-tabPane-container'>
              { this.renderDestCard() }
              { this.renderTicketList() }
            </View>
          </AtTabsPane>
          <AtTabsPane className='home-tabPane' current={tabCurrent} index={1}>TabsPane2</AtTabsPane>
          <AtTabsPane className='home-tabPane' current={tabCurrent} index={2}>TabsPane3</AtTabsPane>
          <AtTabsPane className='home-tabPane' current={tabCurrent} index={3}>TabsPane4</AtTabsPane>
          <AtTabsPane className='home-tabPane' current={tabCurrent} index={4}>TabsPane5</AtTabsPane>
          <AtTabsPane className='home-tabPane' current={tabCurrent} index={5}>TabsPane6</AtTabsPane>
        </AtTabs>
        {
          /*
          * 渲染Modal模态框
          * */
          this.renderModal()
        }
      </View>
    );
  }
}

export default Index;
