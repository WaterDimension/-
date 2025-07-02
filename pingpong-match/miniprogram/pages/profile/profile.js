const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    skillLevel: '新手',
    playStyles: [
      { id: 1, name: '弧圈', selected: false },
      { id: 2, name: '快攻', selected: false }, 
      { id: 3, name: '削球', selected: false },
      { id: 4, name: '推挡', selected: false },
      { id: 5, name: '搓球', selected: false },
      { id: 6, name: '发球抢攻', selected: false }
    ],
    selectedStyles: [],
    availableTime: [],
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    timeSlots: [
      '08:00-10:00', '10:00-12:00', '14:00-16:00', 
      '16:00-18:00', '19:00-21:00'
    ],
    schedule: {},
    isEditing: false
  },

  onLoad() {
    console.log('页面加载')
    if (wx.getUserProfile) {
      console.log('支持 getUserProfile')
      this.setData({
        canIUseGetUserProfile: true
      })
    } else {
      console.log('不支持 getUserProfile')
    }

    // 尝试从缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    console.log('缓存的用户信息：', userInfo)
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
      app.globalData.userInfo = userInfo
    }
  },

  onShow() {
    console.log('页面显示')
    console.log('当前状态：', {
      hasUserInfo: this.data.hasUserInfo,
      canIUseGetUserProfile: this.data.canIUseGetUserProfile,
      userInfo: this.data.userInfo
    })
  },
  async getUserProfile() {
    console.log('getUserProfile 被调用')
    wx.showLoading({
      title: '登录中...'
    })

    try {
      console.log('开始获取用户信息')
      // 获取用户信息
      const profileRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      }).catch(err => {
        console.error('getUserProfile 失败：', err)
        throw err
      })

      console.log('获取用户信息成功：', profileRes)

      // 获取系统信息
      const baseInfo = wx.getAppBaseInfo()
      const deviceInfo = wx.getDeviceInfo()
      const windowInfo = wx.getWindowInfo()
      const systemInfo = {
        ...baseInfo,
        ...deviceInfo,
        ...windowInfo
      }

      console.log('开始调用云函数')
      // 调用云函数登录
      const loginRes = await wx.cloud.callFunction({
        name: 'login',
        data: {
          userInfo: profileRes.userInfo,
          loginTime: '2025-07-01 12:03:28',
          loginUser: 'WaterDimension',
          systemInfo: systemInfo
        }
      }).catch(err => {
        console.error('云函数调用失败：', err)
        throw err
      })

      console.log('云函数调用成功：', loginRes)

      if (!loginRes.result || loginRes.result.errMsg) {
        throw new Error(loginRes.result?.errMsg || '登录失败')
      }

      // 更新本地存储和全局数据
      wx.setStorageSync('userInfo', profileRes.userInfo)
      app.globalData.userInfo = profileRes.userInfo
      app.globalData.isLogin = true
      wx.setStorageSync('isLogin', true)

      // 更新页面数据
      this.setData({
        userInfo: profileRes.userInfo,
        hasUserInfo: true
      })

      // 创建或更新用户数据
      await this.createUserStats(loginRes.result.openid)

      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 加载用户数据
      await this.loadUserData()
    } catch (err) {
      console.error('登录失败：', err)
      wx.hideLoading()
      wx.showToast({
        title: '登录失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  async createUserStats(openid) {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      // 检查是否已存在记录
      const stats = await db.collection('user_stats').where({
        _openid: openid
      }).get()

      const systemInfo = this.data.systemInfo || {}
      const deviceInfo = wx.getDeviceInfo()

      if (stats.data.length === 0) {
        // 创建新记录
        await db.collection('user_stats').add({
          data: {
            level: '新手',
            playStyle: [],
            schedule: {},
            availableTime: [],
            createTime: db.serverDate(),
            lastLoginTime: db.serverDate(),
            updateTime: db.serverDate(),
            platform: systemInfo.platform,
            deviceInfo: {
              brand: deviceInfo.brand,
              model: deviceInfo.model,
              system: deviceInfo.system
            }
          }
        })
      } else {
        // 更新最后登录时间和设备信息
        await db.collection('user_stats').where({
          _openid: openid
        }).update({
          data: {
            lastLoginTime: db.serverDate(),
            platform: systemInfo.platform,
            deviceInfo: {
              brand: deviceInfo.brand,
              model: deviceInfo.model,
              system: deviceInfo.system
            }
          }
        })
      }
    } catch (err) {
      console.error('创建用户统计记录失败：', err)
      throw err
    }
  },

  async loadUserData() {
    try {
      const db = wx.cloud.database()
      const stats = await db.collection('user_stats').where({
        _openid: '{openid}'
      }).get()

      if (stats.data.length > 0) {
        const userData = stats.data[0]
        
        // 更新打法选择状态
        const playStyles = this.data.playStyles.map(style => ({
          ...style,
          selected: userData.playStyle?.includes(style.name) || false
        }))

        this.setData({
          skillLevel: userData.level || '新手',
          playStyles,
          selectedStyles: userData.playStyle || [],
          schedule: userData.schedule || {},
          availableTime: userData.availableTime || []
        })

        // 更新全局数据
        app.globalData.skillLevel = userData.level
        app.globalData.playStyle = userData.playStyle
        app.globalData.availableTime = userData.availableTime
        app.globalData.schedule = userData.schedule
      }
    } catch (err) {
      console.error('加载用户数据失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  toggleEdit() {
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false
      })
      return
    }
    
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  selectPlayStyle(e) {
    if (!this.data.isEditing) return

    const { index } = e.currentTarget.dataset
    const playStyles = [...this.data.playStyles]
    playStyles[index].selected = !playStyles[index].selected
    
    const selectedStyles = playStyles
      .filter(style => style.selected)
      .map(style => style.name)

    this.setData({ 
      playStyles,
      selectedStyles
    })
  },

  toggleTimeSlot(e) {
    if (!this.data.isEditing) return

    const { day, slot } = e.currentTarget.dataset
    const schedule = { ...this.data.schedule }
    
    if (!schedule[day]) {
      schedule[day] = []
    }

    const index = schedule[day].indexOf(slot)
    if (index === -1) {
      schedule[day].push(slot)
      schedule[day].sort() // 保持时间顺序
    } else {
      schedule[day].splice(index, 1)
    }

    this.setData({ schedule })
  },

  async saveProfile() {
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      const db = wx.cloud.database()
      await db.collection('user_stats').where({
        _openid: '{openid}'
      }).update({
        data: {
          playStyle: this.data.selectedStyles,
          schedule: this.data.schedule,
          updateTime: db.serverDate()
        }
      })

      // 更新全局数据
      app.globalData.playStyle = this.data.selectedStyles
      app.globalData.schedule = this.data.schedule

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      this.setData({ isEditing: false })
    } catch (err) {
      console.error('保存失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          app.globalData.isLogin = false
          app.globalData.userInfo = null
          app.globalData.skillLevel = null
          app.globalData.playStyle = null
          app.globalData.availableTime = null
          app.globalData.schedule = null
          
          wx.setStorageSync('isLogin', false)
          wx.removeStorageSync('userInfo')

          // 重置页面数据
          this.setData({
            userInfo: null,
            hasUserInfo: false,
            skillLevel: '新手',
            selectedStyles: [],
            schedule: {},
            isEditing: false,
            playStyles: this.data.playStyles.map(style => ({
              ...style,
              selected: false
            }))
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  onUnload() {
    // 页面卸载时保存数据
    if (this.data.isEditing) {
      this.saveProfile()
    }
  }
})