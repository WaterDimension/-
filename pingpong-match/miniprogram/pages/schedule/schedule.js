Page({
  data: {
    schedules: [],
    selectedDate: '',
    selectedDateSchedules: [],
    showScheduleForm: false,
    editingSchedule: null,
    form: {
      title: '',
      date: '',
      time: '',
      location: '',
      notes: ''
    }
  },

  onLoad() {
    // 初始化选中今天
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    this.setData({ selectedDate: dateStr })
    
    this.loadSchedules()
  },

  async loadSchedules() {
    try {
      // 获取当月第一天和最后一天
      const [year, month] = this.data.selectedDate.split('-')
      const startDate = `${year}-${month}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${month}-${lastDay}`

      const res = await wx.cloud.callFunction({
        name: 'getSchedule',
        data: { startDate, endDate }
      })

      if (res.result.code === 0) {
        this.setData({
          schedules: res.result.data,
          selectedDateSchedules: res.result.data.filter(s => 
            s.date.split(' ')[0] === this.data.selectedDate
          )
        })
      }
    } catch (err) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  handleDateSelect(e) {
    const { date } = e.detail
    this.setData({
      selectedDate: date,
      selectedDateSchedules: this.data.schedules.filter(s => 
        s.date.split(' ')[0] === date
      )
    })
  },

  showAddSchedule() {
    this.setData({
      showScheduleForm: true,
      editingSchedule: null,
      form: {
        title: '',
        date: this.data.selectedDate,
        time: '12:00',
        location: '',
        notes: ''
      }
    })
  },

  editSchedule(e) {
    const { schedule } = e.currentTarget.dataset
    const [date, time] = schedule.date.split(' ')
    
    this.setData({
      showScheduleForm: true,
      editingSchedule: schedule,
      form: {
        title: schedule.title,
        date,
        time: time || '12:00',
        location: schedule.location || '',
        notes: schedule.notes || ''
      }
    })
  },

  async deleteSchedule(e) {
    const { schedule } = e.currentTarget.dataset
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateSchedule',
        data: {
          operation: 'delete',
          schedule
        }
      })

      if (res.result.code === 0) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        this.loadSchedules()
      }
    } catch (err) {
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  async handleSubmit() {
    const { form, editingSchedule } = this.data
    
    if (!form.title || !form.date || !form.time) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    const scheduleData = {
      ...form,
      date: `${form.date} ${form.time}`
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'updateSchedule',
        data: {
          operation: editingSchedule ? 'update' : 'add',
          schedule: editingSchedule ? { ...scheduleData, _id: editingSchedule._id } : scheduleData
        }
      })

      if (res.result.code === 0) {
        wx.showToast({
          title: `${editingSchedule ? '更新' : '添加'}成功`,
          icon: 'success'
        })
        this.setData({ showScheduleForm: false })
        this.loadSchedules()
      }
    } catch (err) {
      wx.showToast({
        title: `${editingSchedule ? '更新' : '添加'}失败`,
        icon: 'none'
      })
    }
  },

  closeForm() {
    this.setData({
      showScheduleForm: false,
      editingSchedule: null
    })
  }
})