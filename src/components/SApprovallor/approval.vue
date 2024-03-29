<template>
  <div>
    <ApprovalStepBar
      :id="recordData.flowInstanceId"
      :nodes="$utils.isFunction(apimap.stepNodes) ? apimap.stepNodes(scope) : apimap.stepNodes"
      @update="updateCurrentNode"
    />
    <a-collapse
      :bordered="false"
      :active-key="['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']"
    >
      <template v-for="(panel, index) in panels">
        <a-collapse-panel
          v-if="panel.show"
          :header="panel.title"
          :key="`${index + 1}`"
          class="m-block"
        >
          <component
            :ref="`${panel.panelName}_${index}`"
            :is="panel.component"
            :mode="panel.mode"
            :panel="panel"
            :panels="panels"
            :form-items="panel.formItems"
            :operation-item="panel.operationItem"
            :data-source="basicData"
            :tab-proxy="tabProxy"
            :current-node="currentNode"
            :columns="panel.columns"
            :before-render="beforeRender"
            :business-id="recordData.id"
            :business-type="apimap.logType"
            :bridge="{
              ...bridge,
              panel,
              panels,
              apimap,
              tabProxy,
              recordData,
              currentNode,
              dataSource: basicData,
              columns: panel.columns,
              formItems: panel.formItems,
              operationItem: panel.operationItem,
            }"
            @submit="submitHandler"
          />
        </a-collapse-panel>
      </template>
    </a-collapse>
  </div>
</template>
<script>
import api from '@/api'
import utils from '@/utils'
import base from '@/mixins/base.js'
import ApprovalStepBar from '@/components/ApprovalStepBar'
export default {
  components: {
    ApprovalStepBar
  },
  mixins: [base],
  props: {
    tabProxy: {
      type: Object,
      required: true
    },
    approval: {
      type: Object,
      required: true
    },
    apimap: {
      type: Object,
      required: true
    },
    bridge: {
      type: Object,
      default: () => ({})
    },
    beforeRender: {
      type: Function,
      default: p => p
    },
    beforeSubmit: {
      type: Function,
      default: p => p
    }
  },
  data () {
    return {
      scope: this,
      currentTab: {},
      basicData: {},
      currentNode: {},
      panels: [],
      form: this.$form.createForm(this)
    }
  },
  watch: {
    activeModule: {
      async handler (aModule) {
        if (!aModule) return []
        const panels = this.isApprovallor
          ? aModule.panels.permission
          : aModule.panels.dispermission
        this.panels = panels.map((item) => {
          if (utils.isString(item.component)) {
            item.panelName = item.component
          }
          if (utils.isObject(item.component)) {
            item.panelName = item.component.name || 'customRender'
          }
          if (utils.isNone(item.component)) {
            item.panelName = 'customRender'
          }
          if (item.show === undefined) {
            item.show = true
          }
          return item
        })
      },
      immediate: true,
      deep: true
    },
    tabProxy: {
      async handler (tabProxy) {
        if (!tabProxy) return false
        const activeTab = tabProxy.tabs.filter((pane) => pane.tabId === tabProxy.activeId)
        this.currentTab = activeTab ? activeTab[0] : {}
        let func
        if (utils.isFunction(this.apimap.detail)) {
          func = this.apimap.detail
        } else {
          func = api[this.apimap.detail]
        }
        const res = await func(this.currentTab.recordData)
        if (res.code === 200) {
          this.basicData = { ...res.data }
        } else {
          this.$message.warning(res.message)
        }
      },
      immediate: true
    }
  },
  computed: {
    recordData () {
      return this.currentTab.recordData || {}
    },
    isApprovallor () {
      return this.currentNode &&
        this.currentNode.approvalAccountList &&
          this.currentNode.approvalAccountList.includes(this.currentAccount)
    },
    activeModule () {
      return this.approval && this.approval[this.currentNode.nodeCode]
    }
  },
  methods: {
    updateCurrentNode (node) {
      // 获取审批节点信息，并刷新组件
      this.currentNode = node
    },
    // 获取每个模块的form数据
    async getComponentsValues () {
      const params = {}
      const tips = []
      for (let index = 0; index < this.panels.length; index++) {
        const panel = this.panels[index]
        if (panel.show === false) continue
        const panelDomId = `${panel.componentName}_${index}`
        if (panel.mode === 'edit') {
          await this.$refs[panelDomId]
          const validRes = await this.$refs[panelDomId][0].getFieldsValue()
          if (validRes.type === 'success') {
            Object.assign(params, validRes.data)
          } else {
            tips.push(validRes.message)
          }
        }
      }
      return Promise.resolve({ params, tips })
    },
    getComponentsRequiredFields (params) {
      let requiredFields = []
      this.panels.forEach((panel) => {
        if (panel.component === 'ApprovalOperation' ||
          panel.componentName === 'ApprovalOperation') {
          const inputs = panel.operationItem.inputs || []
          inputs.forEach((item) => {
            if (item.show && item.show.includes(params.approvalResult)) {
              if (item.required === true) {
                requiredFields.push(item.key)
              }
            }
          })
        }
      })
      return requiredFields
    },
    validateRequiredField ({ tips, params }) {
      const requiredFields = this.getComponentsRequiredFields(params)
      let isFinishRequiredField = true
      // 操作模块的必填字段验证
      if (requiredFields.length) {
        requiredFields.forEach((field) => {
          if (utils.isNone(params[field])) {
            isFinishRequiredField = false
          }
        })
      }
      // 如果选择 “通过”，tips有值的话，就代表必填条件未完成
      if (params.approvalResult === '1' && tips.length) {
        isFinishRequiredField = false
      }
      return isFinishRequiredField
    },
    async submitHandler () {
      const values = await this.getComponentsValues()
      if (this.validateRequiredField(values)) {
        this.startApprove({
          ...values.params,
          id: this.recordData.id,
          instanceId: this.basicData.flowInstanceId,
          currentFlowNode: this.basicData.flowNode
        })
      } else {
        this.$modal.warning({
          title: '提示',
          content: values.tips[0] || '请完成必填字段!'
        })
      }
    },
    // 发起审批
    async startApprove (params) {
      const finalParams = this.$props.beforeSubmit(params, this.scope)
      let func
      if (utils.isFunction(this.apimap.approval)) {
        func = this.apimap.approval
      } else {
        func = api[this.apimap.approval]
      }
      const res = await func(finalParams)
      if (res.code === 200) {
        this.$message.success('操作成功')
        this.$emit('close')
      } else {
        this.$modal.warning({
          title: '提示',
          content: res.message
        })
      }
    }
  }
}
</script>
<style lang="less" scoped>
.ppproject-footer {
  text-align: center;
  margin: 2rem 0;
  button {
    width: 16rem;height:2.6rem;
  }
}
/deep/.ant-row {
  line-height: 2.5;
}
</style>
