import React from "react";
import Taro, {Component} from '@tarojs/taro';
import {View, Text, Image, ScrollView, Button} from '@tarojs/components';
import dayjs from 'dayjs';
import {connect} from '@tarojs/redux';
import {
  AtTabs, AtTabsPane, AtInputNumber,
  AtModal, AtModalHeader,
  AtModalContent, AtModalAction
} from 'taro-ui';
import Blank from "../../components/Blank";
import './index.less';
import ListItem from '../../components/ListItem';
import homeEmpty from '../../images/icon/empty.png';
import exchangeIcon from '../../images/icon/exchange.png';
import {USER_INFO} from "../../utils/constants";
import {baseUrl, stuBaseDay, teaBaseDay, manBaseDay} from "../../config";

@connect(({home, global}) => ({
  ...home,
}))
class Index extends Component {

  state = {
    tabCurrent: 0,
    isHaizhuCampus: true,
    isModalOpen: false,
    carId: '',
    ticketBookingNum: 1,
  };

  config = {
    navigationBarTitleText: '首页',
    enablePullDownRefresh: true
  };

componentWillMount() {
  Taro.showLoading({
      title: '正在加载...',
      mask: true,
    });
    this.refreshData();
  }

  componentDidShow() {
    Taro.showLoading({
      title: '正在加载...',
      mask: true,
    });
    this.refreshData()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {isShowQr} = this.props;

    // 订票后更新数据
    if (isShowQr && prevProps.isShowQr !== isShowQr) {
      this.refreshData();
    }
  }

  onPullDownRefresh = () => {
    Taro.showLoading({
      title: '正在加载...',
      mask: true,
    });
    this.refreshData();
  };

  refreshData = () => {
    // 更新积分、更新tabList、查询当天票务列表
    this.queryTicketListData();
  };

  /**
   * 查询tabList中的票务情况
   */
  queryTicketListData = () => {
    const {dispatch} = this.props;
    const { tabCurrent } = this.state;
    // const date = dayjs(tabList[tabCurrent].value);
    // const valueDate = date.format('YYYY-MM-DD');
    dispatch({
      type: 'home/queryCarListByDate',
      tabCurrent,
    });
  };

  handleItemClick = (id) => {
    this.setState({
      isModalOpen: true,
      carId: id
    })
  };

  handleTabClick = (current) => {
    const { tabCurrent } = this.state;
    current !== tabCurrent && this.setState({
      tabCurrent: current,
      isHaizhuCampus: true
    }, () => {
      Taro.showLoading({
        title: '正在加载...',
        mask: true,
      });
      this.queryTicketListData();
    });
  };

  handleDepartureChange = () => {
    this.setState(({isHaizhuCampus}) => ({
      isHaizhuCampus: !isHaizhuCampus,
    }))
  };

  handleTicketNumChange = (val) => {
    this.setState({
      ticketBookingNum: val
    })
  };

  handleModalClose = () => {
    const {dispatch, isShowQr} = this.props;
    this.setState({
      isModalOpen: false
    });
    isShowQr && dispatch({
      type: 'home/isShowQrEnd',
      payload: false
    });
  };

  handleBooking = (carId, num, userId) => {
    const {dispatch} = this.props;
    Taro.showModal({
      title: '订票确认',
      content: '您确定订票吗？'
    })
      .then(({confirm}) => {
        confirm && dispatch({
          type: 'home/queryBookingTicket',
          carId,
          num,
          userId
        });
      });
  };

  renderDestCard = () => {
    const {isHaizhuCampus, exchangeIconAnimation} = this.state;
    return (
      <View className='header-banner-outer'>
        <View className='at-row at-row__align--center inner'>
          <View className='at-col at-col-5 home-location departure'>
            <Text className='departure-label'>出发地</Text>
            <Text className='departure-name'>
              {isHaizhuCampus ? '海珠校区' : '白云校区'}
            </Text>
          </View>
          <View
            className='at-col at-col-2 home-location-exchange'
            onClick={this.handleDepartureChange}
          >
            <Image className='home-location-icon' src={exchangeIcon} mode='aspectFit'/>
          </View>
          <View className='at-col at-col-5 home-location destination'>
            <Text className='destination-label'>目的地</Text>
            <Text className='destination-name'>
              {isHaizhuCampus ? '白云校区' : '海珠校区'}
            </Text>
          </View>
        </View>
      </View>
    )
  };

