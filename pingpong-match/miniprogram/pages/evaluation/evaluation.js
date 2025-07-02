const app = getApp()

Page({
  data: {
    currentScore: 0,
    skillLevel: '新手级',
    frequency: null,
    selectedSkills: [],
    experience: null,
    submitting: false,

    // 击球频率选项
    frequencyOptions: [
      { value: 1, label: '每周1次以下' },
      { value: 2, label: '每周1-2次' },
      { value: 3, label: '每周3-4次' },
      { value: 4, label: '每周5次以上' }
    ],

    // 技术掌握选项
    skillOptions: [
      { value: 'forehand', label: '正手攻球', weight: 15 },
      { value: 'backhand', label: '反手攻球', weight: 15 },
      { value: 'serve', label: '发球技术', weight: 10 },
      { value: 'loop', label: '弧圈球', weight: 20 },
      { value: 'smash', label: '扣杀', weight: 15 },
      { value: 'chop', label: '削球', weight: 15 },
      { value: 'flick', label: '搓球', weight: 10 }
    ],

    // 比赛经验选项
    experienceOptions: [
      { value: 1, label: '未参加过正式比赛', weight: 0 },
      { value: 2, label: '校级/区级比赛', weight: 10 },
      { value: 3, label: '市级比赛', weight: 20 },
      { value: 4, label: '省级及以上比赛', weight: 30 }
    ]
  },

  onLoad() {
    this.loadUserEvaluation()
  },

  // 加载用户已有的评测数据
  async loadUserEvaluation() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('user_stats').where({
        _openid: '{openid}'
      }).get()

      if (res.data.length > 0) {
        const data = res.data[0]
        this.setData({
          currentScore: data.score || 0,
          skillLevel: data.level || '新手级',
          frequency: data.frequency,
          selectedSkills: data.skills || [],
          experience: data.experience
        })
      }
    } catch (err) {
      console.error('加载评测记录失败：', err)
    }
  },

  // 处理频率选择
  handleFrequencySelect(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ frequency: value })
  },

  // 处理技术选择（多选）
  handleSkillSelect(e) {
    const value = e.currentTarget.dataset.value
    const selectedSkills = [...this.data.selectedSkills]
    const index = selectedSkills.indexOf(value)
    
    if (index > -1) {
      selectedSkills.splice(index, 1)
    } else {
      selectedSkills.push(value)
    }
    
    this.setData({ selectedSkills })
  },

  // 处理比赛经验选择
  handleExperienceSelect(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ experience: value })
  },

  // 计算评分
  calculateScore() {
    const { frequency, selectedSkills, experience, skillOptions, experienceOptions } = this.data
    let score = 0

    // 频率得分 (最高20分)
    score += (frequency || 0) * 5

    // 技术得分 (最高60分)
    const skillWeights = skillOptions.reduce((acc, skill) => {
      acc[skill.value] = skill.weight
      return acc
    }, {})
    
    selectedSkills.forEach(skill => {
      score += skillWeights[skill] || 0
    })

    // 比赛经验得分 (最高20分)
    const experienceWeight = experienceOptions.find(e => e.value === experience)?.weight || 0
    score += experienceWeight

    return Math.min(100, score)
  },

  // 获取技术等级
  getSkillLevel(score) {
    if (score >= 80) return '专业级'
    if (score >= 60) return '进阶级'
    if (score >= 40) return '入门级'
    return '新手级'
  },

  // 提交评测
  async handleSubmit() {
    if (!this.data.frequency || !this.data.experience || this.data.selectedSkills.length === 0) {
      wx.showToast({
        title: '请完成所有评测题目',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const score = this.calculateScore()
      const skillLevel = this.getSkillLevel(score)
      
      const db = wx.cloud.database()
      
      // 更新或创建用户评测记录
      await db.collection('user_stats').where({
        _openid: '{openid}'
      }).update({
        data: {
          score,
          level: skillLevel,
          frequency: this.data.frequency,
          skills: this.data.selectedSkills,
          experience: this.data.experience,
          updateTime: db.serverDate()
        }
      })

      // 更新全局数据
      app.globalData.skillLevel = skillLevel

      this.setData({
        currentScore: score,
        skillLevel
      })

      wx.showToast({
        title: '评测完成',
        icon: 'success'
      })

      // 延迟返回，让用户看到结果
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (err) {
      console.error('提交评测失败：', err)
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})