const app = getApp()

Page({
  data: {
    levelRange: [0, 100],
    preferredTime: '',
    distanceOptions: ['3公里内', '5公里内', '10公里内', '不限距离'],
    selectedDistance: 0,
    matchedPlayers: [],
    loading: false,
    userSkills: [], // 当前用户的技术
    userLevel: 0,   // 当前用户的等级分数
    // 添加测试数据
    testPlayers: [
      {
        _openid: 'test_user_1',
        nickName: '乒乓高手',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        score: 75,
        skillLevel: '进阶级',
        skills: ['forehand', 'backhand', 'loop'],
        playStyle: '攻击型',
        availableTime: ['19:00', '20:00'],
        location: {
          latitude: 30.5,
          longitude: 114.3
        }
      },
      {
        _openid: 'test_user_2',
        nickName: '削球达人',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        score: 65,
        skillLevel: '进阶级',
        skills: ['chop', 'serve', 'flick'],
        playStyle: '防守型',
        availableTime: ['18:00', '19:00'],
        location: {
          latitude: 30.52,
          longitude: 114.31
        }
      },
      {
        _openid: 'test_user_3',
        nickName: '业余选手',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        score: 45,
        skillLevel: '入门级',
        skills: ['forehand', 'serve'],
        playStyle: '全面型',
        availableTime: ['20:00', '21:00'],
        location: {
          latitude: 30.51,
          longitude: 114.32
        }
      }
    ]
  },

  onLoad() {
    this.loadUserProfile()
  },

  // 加载用户资料
  async loadUserProfile() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('user_stats')
        .where({
          _openid: '{openid}'
        })
        .get()

      if (res.data.length > 0) {
        const userStats = res.data[0]
        this.setData({
          userSkills: userStats.skills || [],
          userLevel: userStats.score || 0
        })
      }
      // 无论是否有用户数据，都显示测试数据
      this.findMatches()
    } catch (err) {
      console.error('加载用户资料失败：', err)
      // 发生错误时也显示测试数据
      this.findMatches()
    }
  },

  // 计算匹配分数
  calculateMatchScore(player) {
    let score = 0
    const weights = {
      level: 0.4,      // 技术水平权重
      skills: 0.3,     // 技术相似度权重
      time: 0.2,       // 时间匹配权重
      distance: 0.1    // 距离权重
    }

    // 1. 技术水平匹配度
    const levelDiff = player.score - this.data.userLevel
    const levelScore = levelDiff >= 0 && levelDiff <= 20 
      ? 100 - (levelDiff * 2)
      : levelDiff > 20 
        ? 60 - ((levelDiff - 20) * 3)
        : 80 - (Math.abs(levelDiff) * 2)

    // 2. 技术相似度
    const commonSkills = this.data.userSkills.filter(skill => 
      player.skills && player.skills.includes(skill)
    )
    const skillScore = (commonSkills.length / Math.max(this.data.userSkills.length, 1)) * 100

    // 3. 时间匹配度
    const timeScore = this.calculateTimeScore(player.availableTime)

    // 4. 距离匹配度
    const distanceScore = this.calculateDistanceScore(player.location)

    // 计算总分
    score = (levelScore * weights.level) +
            (skillScore * weights.skills) +
            (timeScore * weights.time) +
            (distanceScore * weights.distance)

    return Math.round(score)
  },

  // 计算时间匹配分数
  calculateTimeScore(playerTime) {
    if (!this.data.preferredTime || !playerTime) return 100
    
    // 将时间转换为分钟数进行比较
    const preferredMinutes = this.timeToMinutes(this.data.preferredTime)
    const playerMinutes = playerTime.map(time => this.timeToMinutes(time))
    
    // 找到最接近的时间
    const minDiff = Math.min(...playerMinutes.map(m => 
      Math.abs(m - preferredMinutes)
    ))
    
    // 计算分数（差异越小分数越高）
    return Math.max(0, 100 - (minDiff / 30) * 100)
  },

  // 计算距离匹配分数
  calculateDistanceScore(playerLocation) {
    if (!playerLocation || this.data.selectedDistance === 3) return 100
    
    const distances = [3, 5, 10, Infinity]
    const maxDistance = distances[this.data.selectedDistance]
    
    // 这里使用固定距离进行演示
    const distance = 2 + (this.data.selectedDistance * 2)
    
    return Math.max(0, 100 - (distance / maxDistance) * 100)
  },

  // 时间字符串转换为分钟数
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  },

  // 查找匹配的对手
  async findMatches() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      // 使用测试数据
      const matchedPlayers = this.data.testPlayers
        .filter(player => {
          const score = player.score
          return score >= this.data.levelRange[0] && score <= this.data.levelRange[1]
        })
        .map(player => ({
          ...player,
          matchScore: this.calculateMatchScore(player)
        }))
        .filter(player => player.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)

      this.setData({ matchedPlayers })
      
    } catch (err) {
      console.error('查找对手失败：', err)
      wx.showToast({
        title: '查找对手失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 处理级别范围变化
  handleLevelRangeChange(e) {
    const value = e.detail.value
    this.setData({
      levelRange: [Math.max(0, value - 20), value]
    }, () => {
      this.findMatches()
    })
  },

  // 处理时间选择
  handleTimeChange(e) {
    this.setData({
      preferredTime: e.detail.value
    }, () => {
      this.findMatches()
    })
  },

  // 处理距离选择
  handleDistanceChange(e) {
    this.setData({
      selectedDistance: Number(e.detail.value)
    }, () => {
      this.findMatches()
    })
  },

  // 发起约战
  handleInvite(e) {
    const playerId = e.currentTarget.dataset.id
    const player = this.data.matchedPlayers.find(p => p._openid === playerId)
    
    if (!player) return
    
    wx.showModal({
      title: '发起约战',
      content: `确定要向 ${player.nickName} 发起约战吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/chat-room/chat-room?targetId=${playerId}&targetName=${player.nickName}`
          })
        }
      }
    })
  }
})