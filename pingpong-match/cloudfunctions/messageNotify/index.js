const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { type, targetUser, messageId } = event
  
  try {
    const wxContext = cloud.getWXContext()
    
    // 获取发送者信息
    const db = cloud.database()
    const sender = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()

    if (!sender.data.length) {
      throw new Error('发送者信息不存在')
    }

    // 根据消息类型构建通知内容
    let notifyContent = ''
    switch (type) {
      case 'newMessage':
        notifyContent = `${sender.data[0].userInfo.nickName}发来新消息`
        break
      case 'newMatch':
        notifyContent = `${sender.data[0].userInfo.nickName}向您发起约战`
        break
      default:
        notifyContent = '您有新的消息'
    }

    // 调用微信统一服务消息
    const result = await cloud.openapi.uniformMessage.send({
      touser: targetUser,
      mpTemplateMsg: {
        appid: wxContext.APPID,
        templateId: 'your-template-id', // 需要在微信公众平台申请模板
        data: {
          thing1: {
            value: notifyContent
          },
          time2: {
            value: new Date().toLocaleString()
          }
        },
        page: type === 'newMessage' ? `/pages/chat-room/chat-room?messageId=${messageId}` : '/pages/match/match'
      }
    })

    return {
      code: 0,
      data: result,
      msg: '通知发送成功'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}