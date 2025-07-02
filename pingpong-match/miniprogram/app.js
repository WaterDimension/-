App({
  onLaunch: async function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-3ghvj2jo58c5fde3',
        traceUser: true,
      })
    }

    this.globalData = {
      userInfo: null,
      skillLevel: null,
      playStyle: null,
      availableTime: [],
      isLogin: false,
      deviceInfo: null,
      windowInfo: null,
      systemInfo: null
    }

    try {
      // 获取设备信息
      wx.getDeviceInfo({
        success: (res) => {
          this.globalData.deviceInfo = res
        },
        fail: (err) => {
          console.error('获取设备信息失败:', err)
        }
      })

      // 获取窗口信息
      wx.getWindowInfo({
        success: (res) => {
          this.globalData.windowInfo = res
        },
        fail: (err) => {
          console.error('获取窗口信息失败:', err)
        }
      })

      // 获取应用基础信息
      wx.getAppBaseInfo({
        success: (res) => {
          this.globalData.systemInfo = res
        },
        fail: (err) => {
          console.error('获取应用信息失败:', err)
        }
      })

      // 获取用户登录状态
      try {
        const loginStatus = await wx.getStorage({
          key: 'isLogin'
        })
        this.globalData.isLogin = loginStatus.data
      } catch (err) {
        // 如果没有登录状态，设置为 false
        this.globalData.isLogin = false
        wx.setStorageSync('isLogin', false)
      }

      // 获取缓存的用户信息
      try {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
          this.globalData.userInfo = userInfo
        }
      } catch (err) {
        console.log('未找到用户信息缓存')
      }

      // 获取用户技术评级
      if (this.globalData.isLogin) {
        const db = wx.cloud.database()
        try {
          const userStats = await db.collection('user_stats')
            .where({
              _openid: '{openid}'
            })
            .get()
          
          if (userStats.data.length > 0) {
            const userData = userStats.data[0]
            this.globalData.skillLevel = userData.level
            this.globalData.playStyle = userData.playStyle
            this.globalData.availableTime = userData.availableTime || []

            // 更新用户设备信息
            await db.collection('user_stats')
              .where({
                _openid: '{openid}'
              })
              .update({
                data: {
                  lastActiveTime: db.serverDate(),
                  deviceInfo: this.globalData.deviceInfo,
                  systemInfo: this.globalData.systemInfo
                }
              })
          }
        } catch (err) {
          console.log('获取用户统计数据失败：', err)
        }
      }

    } catch (err) {
      console.log('初始化数据失败，但不影响使用：', err)
    }
  },

  // 更新用户信息
  updateUserInfo: function(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  // 更新技术等级
  updateSkillLevel: function(level) {
    this.globalData.skillLevel = level
    const db = wx.cloud.database()
    return db.collection('user_stats').where({
      _openid: '{openid}'
    }).update({
      data: {
        level: level,
        updateTime: db.serverDate()
      }
    })
  },

  // 更新打法风格
  updatePlayStyle: function(style) {
    this.globalData.playStyle = style
    const db = wx.cloud.database()
    return db.collection('user_stats').where({
      _openid: '{openid}'
    }).update({
      data: {
        playStyle: style,
        updateTime: db.serverDate()
      }
    })
  },

  // 更新可用时间
  updateAvailableTime: function(times) {
    this.globalData.availableTime = times
    const db = wx.cloud.database()
    return db.collection('user_stats').where({
      _openid: '{openid}'
    }).update({
      data: {
        availableTime: times,
        updateTime: db.serverDate()
      }
    })
  },

  // 检查登录状态
  checkLogin: async function() {
    if (this.globalData.isLogin) {
      return true
    }
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录'
      })
      if (res.confirm) {
        wx.switchTab({
          url: '/pages/profile/profile'
        })
      }
      return false
    } catch (err) {
      console.error('检查登录状态失败：', err)
      return false
    }
  },

  // 获取最新系统信息
  getLatestSystemInfo: async function() {
    try {
      const deviceInfo = await new Promise((resolve, reject) => {
        wx.getDeviceInfo({
          success: resolve,
          fail: reject
        })
      })

      const windowInfo = await new Promise((resolve, reject) => {
        wx.getWindowInfo({
          success: resolve,
          fail: reject
        })
      })

      const appBaseInfo = await new Promise((resolve, reject) => {
        wx.getAppBaseInfo({
          success: resolve,
          fail: reject
        })
      })

      this.globalData.deviceInfo = deviceInfo
      this.globalData.windowInfo = windowInfo
      this.globalData.systemInfo = appBaseInfo

      return {
        deviceInfo,
        windowInfo,
        systemInfo: appBaseInfo
      }
    } catch (err) {
      console.error('获取系统信息失败：', err)
      return null
    }
  }
})