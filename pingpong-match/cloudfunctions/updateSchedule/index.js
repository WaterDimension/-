const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { schedule, operation } = event
  
  try {
    switch (operation) {
      case 'add':
        // 添加新日程
        const result = await db.collection('schedules').add({
          data: {
            ...schedule,
            _openid: wxContext.OPENID,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        return {
          code: 0,
          data: { id: result._id },
          msg: '添加成功'
        }

      case 'update':
        // 更新日程
        await db.collection('schedules')
          .doc(schedule._id)
          .update({
            data: {
              ...schedule,
              updateTime: db.serverDate()
            }
          })
        return {
          code: 0,
          msg: '更新成功'
        }

      case 'delete':
        // 删除日程
        await db.collection('schedules')
          .doc(schedule._id)
          .remove()
        return {
          code: 0,
          msg: '删除成功'
        }

      default:
        throw new Error('无效的操作类型')
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}