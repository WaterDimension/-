Page({
  data: {
    targetUser: '',
    nickname: '',
    messages: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    inputValue: '',
    scrollTop: 0,
    scrollViewHeight: 0,
    otherUserAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    myAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    myInfo: null,
    targetInfo: null,
    refreshInterval: null
  },

  async onLoad(options) {
    if (!options.targetId || !options.targetName) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    const app = getApp()
    
    // 检查登录状态
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      })
      return
    }

    // 安全地获取用户信息
    let myInfo = {
      nickName: '未知用户',
      skillLevel: '未设置',
      playStyle: '未设置'
    }

    try {
      // 从缓存获取用户信息
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        myInfo.nickName = userInfo.nickName || '未知用户'
      }
      
      // 从数据库获取用户状态
      const db = wx.cloud.database()
      const userStats = await db.collection('user_stats')
        .where({
          _openid: '{openid}'
        })
        .get()
      
      if (userStats.data.length > 0) {
        myInfo.skillLevel = userStats.data[0].level || '未设置'
        myInfo.playStyle = userStats.data[0].playStyle || '未设置'
      }
    } catch (err) {
      console.error('获取用户信息失败：', err)
    }

    this.setData({
      targetUser: options.targetId,
      nickname: options.targetName,
      myInfo: myInfo
    })
    
    wx.setNavigationBarTitle({
      title: this.data.nickname
    })

    try {
      const windowInfo = wx.getWindowInfo()
      const scrollViewHeight = windowInfo.windowHeight - 100
      this.setData({ scrollViewHeight })
    } catch (error) {
      const systemInfo = wx.getSystemInfoSync()
      const scrollViewHeight = systemInfo.windowHeight - 100
      this.setData({ scrollViewHeight })
    }

    // 获取目标用户信息
    await this.getTargetUserInfo()
    
    // 加载历史消息
    await this.loadMessages()
    
    // 如果没有消息，发送初始化消息
    if (this.data.messages.length === 0) {
      await this.sendInitialMessages()
    }

    // 设置定时刷新
    this.startAutoRefresh()
  },

  onUnload() {
    if (this.data.refreshInterval) {
      clearInterval(this.data.refreshInterval)
    }
  },

  startAutoRefresh() {
    this.data.refreshInterval = setInterval(() => {
      this.loadMessages()
    }, 3000)
  },

  async getTargetUserInfo() {
    try {
      const db = wx.cloud.database()
      const userResult = await db.collection('user_stats')
        .where({
          _openid: this.data.targetUser
        })
        .get()

      if (userResult.data.length > 0) {
        this.setData({
          targetInfo: {
            nickName: this.data.nickname,
            skillLevel: userResult.data[0].level || '未设置',
            playStyle: userResult.data[0].playStyle || '未设置'
          }
        })
      } else {
        this.setData({
          targetInfo: {
            nickName: this.data.nickname,
            skillLevel: '未设置',
            playStyle: '未设置'
          }
        })
      }
    } catch (err) {
      console.error('获取目标用户信息失败：', err)
      this.setData({
        targetInfo: {
          nickName: this.data.nickname,
          skillLevel: '未设置',
          playStyle: '未设置'
        }
      })
    }
  },

  async loadMessages(append = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })

    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      const messages = await db.collection('messages')
        .where(_.or([
          {
            from: 'WaterDimension',
            to: this.data.targetUser
          },
          {
            from: this.data.targetUser,
            to: 'WaterDimension'
          }
        ]))
        .orderBy('createTime', 'desc')
        .skip((this.data.page - 1) * this.data.pageSize)
        .limit(this.data.pageSize)
        .get()

      const formattedMessages = messages.data.map(msg => ({
        ...msg,
        createTime: this.formatTime(msg.createTime)
      }))

      this.setData({
        messages: append ? [...formattedMessages.reverse(), ...this.data.messages] : formattedMessages.reverse(),
        hasMore: messages.data.length === this.data.pageSize,
        loading: false
      })

      if (!append && messages.data.length > 0) {
        this.scrollToBottom()
      }
    } catch (err) {
      console.error('加载消息失败：', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  async sendInitialMessages() {
    const db = wx.cloud.database()
    
    try {
      // 发送我的信息
      const myMessage = {
        from: 'WaterDimension',
        to: this.data.targetUser,
        content: `你好，我是${this.data.myInfo.nickName}
技术等级：${this.data.myInfo.skillLevel}
打法：${this.data.myInfo.playStyle}`,
        type: 'text',
        createTime: db.serverDate()
      }

      await db.collection('messages').add({
        data: myMessage
      })

      // 更新本地消息列表
      this.setData({
        messages: [
          {
            ...myMessage,
            createTime: this.formatTime(new Date())
          }
        ]
      })

      // 滚动到底部
      this.scrollToBottom()
    } catch (err) {
      console.error('发送初始化消息失败：', err)
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
    }
  },

  async handleSend() {
    const content = this.data.inputValue.trim()
    if (!content) return

    // 添加震动反馈
    wx.vibrateShort({
      type: 'light'
    })

    // 先清空输入框
    this.setData({ inputValue: '' })

    try {
      const db = wx.cloud.database()
      const now = db.serverDate()
      
      const messageData = {
        from: 'WaterDimension',
        to: this.data.targetUser,
        content: content,
        type: 'text',
        createTime: now
      }

      // 保存到云数据库
      const result = await db.collection('messages').add({
        data: messageData
      })

      if (result._id) {
        // 发送成功后立即刷新消息
        await this.loadMessages()
      }
    } catch (err) {
      console.error('发送消息失败：', err)
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
      
      // 发送失败时恢复消息
      this.setData({
        inputValue: content
      })
    }
  },

  formatTime(date) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const now = new Date()
    const diff = now - d
    
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    
    if (d.toDateString() === now.toDateString()) {
      return `${hours}:${minutes}`
    } else if (diff < 86400000 * 2 && d.toDateString() === new Date(now - 86400000).toDateString()) {
      return `昨天 ${hours}:${minutes}`
    } else {
      return `${month}-${day} ${hours}:${minutes}`
    }
  },

  scrollToBottom() {
    setTimeout(() => {
      const query = wx.createSelectorQuery()
      query.select('#message-list').boundingClientRect()
      query.exec(res => {
        if (res[0]) {
          this.setData({
            scrollTop: res[0].height
          })
        }
      })
    }, 200)
  },

  handleInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  onScrollToUpper() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      }, () => {
        this.loadMessages(true)
      })
    }
  },

  handleBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/match/match'
        })
      }
    })
  },

  // 用于调试的方法
  async checkMessageStatus() {
    try {
      const db = wx.cloud.database()
      const count = await db.collection('messages').count()
      
      wx.showModal({
        title: '调试信息',
        content: `消息总数：${count.total}\n当前用户：WaterDimension\n目标用户：${this.data.targetUser}`,
        showCancel: false
      })
    } catch (err) {
      console.error('检查消息状态失败：', err)
    }
  }
})