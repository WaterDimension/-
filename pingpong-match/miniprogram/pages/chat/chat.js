Page({
  data: {
    conversations: [],
    loading: false
  },

  onLoad() {
    this.loadConversations()
  },

  onShow() {
    // 每次显示页面时刷新会话列表
    this.loadConversations()
  },

  onPullDownRefresh() {
    this.loadConversations()
  },

  async loadConversations() {
    if (this.data.loading) return
    
    this.setData({ loading: true })

    try {
      const db = wx.cloud.database()
      const conversations = await db.collection('conversations')
        .where({
          participants: wx.getStorageSync('openid')
        })
        .orderBy('lastMessageTime', 'desc')
        .get()

      // 获取参与者信息
      const userInfos = {}
      for (const conv of conversations.data) {
        const otherUser = conv.participants.find(p => p !== wx.getStorageSync('openid'))
        const userRes = await db.collection('users')
          .where({
            _openid: otherUser
          })
          .get()
        
        if (userRes.data.length > 0) {
          userInfos[otherUser] = userRes.data[0]
        }
      }

      this.setData({
        conversations: conversations.data.map(conv => ({
          ...conv,
          otherUser: userInfos[conv.participants.find(p => p !== wx.getStorageSync('openid'))]
        }))
      })
    } catch (err) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  navigateToChat(e) {
    const { conversation } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/chat-room/chat-room?targetUser=${conversation.otherUser._openid}&nickname=${conversation.otherUser.userInfo.nickName}`
    })
  }
})