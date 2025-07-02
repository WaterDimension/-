const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 技术等级评估算法
function calculateSkillLevel(answers) {
  // 基础分值设定
  const baseScore = 1
  let totalScore = baseScore
  
  // 各项评分权重
  const weights = {
    experience: 0.3,
    frequency: 0.2,
    technique: 0.3,
    competition: 0.2
  }

  // 计算经验得分
  const experienceScore = answers.yearsPlaying * weights.experience

  // 计算训练频率得分
  const frequencyScores = {
    'rarely': 1,
    'monthly': 2,
    'weekly': 3,
    'several_times_week': 4,
    'daily': 5
  }
  const frequencyScore = frequencyScores[answers.trainingFrequency] * weights.frequency

  // 计算技术掌握度得分
  const techniqueScore = (
    answers.basicSkills.reduce((sum, skill) => sum + skill.level, 0) / 
    answers.basicSkills.length
  ) * weights.technique

  // 计算比赛经验得分
  const competitionScore = answers.competitionExperience * weights.competition

  // 计算总分
  totalScore += experienceScore + frequencyScore + techniqueScore + competitionScore

  // 将总分映射到1-9级
  return Math.min(Math.max(Math.round(totalScore), 1), 9)
}

exports.main = async (event, context) => {
  const { answers } = event
  const wxContext = cloud.getWXContext()
  
  try {
    // 计算技术等级
    const skillLevel = calculateSkillLevel(answers)
    
    // 更新用户技术等级
    const db = cloud.database()
    await db.collection('users').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        skillLevel,
        evaluationAnswers: answers,
        lastEvaluationTime: db.serverDate()
      }
    })

    return {
      code: 0,
      data: {
        skillLevel
      },
      msg: '评估完成'
    }
  } catch (err) {
    return {
      code: -1,
      msg: err
    }
  }
}