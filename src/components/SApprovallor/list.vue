<script>
import utils from '@/utils'
import { mapState } from 'vuex'
import STable from '@/components/STable'
import base from '@/mixins/base.js'

export default {
  components: {
    STable
  },
  mixins: [base],
  props: {
    applyAnchorText: {
      type: String,
      required: true
    },
    stableRowKey: {
      type: String,
      required: true
    },
    list: {
      type: Object,
      required: true
    },
    apimap: {
      type: Object,
      required: true
    },
    transferSearchor: {
      type: Function,
      required: true
    },
    bridge: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      dataList: [],
      selectRows: []
    }
  },
  computed: {
    ...mapState({
      user: state => state.global.user,
      roleType: state => state.global.userRole.type
    }),
    isOutsideStuff () {
      return this.roleType === 'SUPPLIER' || this.roleType === 'OUT'
    },
    dataDir () {
      return this.list.dataDir || ''
    },
    searchor () {
      return this.transferSearchor(this.queryPermissionItem(this.list.searchor || []))
    },
    columns () {
      const columns = this.list.columns || []
      return this.queryPermissionItem(columns)
    }
  },
  methods: {
    queryPermissionItem (list) {
      // 外部人员标识为1，内部为0
      const SIGN = this.isOutsideStuff ? 1 : 0
      return list.filter(item => {
        if (!utils.isEmpty(item.permission)) {
          // item.permission 中被填入的有可能时字符串，也有可能是数字
          return item.permission.includes(SIGN) || item.permission.includes(SIGN + '')
        } else {
          return true
        }
      })
    },
    fixTextWrapper () {
      // 如果文本长度超过20，就省略掉
      const h = this.$createElement
      const maxLen = 20
      return (text, record, index) => {
        if (utils.isString(text) && text.length > maxLen) {
          return h('a-tooltip', {
            props: {
              title: text
            }
          }, [
            h('span', text.substring(0, maxLen) + '...')
          ])
        } else {
          return text
        }
      }
    },
    projectApproval (record) {
      this.$emit('addDetailTab', '2', record)
    },
    projectApply () {
      this.$emit('addDetailTab', '1')
    },
    selectChange (selectKeys, selectRows) {
      this.selectRows = selectRows
    },
    updateDataSet (val) {
      this.selectRows = []
      this.dataList = val
    },
    async reload () {
      await this.$refs.STableRef
      this.$refs.STableRef.reload()
    }
  },
  render (h) {
    const summarySlots = getSummarySlots.call(this, h)
    const { apimap, stableRowKey } = this.$props
    return (
      <div>
        <STable
          ref={'STableRef'}
          bridge={{
            ...this.bridge,
            reload: this.reload,
            projectApply: this.projectApply,
            projectApproval: this.projectApproval
          }}
          columns={this.columns}
          searchor={this.searchor}
          data-dir={this.dataDir}
          row-key={stableRowKey}
          data-api={apimap.list}
          export-api={apimap.export}
          pass-api={this.hasCatalogButton(apimap.passable) ? apimap.pass : ''}
          unpass-api={this.hasCatalogButton(apimap.unpassable) ? apimap.unpass : ''}
          revoke-api={this.hasCatalogButton(apimap.revokable) ? apimap.revoke : ''}
          close-api={this.hasCatalogButton(apimap.closable) ? apimap.close : ''}
          delete-api={this.hasCatalogButton(apimap.deletable) ? apimap.delete : ''}
          reject-api={this.hasCatalogButton(apimap.rejectable) ? apimap.reject : ''}
          abandon-api={this.hasCatalogButton(apimap.abandonable) ? apimap.abandon : ''}
          transfer-api={this.hasCatalogButton(apimap.transferable) ? apimap.transfer : ''}
          is-pagination={true}
          onUpdate={this.updateDataSet}
          onSelectChange={this.selectChange}
        >
          { summarySlots }
        </STable>
      </div>
    )
  }
}

// 获取插槽提供的按钮
function getSummarySlots (h) {
  const slots = this.$slots || {}
  const summarys = slots.stableSummary || []
  const { applyAnchorText } = this.$props
  return (
    <template slot="summary">
      {
        this.hasCatalogButton(this.apimap.appliable) &&
        this.apimap.apply &&
        <a-button
          ghost
          type="primary"
          onClick={() => this.projectApply()}
        >
          { applyAnchorText }
        </a-button>
      }
      { ...summarys }
    </template>
  )
}

</script>
