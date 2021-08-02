``` html
<template>
  <div>
    <FormItemRender
      :mode="'readonly'"
      :data-source="dataSource"
      :form-items="formItems"
    />
  </div>
</template>
<script>
import FormItemRender from '@/components/FormItemRender'
export default {
  components: {
    FormItemRender
  },
  data () {
    return {
      dataSource: {
        code: 112233
      },
      formItems: [
        {
          label: '查询编号',
          key: 'code'
        }
      ]
    }
  }
}
</script>
```