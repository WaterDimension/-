const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

// 计算两个用户的匹配度
function calculateMatchScore(user1, user2) {
  let score = 0
  const maxScore = 100

  // 技术等级匹配度 (40分)
  const levelDiff = Math.abs(user1.skillLevel - user2.skillLevel)
  const levelScore = Math.max(40 - levelDiff * 10, 0)
  score += levelScore

  // 打法风格匹配度 (30分)
  const styleScore = user1.playStyles.some(style => 
    user2.playStyles.includes(style)
  ) ? 30 : 0
  score += styleScore

  // 时间匹配度 (30分)
  const timeScore = calculateTimeMatchScore(user1.schedule, user2.schedule)
  score += timeScore

  return Math.round(score)
}

// 计算时间匹配度
function calculateTimeMatchScore(schedule1, schedule2) {
  let matchingSlots = 0
  let totalSlots = 0

  Object.keys(schedule1).forEach(day => {
    if (schedule2[day]) {
      const overlappingSlots = schedule1[day].filter(slot => 
        schedule2[day].includes(slot)
      ).length
      matchingSlots += overlappingSlots
      totalSlots += schedule1[day].length
    }
  })

  return totalSlots > 0 ? Math.round((matchingSlots / totalSlots) * 30) : 0
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { filters = {} } = event
  
  try {
    // 获取当前用户信息
    const userRes = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()

    if (!userRes.data.length) {
      return {
        code: 1,
        msg: '用户信息不存在'
      }
    }

    const currentUser = userRes.data[0]

    // 构建查询条件
    const query = {
      _openid: _.neq(wxContext.OPENID)
    }

    // 应用过滤条件
    if (filters.skillLevel) {
      const minLevel = Math.max(1, currentUser.skillLevel - filters.skillLevel)
      const maxLevel = Math.min(9, currentUser.skillLevel + filters.skillLevel)
      query.skillLevel = _.gte(minLevel).and(_.lte(maxLevel))
    }

    if (filters.playStyles && filters.playStyles.length) {
      query.playStyles = _.in(filters.playStyles)
    }

    // 获取潜在匹配用户
    const matchUsers = await db.collection('users')
      .where(query)
      .get()

    // 计算匹配分数并排序
    const matches = matchUsers.data.map(user => ({
      ...user,
      matchScore: calculateMatchScore(currentUser, user)
    }))
    .filter(user => user.matchScore >= (filters.minScore || 60))
    .sort((a, b) => b.matchScore - a.matchScore)

    return {
      code: 0,
      data: matches,
      msg: '匹配成功'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}