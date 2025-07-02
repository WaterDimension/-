const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { targetUser, page = 1, pageSize = 20 } = event
  
  try {
    // 构建会话key
    const conversationKey = [wxContext.OPENID, targetUser].sort().join('_')
    
    // 获取消息记录
    const messages = await db.collection('messages')
      .where(_.or([
        {
          from: wxContext.OPENID,
          to: targetUser
        },
        {
          from: targetUser,
          to: wxContext.OPENID
        }
      ]))
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 更新未读消息状态
    await db.collection('messages')
      .where({
        to: wxContext.OPENID,
        from: targetUser,
        read: false
      })
      .update({
        data: {
          read: true
        }
      })

    // 重置会话未读计数
    await db.collection('conversations')
      .where({
        conversationKey,
        participants: wxContext.OPENID
      })
      .update({
        data: {
          unreadCount: 0
        }
      })

    return {
      code: 0,
      data: {
        messages: messages.data.reverse(),
        page,
        pageSize
      },
      msg: '获取成功'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}