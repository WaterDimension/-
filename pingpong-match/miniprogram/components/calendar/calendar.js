Component({
  properties: {
    schedules: {
      type: Array,
      value: []
    },
    selectedDate: {
      type: String,
      value: ''
    }
  },

  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六']
  },

  lifetimes: {
    attached() {
      this.generateCalendar()
    }
  },

  methods: {
    generateCalendar() {
      const { year, month } = this.data
      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0)
      
      const days = []
      const firstDayWeek = firstDay.getDay()
      const lastDate = lastDay.getDate()

      // 补充上月天数
      for (let i = 0; i < firstDayWeek; i++) {
        const prevMonthLastDay = new Date(year, month - 1, 0)
        const date = prevMonthLastDay.getDate() - firstDayWeek + i + 1
        days.push({
          date,
          month: month - 1,
          year: month === 1 ? year - 1 : year,
          isCurrentMonth: false
        })
      }

      // 当月天数
      for (let i = 1; i <= lastDate; i++) {
        days.push({
          date: i,
          month,
          year,
          isCurrentMonth: true
        })
      }

      // 补充下月天数
      const remainingDays = 42 - days.length // 保持6行7列布局
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: i,
          month: month + 1,
          year: month === 12 ? year + 1 : year,
          isCurrentMonth: false
        })
      }

      // 添加日程信息
      days.forEach(day => {
        const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
        day.schedules = this.properties.schedules.filter(s => 
          s.date.split(' ')[0] === dateStr
        )
      })

      this.setData({ days })
    },

    handlePrevMonth() {
      let { year, month } = this.data
      if (month === 1) {
        year--
        month = 12
      } else {
        month--
      }
      this.setData({ year, month }, () => {
        this.generateCalendar()
      })
    },

    handleNextMonth() {
      let { year, month } = this.data
      if (month === 12) {
        year++
        month = 1
      } else {
        month++
      }
      this.setData({ year, month }, () => {
        this.generateCalendar()
      })
    },

    handleDateSelect(e) {
      const { day } = e.currentTarget.dataset
      const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
      this.triggerEvent('select', { date: dateStr })
    }
  },

  observers: {
    'schedules': function() {
      this.generateCalendar()
    }
  }
})