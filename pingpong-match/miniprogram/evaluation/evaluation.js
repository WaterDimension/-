const { 
  validateEvaluationForm, 
  technicalItems, 
  trainingFrequencyOptions, 
  competitionExperienceOptions 
} = require('../../utils/skillCalculator')

Component({
  properties: {
    initialData: {
      type: Object,
      value: null
    }
  },

  data: {
    formData: {
      yearsPlaying: '',
      trainingFrequency: '',
      basicSkills: [],
      competitionExperience: null
    },
    technicalItems,
    trainingFrequencyOptions,
    competitionExperienceOptions,
    errors: {},
    isSubmitting: false
  },

  lifetimes: {
    attached() {
      if (this.properties.initialData) {
        this.setData({
          formData: this.properties.initialData
        })
      }
    }
  },

  methods: {
    handleInput(e) {
      const { field } = e.currentTarget.dataset
      const { value } = e.detail
      
      this.setData({
        [`formData.${field}`]: value,
        [`errors.${field}`]: ''
      })
    },

    handleSkillLevel(e) {
      const { skill, level } = e.currentTarget.dataset
      const basicSkills = [...this.data.formData.basicSkills]
      const skillIndex = basicSkills.findIndex(item => item.name === skill)
      
      if (skillIndex > -1) {
        basicSkills[skillIndex].level = level
      } else {
        basicSkills.push({ name: skill, level })
      }

      this.setData({
        'formData.basicSkills': basicSkills,
        'errors.basicSkills': ''
      })
    },

    async handleSubmit() {
      const { isValid, errors } = validateEvaluationForm(this.data.formData)
      
      if (!isValid) {
        this.setData({ errors })
        return
      }

      this.setData({ isSubmitting: true })

      try {
        const res = await wx.cloud.callFunction({
          name: 'skillEvaluation',
          data: {
            answers: this.data.formData
          }
        })

        if (res.result.code === 0) {
          this.triggerEvent('success', {
            skillLevel: res.result.data.skillLevel
          })
        } else {
          throw new Error(res.result.msg)
        }
      } catch (err) {
        wx.showToast({
          title: '评估失败，请重试',
          icon: 'none'
        })
      } finally {
        this.setData({ isSubmitting: false })
      }
    }
  }
})