  renderTicketList = () => {
    const {h_ticket, b_ticket} = this.props;
    const {isHaizhuCampus} = this.state;
    const ticketData = isHaizhuCampus ? h_ticket : b_ticket;

    const list = ticketData.length
      ? ticketData.map((item) => (
        <ListItem
          key={item.id + Math.random()}
          departTime={item.depart_time}
          restTicket={item.rest_ticket}
          departure={item.depart_place}
          carNum={item.car_num}
          disabled={item.rest_ticket === 0}
          onClick={() => this.handleItemClick(item.id)}
        />)
      )
      : <Blank content='暂无可订票务' icon={homeEmpty}/>;

    return (
      <ScrollView
        scrollY
        enableBackToTop
        className='ticket-scroll-list'
      >
        {list}
      </ScrollView>
    );
  };

  renderBookingLayout = () => {
    const {ticketBookingNum, carId} = this.state;
    const {carList} = this.props;
    const authObj = Taro.getStorageSync(USER_INFO);
    const auth_stu = authObj.authority === 1;
    const auth_tea = authObj.authority === 2;
    const data = carList.find(item => item.id === carId) || {};
    return (
      <View>
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
              <Text className='item-title'>
                {
                  auth_tea || auth_stu ? '订票数' : '预留票数'
                }
              </Text>
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
            {auth_stu || auth_tea ? '确认订票' : '确认预留'}
          </Button>
        </AtModalAction>
      </View>
    );
  };

  renderQrLayout = () => {
    const {tmp_orderId} = this.props;
    return (
      <View>
        <AtModalHeader>订票成功</AtModalHeader>
        <AtModalContent>
          <View className='modal-qr-container'>
            <Text>订票二维码凭证如下：</Text>
            <Text className='modal-qr-tips'>（详情在'我的订单'中查看）</Text>
          </View>
          <View className='modal-image-container'>
            <Image
              mode='aspectFit'
              src={tmp_orderId ? `${baseUrl}/qr/${encodeURIComponent(tmp_orderId)}` : ''}
            />
          </View>
        </AtModalContent>
      </View>
    );
  };

  renderModal = () => {
    const {isModalOpen} = this.state;
    const {isShowQr} = this.props;
    return (
      <AtModal
        isOpened={isModalOpen}
        onClose={this.handleModalClose}
      >
        {
          isShowQr ? this.renderQrLayout() : this.renderBookingLayout()
        }
      </AtModal>
    )
  };

  renderTabPane = () => {
    const {tabCurrent} = this.state;
    const { tabList } = this.props;
    const arr = tabList.slice();
    return arr.length
      ? arr.map((item, index) => (
        <AtTabsPane key={index + Math.random()} className='home-tabPane' current={tabCurrent} index={index}>
          <View className='home-tabPane-container'>
            {this.renderDestCard()}
            {this.renderTicketList()}
          </View>
        </AtTabsPane>))
      : '';
  };

  render() {
    const {tabCurrent} = this.state;
    const { tabList } = this.props
    return (
      <View className="home">
        <AtTabs
          current={tabCurrent}
          scroll={tabList.length > 4}
          tabList={tabList}
          className='home-tabs'
          onClick={this.handleTabClick}
        >
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={0}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={1}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={2}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={3}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={4}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={5}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          <AtTabsPane key={`${Math.random()} ${Date.now()}`} className='home-tabPane' current={tabCurrent} index={6}>
            <View className='home-tabPane-container'>
              {this.renderDestCard()}
              {this.renderTicketList()}
            </View>
          </AtTabsPane>
          {/*{*/}
          {/*  this.renderTabPane()*/}
          {/*}*/}
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
