const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    const userProfile = await db.collection('users')
      .where({
        _openid: openid
      })
      .get()
    
    if (userProfile.data.length > 0) {
      return {
        code: 0,
        data: userProfile.data[0]
      }
    } else {
      return {
        code: 1,
        data: null,
        msg: '用户未找到'
      }
    }
  } catch (err) {
    return {
      code: -1,
      data: null,
      msg: err
    }
  }
}