const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    const { userInfo, playStyles, schedule } = event
    
    const userProfile = await db.collection('users')
      .where({
        _openid: openid
      })
      .get()
    
    if (userProfile.data.length > 0) {
      // 更新已存在的用户资料
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          userInfo,
          playStyles,
          schedule,
          updateTime: db.serverDate()
        }
      })
    } else {
      // 创建新用户资料
      await db.collection('users').add({
        data: {
          _openid: openid,
          userInfo,
          playStyles,
          schedule,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      code: 0,
      msg: '更新成功'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}