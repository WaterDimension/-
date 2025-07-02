// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  try {
    const { userInfo, loginTime, loginUser, systemInfo } = event
    
    // 检查用户是否已存在
    const users = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    // 获取当前时间戳
    const now = db.serverDate()

    if (!users.data.length) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          _openid: wxContext.OPENID,
          userInfo,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
          createTime: now,
          lastLoginTime: now,
          loginTimes: 1,
          lastLoginUser: loginUser,
          lastLoginTimestamp: loginTime,
          systemInfo: systemInfo
        }
      })
    } else {
      // 更新现有用户
      await db.collection('users').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          userInfo,
          lastLoginTime: now,
          loginTimes: db.command.inc(1),
          lastLoginUser: loginUser,
          lastLoginTimestamp: loginTime,
          systemInfo: systemInfo,
          updateTime: now
        }
      })
    }

    return {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      env: wxContext.ENV,
      loginTime: loginTime,
      loginUser: loginUser
    }
  } catch (err) {
    console.error('[云函数] [login] 调用失败', err)
    return {
      errMsg: err.message,
      error: err
    }
  }
}