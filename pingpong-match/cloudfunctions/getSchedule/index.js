const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { startDate, endDate } = event
  
  try {
    // 获取用户的所有日程安排
    const schedules = await db.collection('schedules')
      .where({
        _openid: wxContext.OPENID,
        date: db.command.gte(startDate).and(db.command.lte(endDate))
      })
      .orderBy('date', 'asc')
      .get()

    // 获取约战相关的日程
    const matches = await db.collection('matches')
      .where(db.command.or([
        { initiator: wxContext.OPENID },
        { target: wxContext.OPENID }
      ]).and({
        status: 'accepted',
        selectedTime: db.command.gte(startDate).and(db.command.lte(endDate))
      }))
      .orderBy('selectedTime', 'asc')
      .get()

    // 合并日程和约战
    const allSchedules = [
      ...schedules.data,
      ...matches.data.map(match => ({
        _id: match._id,
        type: 'match',
        title: '约战',
        date: match.selectedTime,
        location: match.location,
        opponent: match.initiator === wxContext.OPENID ? match.target : match.initiator
      }))
    ]

    return {
      code: 0,
      data: allSchedules,
      msg: '获取成功'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}