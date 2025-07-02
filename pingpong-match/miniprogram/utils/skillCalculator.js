// 技能评估表单验证
export const validateEvaluationForm = (answers) => {
  const errors = {}

  if (!answers.yearsPlaying || answers.yearsPlaying < 0) {
    errors.yearsPlaying = '请输入有效的打球年限'
  }

  if (!answers.trainingFrequency) {
    errors.trainingFrequency = '请选择训练频率'
  }

  if (!answers.basicSkills || answers.basicSkills.length === 0) {
    errors.basicSkills = '请评估基本技术水平'
  }

  if (typeof answers.competitionExperience !== 'number') {
    errors.competitionExperience = '请选择比赛经验'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// 技术项目列表
export const technicalItems = [
  {
    name: 'forehand',
    label: '正手技术',
    description: '评估正手攻球、推挡等技术水平'
  },
  {
    name: 'backhand',
    label: '反手技术',
    description: '评估反手攻球、推挡等技术水平'
  },
  {
    name: 'serve',
    label: '发球技术',
    description: '评估发球质量和变化'
  },
  {
    name: 'receive',
    label: '接发球',
    description: '评估接发球质量和稳定性'
  },
  {
    name: 'footwork',
    label: '步法移动',
    description: '评估步法协调性和移动速度'
  }
]

// 训练频率选项
export const trainingFrequencyOptions = [
  { value: 'rarely', label: '极少训练' },
  { value: 'monthly', label: '每月1-2次' },
  { value: 'weekly', label: '每周1次' },
  { value: 'several_times_week', label: '每周2-3次' },
  { value: 'daily', label: '每天训练' }
]

// 比赛经验选项
export const competitionExperienceOptions = [
  { value: 0, label: '无比赛经验' },
  { value: 1, label: '参加过校园/单位比赛' },
  { value: 2, label: '参加过地区性比赛' },
  { value: 3, label: '参加过市级比赛' },
  { value: 4, label: '参加过省级比赛' },
  { value: 5, label: '参加过国家级比赛' }
]