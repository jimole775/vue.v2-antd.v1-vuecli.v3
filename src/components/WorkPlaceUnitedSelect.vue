<template>
  <form>
    <a-row v-for="(workPlaceItem, index) in workPlaceList" :key="index">
      <a-col :span="layout.s">
        <a-form-item
          required
          :label-col="layout.l"
          :wrapper-col="layout.w"
        >
          <span slot="label">
            <a
              v-if="index === 0"
              @click="workPlaceList.push({region: '', workPlace: '', deliveryType: ''})"
            >
              <a-icon type="plus-circle" />
            </a>
            <a
              v-else
              class="warning-tips"
              @click="workPlaceList.splice(index, 1)"
            >
              <a-icon type="minus-circle" />
            </a>
            城市
          </span>
          <a-select
            placeholder="请选择城市"
            v-model="workPlaceItem.region"
            @change="changeRegin(workPlaceItem, index)"
          >
            <a-select-option v-for="item in areaOption" :key="item.region">
              {{ item.region }}
            </a-select-option>
          </a-select>
          <span v-if="!workPlaceItem.region && workPlaceListWarning" class="warning-tips">请选择城市</span>
        </a-form-item>
      </a-col>
      <a-col :span="layout.s">
        <a-form-item
          required
          :label="'地点'"
          :label-col="layout.l"
          :wrapper-col="layout.w"
        >
          <a-select
            placeholder="请选择地点"
            v-model="workPlaceItem.workPlace"
            @change="(val) => workingPlaceChanged(val, workPlaceOption[index], workPlaceItem)"
          >
            <a-select-option
              v-for="item in workPlaceOption[index]"
              :key="item.workingPlace"
            >
              {{ item.workingPlace }}
            </a-select-option>
          </a-select>
          <span v-if="!workPlaceItem.workPlace && workPlaceListWarning" class="warning-tips">请选择地点</span>
        </a-form-item>
      </a-col>
      <a-col :span="layout.s">
        <a-form-item
          required
          :label-col="layout.l"
          :wrapper-col="layout.w"
        >
          <span slot="label">
            形式
          </span>
          <DictSelect
            required
            :disabled="true"
            :group-code="'dg_delivery'"
            placeholder="请选择形式"
            v-model="workPlaceItem.deliveryType"
          />
          <span v-if="!workPlaceItem.deliveryType && workPlaceListWarning" class="warning-tips">请选择形式</span>
        </a-form-item>
      </a-col>
    </a-row>
  </form>
</template>
<script>
import api from '@/api'
export default {
  title: '工作地选择（关联）',
  name: 'WorkPlaceUnitedSelect',
  forBuilder: true,
  props: {
    defaultList: {
      type: Array,
      default: null
    },
    layoutDirection: {
      type: String,
      default: 'h'
    },
    orgCode: {
      type: String,
      default: ''
    }
  },
  computed: {
    layout () {
      return this.layoutDirection === 'h' ? this.horizontal : this.vertical
    }
  },
  watch: {
    defaultList (val) {
      if (val) {
        this.workPlaceList = val
      }
    },
    workPlaceList (val) {
      val && val.forEach((item, index) => {
        api.getWorkingPlaceByRegion(item.region, this.orgCode).then(res => {
          if (res.code === 200) {
            this.$set(this.workPlaceOption, index, res.data)
          }
        })
      })
    }
  },
  created () {
    if (this.defaultList) this.workPlaceList = this.defaultList
    this.getAllArea()
  },
  data () {
    return {
      vertical: {
        s: 24,
        l: { span: 2 },
        w: { span: 6 }
      },
      horizontal: {
        s: 8,
        l: { span: 8 },
        w: { span: 16 }
      },
      workPlaceList: [{
        region: '',
        workPlace: '',
        deliveryType: ''
      }],
      workPlaceOption: [],
      areaOption: [],
      workPlaceListWarning: false
    }
  },
  methods: {
    // 获取所有地域
    async getAllArea () {
      const res = await api.getAllArea()
      if (res.code === 200) {
        this.areaOption = res.data
      }
    },
    // 动态获取工作地点
    changeRegin (item, index) {
      api.getWorkingPlaceByRegion(item.region, this.orgCode).then(res => {
        if (res.code === 200) {
          this.$set(this.workPlaceOption, index, res.data)
          item.workPlace = null
          item.deliveryType = null
        }
      })
    },
    workingPlaceChanged (val, workPlaceOption, workPlaceItem) {
      workPlaceOption && workPlaceOption.forEach((option) => {
        if (option.workingPlace === val) {
          this.$set(workPlaceItem, 'deliveryType', option.deliveryType)
        }
      })
    },
    getWorkPlaceList () {
      let workPlaceErr = ''
      this.workPlaceList.forEach((workPlaceItem) => {
        if (!workPlaceItem.region) {
          workPlaceErr = '请先选择城市'
        }
        if (!workPlaceItem.workPlace) {
          workPlaceErr = '请先选择工作地点'
        }
        if (!workPlaceItem.deliveryType) {
          workPlaceErr = '请先选择交付形式'
        }
      })
      if (workPlaceErr) {
        // this.timeClock 只用来做全局变量，
        // 为了存储管理 workPlaceListWarning 的状态
        // 不需要双向绑定，所以不在 data 中声明
        clearTimeout(this.timeClock)
        this.workPlaceListWarning = true
        this.timeClock = setTimeout(() => {
          this.workPlaceListWarning = false
        }, 5000)
        return false
      } else {
        return this.workPlaceList
      }
    }
  }
}
</script>
<style lang="less" scoped>
.ant-row .ant-form-item{
// height: 54px;
}
/deep/ .ant-form-item-control {
  line-height: 32px;
}
.warning-tips {
  // position: absolute;
  // left: 0;
  // top: 20px;
  color: red;
}
</style>
