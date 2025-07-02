const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  try {
    const userResult = await db.collection('user_stats')
      .where({
        _openid: event.targetId
      })
      .get()

    return {
      code: 0,
      data: userResult.data[0] || null
    }
  } catch (err) {
    return {
      code: -1,
      error: err
    }
  }
}