// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const $ = db.command.aggregate
  
  try {
    // 获取所有需要更新的记录
    const userStats = await db.collection('user_stats')
      .where({
        // 查找没有新字段的记录
        systemInfo: _.exists(false)
      })
      .get()

    // 批量更新记录
    const updatePromises = userStats.data.map(stat => {
      return db.collection('user_stats').doc(stat._id).update({
        data: {
          // 添加新字段，设置默认值
          lastLoginTime: db.serverDate(),
          updateTime: db.serverDate(),
          lastLoginUser: 'WaterDimension',
          lastLoginTimestamp: '2025-07-01 11:49:39',
          systemInfo: {
            deviceInfo: {},
            windowInfo: {},
            appBaseInfo: {}
          },
          loginTimes: 1,
          // 确保基础字段存在
          level: stat.level || '新手',
          playStyle: stat.playStyle || [],
          schedule: stat.schedule || {},
          availableTime: stat.availableTime || [],
          createTime: stat.createTime || db.serverDate()
        }
      })
    })

    await Promise.all(updatePromises)

    return {
      success: true,
      updated: userStats.data.length
    }
  } catch (err) {
    console.error('更新数据库结构失败：', err)
    return {
      success: false,
      error: err
    }
  }
}