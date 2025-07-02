Component({
  data: {
    showFilter: false,
    filters: {
      skillLevel: 1,
      playStyles: [],
      minScore: 60
    },
    playStyleOptions: [
      '弧圈', '快攻', '削球', '推挡', '搓球', '发球抢攻'
    ]
  },

  methods: {
    toggleFilter() {
      this.setData({
        showFilter: !this.data.showFilter
      })
    },

    handleSkillLevelChange(e) {
      this.setData({
        'filters.skillLevel': parseInt(e.detail.value)
      })
    },

    toggleStyle(e) {
      const { style } = e.currentTarget.dataset
      const playStyles = [...this.data.filters.playStyles]
      const index = playStyles.indexOf(style)
      
      if (index > -1) {
        playStyles.splice(index, 1)
      } else {
        playStyles.push(style)
      }

      this.setData({
        'filters.playStyles': playStyles
      })
    },

    handleScoreChange(e) {
      this.setData({
        'filters.minScore': parseInt(e.detail.value)
      })
    },

    applyFilters() {
      this.triggerEvent('filter', this.data.filters)
      this.toggleFilter()
    },

    resetFilters() {
      this.setData({
        filters: {
          skillLevel: 1,
          playStyles: [],
          minScore: 60
        }
      })
      this.triggerEvent('filter', this.data.filters)
    }
  }
})