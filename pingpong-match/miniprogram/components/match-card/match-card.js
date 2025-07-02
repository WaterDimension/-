Component({
  properties: {
    userData: {
      type: Object,
      value: null
    },
    matchScore: {
      type: Number,
      value: 0
    }
  },

  data: {
    showMatchDialog: false,
    selectedTime: '',
    location: '',
    message: ''
  },

  methods: {
    showMatch() {
      this.setData({
        showMatchDialog: true
      })
    },

    closeMatch() {
      this.setData({
        showMatchDialog: false,
        selectedTime: '',
        location: '',
        message: ''
      })
    },

    handleTimeChange(e) {
      this.setData({
        selectedTime: e.detail.value
      })
    },

    handleInput(e) {
      const { field } = e.currentTarget.dataset
      this.setData({
        [field]: e.detail.value
      })
    },

    async handleSubmit() {
      const { selectedTime, location, message } = this.data
      
      if (!selectedTime || !location) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      try {
        const res = await wx.cloud.callFunction({
          name: 'createMatch',
          data: {
            targetUserId: this.properties.userData._openid,
            selectedTime,
            location,
            message
          }
        })

        if (res.result.code === 0) {
          wx.showToast({
            title: '约战已发送',
            icon: 'success'
          })
          this.closeMatch()
          this.triggerEvent('success')
        } else {
          throw new Error(res.result.msg)
        }
      } catch (err) {
        wx.showToast({
          title: '发送失败',
          icon: 'none'
        })
      }
    }
  }
})