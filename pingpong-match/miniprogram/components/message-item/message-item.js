Component({
  properties: {
    message: {
      type: Object,
      value: {}
    },
    isSent: {
      type: Boolean,
      value: false
    },
    nickname: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 处理图片点击
    handleImageTap() {
      const { message } = this.properties
      if (message.type === 'image') {
        wx.previewImage({
          urls: [message.content]
        })
      }
    },

    // 格式化时间
    formatTime(date) {
      if (!date) return ''
      
      const now = new Date()
      const messageDate = new Date(date)
      
      // 如果是今天的消息，只显示时间
      if (messageDate.toDateString() === now.toDateString()) {
        return messageDate.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      }
      
      // 否则显示完整日期和时间
      return messageDate.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
})