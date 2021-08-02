``` html
<template>
  <div>
    <WorkPlaceUnitedSelect
      ref="WorkPlaceUnitedSelectRef"
      layout-direction="v"
      :default-list="dataSource.defaultList"
      :org-code="dataSource.orgCode"
    />
    <br>
    <br>
    <a-button type="primary" @click="submitEvent">提交</a-button>
  </div>
</template>
<script>
import WorkPlaceUnitedSelect from '@/components/WorkPlaceUnitedSelect'
export default {
  components: {
    WorkPlaceUnitedSelect
  },
  data () {
    return {
      dataSource: {
        orgCode: 'oppo',
        defaultList: [{
          region: '',
          workPlace: '',
          deliveryType: ''
        }]
      }
    }
  },
  methods: {
    async submitEvent () {
      this.$modal.success({
        title: '操作结果',
        content: JSON.stringify(this.value)
      })
    }
  }
}
</script>
```