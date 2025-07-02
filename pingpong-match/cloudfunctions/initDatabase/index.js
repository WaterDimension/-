// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 检查 user_stats 集合是否存在
    try {
      await db.createCollection('user_stats')
      console.log('创建 user_stats 集合成功')
    } catch (err) {
      if (err.errCode !== -501001) { // 集合已存在的错误码
        throw err
      }
    }

    // 创建索引
    await db.collection('user_stats').createIndex({
      data: {
        _openid: 1 // 为 _openid 字段创建索引
      }
    })

    // 定义默认记录结构
    const defaultSchema = {
      level: '新手',
      playStyle: [],
      schedule: {},
      availableTime: [],
      createTime: db.serverDate(),
      lastLoginTime: db.serverDate(),
      updateTime: db.serverDate(),
      lastLoginUser: 'WaterDimension',
      lastLoginTimestamp: '2025-07-01 11:49:39',
      systemInfo: {
        deviceInfo: {},
        windowInfo: {},
        appBaseInfo: {}
      },
      loginTimes: 1
    }

    // 将默认结构插入数据库作为模板
    await db.collection('user_stats').add({
      data: {
        ...defaultSchema,
        _openid: 'template',
        isTemplate: true
      }
    })

    return {
      success: true,
      message: '数据库初始化成功'
    }

  } catch (err) {
    console.error('初始化数据库失败：', err)
    return {
      success: false,
      error: err
    }
  }
}