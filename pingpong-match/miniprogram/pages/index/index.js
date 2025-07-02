Page({
  data: {
    recentMatches: [],
    loading: false,
    userInfo: null,
    announcements: [
      {
        _id: 'announcement_1',
        title: '本程序由软件学院2313405班学生制作',
        content: '欢迎使用乒乓约战小程序！',
        createTime: '2025-07-01 09:16:15'
      }
    ]
  },

  // 启用下拉刷新
  onPullDownRefresh() {
    this.loadHomeData()
  },

  onLoad() {
    // 获取缓存的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
    this.loadHomeData()
  },

  handleGetUserInfo() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: res => {
        const userInfo = res.userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
      },
      fail: err => {
        console.error('获取用户信息失败', err)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },

  async loadHomeData() {
    if (this.data.loading) return
    
    this.setData({ loading: true })

    try {
      const db = wx.cloud.database()
      
      // 先检查云开发是否初始化成功
      if (!wx.cloud) {
        throw new Error('请先初始化云开发')
      }

      // 获取最近约战记录
      const matches = await db.collection('matches')
        .where({
          _openid: '{openid}',  // 只获取当前用户的约战记录
          status: db.command.in(['accepted', 'pending'])
        })
        .orderBy('selectedTime', 'desc')
        .limit(5)
        .get()

      // 使用静态公告数据，但保留最近约战的动态数据
      this.setData({
        recentMatches: matches.data || []
      })

    } catch (err) {
      console.error('加载首页数据失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 点击约战记录
  handleMatchTap(e) {
    const matchId = e.currentTarget.dataset.id
    if (matchId) {
      wx.navigateTo({
        url: `/pages/match-detail/match-detail?id=${matchId}`
      })
    }
  },

  // 点击公告
  handleAnnouncementTap(e) {
    const announcement = e.currentTarget.dataset.item
    if (announcement) {
      wx.showModal({
        title: announcement.title,
        content: announcement.content || '欢迎使用乒乓约战小程序！',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 错误重试
  handleRetry() {
    this.loadHomeData()
  },

  onShareAppMessage() {
    return {
      title: '乒乓约战',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-cover.png'
    }
  },

  onShareTimeline() {
    return {
      title: '乒乓约战 - 智能匹配 轻松约战'
    }
  }
})