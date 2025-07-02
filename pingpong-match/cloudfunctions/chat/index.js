const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { targetUser, content, type = 'text' } = event
  
  try {
    // 创建聊天记录
    const messageData = {
      from: wxContext.OPENID,
      to: targetUser,
      content,
      type,
      read: false,
      createTime: db.serverDate()
    }

    const result = await db.collection('messages').add({
      data: messageData
    })

    // 更新或创建会话
    const conversationKey = [wxContext.OPENID, targetUser].sort().join('_')
    const conversation = await db.collection('conversations')
      .where({
        conversationKey
      })
      .get()

    if (conversation.data.length > 0) {
      // 更新现有会话
      await db.collection('conversations').where({
        conversationKey
      }).update({
        data: {
          lastMessage: content,
          lastMessageTime: db.serverDate(),
          unreadCount: db.command.inc(1)
        }
      })
    } else {
      // 创建新会话
      await db.collection('conversations').add({
        data: {
          conversationKey,
          participants: [wxContext.OPENID, targetUser],
          lastMessage: content,
          lastMessageTime: db.serverDate(),
          unreadCount: 1,
          createTime: db.serverDate()
        }
      })
    }

    // 发送消息通知
    await cloud.callFunction({
      name: 'messageNotify',
      data: {
        type: 'newMessage',
        targetUser,
        messageId: result._id
      }
    })

    return {
      code: 0,
      data: {
        messageId: result._id
      },
      msg: '发送成功'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}