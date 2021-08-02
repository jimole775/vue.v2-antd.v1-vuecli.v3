``` html
<template>
  <div>
      <DatetimePicker v-model="dataSource.time" />
      <a-button type="primary" @click="submitEvent">提交</a-button>
  </div>
</template>
<script>
import DatetimePicker from '@/components/DatetimePicker'
export default {
  components: {
    DatetimePicker
  },
  data () {
    return {
      dataSource: {
        time: ''
      }
    }
  },
  methods: {
    async submitEvent () {
      let date = null
      if (this.dataSource.time) {
        date = moment(this.dataSource.time).format('YYYY-MM-DD HH:mm')
      }
      this.$modal.success({
        title: '操作结果',
        content: JSON.stringify({ date })
      })
    }
  }
}
</script>
```
