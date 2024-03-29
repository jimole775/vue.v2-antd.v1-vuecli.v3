<template>
  <a-tabs
    hide-add
    type="editable-card"
    v-model="tabProxy.activeId"
    @edit="tabEditEvent"
    @change="tabChangeEvent"
  >
    <a-tab-pane
      v-for="tab in tabsView"
      :key="tab.tabId"
      :tab="tab.tabName"
      :closable="!!tab.closable"
    />
  </a-tabs>
</template>
<script>
import utils from '@/utils'
import { mapActions } from 'vuex'
import base from '@/mixins/base'
const tabmodel = {
  tabName: '',
  proxyName: null,
  type: 'apply', // 'list' 'apply' 'detail'
  tabId: '1_1',
  closable: true,
  show: true,
  visible: true,
  lastListId: '',
  recordData: {}
}
export default {
  title: '页签',
  name: 'STabs',
  props: {
    tabProxy: {
      type: Object,
      default: () => ({})
    }
  },
  mixins: [base],
  data () {
    return {
      // 用来存储点击过的【list类型】的tabid
      // 用push的方式来存储，取的时候，永远取最后一个
      // 主要的作用就是在用户关闭可编辑的tab时，可回溯到最后一个被浏览的list
      usedListIds: [],
      cacheTabsLen: null
    }
  },
  computed: {
    // 主要渲染对象
    tabsView () {
      return this.tabProxy.tabs.filter(tab => tab.show)
    }
  },
  watch: {
    'tabProxy.tabs': {
      handler (tabs) {
        // tabProxy.tabs 有时候是后端返回的，属于异步获取
        // this.initialize() 中也会对tabs进行更改，所以需要用 currentTabsLen 进行预存
        // 防止死循环
        if (tabs && tabs.length && tabs.length !== this.cacheTabsLen) {
          // this.initialize()
          this.activeTab(this.tabProxy.activeId)
          this.cacheTabsLen = tabs.length
        }
      },
      deep: true,
      immediate: true
    },
    'tabProxy.activeId': {
      handler (tabId) {
        if (tabId) {
          const curTab = this.getCurTabFromTabId(tabId)
          // 如果目标pane时【detail】类型，就需要关联跳转前的【list】的tabid
          // 主要为了防止detail页内用lastListId查询数据时的报错
          if (curTab.type === 'apply') {
            curTab.__apply_listTabId__ = this.tabProxy.lastListId
          }
          if (curTab.type === 'detail') {
            curTab.__detail_listTabId__ = this.tabProxy.lastListId
          }
          this.activeTab(tabId)
          this.showPage(tabId)
        }
      },
      immediate: true
    },
    'tabProxy.lastListId': {
      handler (tabId) {
        if (tabId) {
          this.setLastListTabId(tabId)
          this.$emit('update')
        }
      }
    }
  },
  created () {
    this.initialize()
  },
  methods: {
    ...mapActions(['loadMenuButtons']),
    async initialize () {
      // 直接show activeId
      // 默认一定要加载按钮权限列表
      await this.getMenuButtons()
      // 根据权限列表裁剪有效的tabs
      this.queryPermissionTabs()
      return Promise.resolve()
    },
    async getMenuButtons () {
      const menuButtons = this.$store.state.global.menuButtons || []
      if (menuButtons.length === 0) {
        await this.loadMenuButtons()
      }
      return Promise.resolve()
    },
    queryPermissionTabs () {
      const tabs = this.tabProxy.tabs || []
      const menuButtons = this.$store.state.global.menuButtons || []
      this.tabProxy.tabs = tabs.filter(tab => {
        const permission = tab.permission || {}
        // 如果设置了 permission.config，就匹配这个的值
        return permission.config ? menuButtons.includes(permission.config) : tab.show
      })

      // 没有权限操作
      if (!this.tabProxy.tabs.length) {
        this.tabProxy.lastListId = this.tabProxy.activeId = null
        return false
      }

      // 把默认的 tab.show 全部设为 true
      this.tabProxy.tabs.forEach(tab => {
        tab.show = true
      })

      // 默认展示第一个 show 为 true 的 tab
      if (this.tabProxy.showList) {
        this.tabProxy.lastListId = this.tabProxy.activeId = this.tabProxy.tabs[0].tabId
      }
    },
    activeTab (tabId) {
      // 根据提供的id去获取指定的Panel面板
      const curTab = this.getCurTabFromTabId(tabId)
      // 需要把面板show设置为true
      curTab.show = true
    },
    negativePane (tabId) {
      const curTab = this.getCurTabFromTabId(tabId)
      curTab.show = false
    },
    addDetailTab (detailType, recordData) {
      // 根据recordData的id来判断当前是否有重复的panel
      if (this.isUniqueTanpe(recordData)) {
        const newTab = utils.clone(tabmodel)
        const listPanel = this.getCurTabFromTabId(this.getLastListTabId())
        newTab.type = Number.parseInt(detailType) === 1 ? 'apply' : 'detail'
        newTab.tabId = this.upRiseTabId(this.getLastEditTabId(listPanel.tabId, detailType))
        newTab.tabName = getTabName(detailType, listPanel)
        newTab.lastListId = listPanel.tabId
        newTab.recordData = recordData
        this.tabProxy.activeId = newTab.tabId
        this.tabProxy.tabs.push(newTab)
      } else {
        // 如果已经渲染的，就直接切换tab就行，不用新增tab
        return this.changeTabByRecordData(recordData)
      }

      function getTabName (_detailType, _listPanel) {
        const defaultsuffix = Number.parseInt(_detailType) === 1 ? '申请' : '审批'
        if (_listPanel.proxyName) {
          return Number.parseInt(_detailType) === 1 ? _listPanel.proxyName.apply : _listPanel.proxyName.detail
        } else {
          return _listPanel.tabName + defaultsuffix
        }
      }
    },
    isUniqueTanpe (recordData = {}) {
      let isUnique = true
      for (let index = 0; index < this.tabProxy.tabs.length; index++) {
        const pane = this.tabProxy.tabs[index]
        if (pane.recordData && pane.recordData.id === recordData.id) {
          isUnique = false
          break
        }
      }
      return isUnique
    },
    changeTabByRecordData (recordData = {}) {
      for (let index = 0; index < this.tabProxy.tabs.length; index++) {
        const pane = this.tabProxy.tabs[index]
        if (pane.recordData && pane.recordData.id === recordData.id) {
          this.tabProxy.activeId = pane.tabId
          break
        }
      }
    },
    // tab切换事件
    tabChangeEvent (tabId) {
      const curTab = this.getCurTabFromTabId(tabId)
      // curPan.type === undefined 属于向前兼容
      if (curTab.type === 'list' || curTab.type === undefined) {
        this.setLastListTabId(tabId)
      }
      // 目标tab如果是detail，
      // 需要保持 lastListId 是 list 类型的 tabId
      // 因为，申请和详情页有时候需要根据 list 的 tabId 去匹配一些数据
      if (curTab.type === 'apply') {
        this.setLastListTabId(curTab.__apply_listTabId__)
      }
      if (curTab.type === 'detail') {
        this.setLastListTabId(curTab.__detail_listTabId__)
      }
    },
    // 往 this.usedListIds 里塞 tabId
    setLastListTabId (tabId) {
      const curTab = this.getCurTabFromTabId(tabId)
      if (curTab.type === 'list' || curTab.type === undefined) {
        this.tabProxy.lastListId = tabId
        if (!this.usedListIds) {
          this.usedListIds = []
        }
        this.usedListIds.push(tabId)
        if (this.usedListIds.length > 99) {
          this.usedListIds.shift()
        }
      }
    },
    // 获取 this.usedListIds 的最后一位
    getLastListTabId () {
      if (!this.usedListIds) {
        this.usedListIds = []
      }
      return this.usedListIds[this.usedListIds.length - 1] || '0'
    },
    // 获取"详情页"，"申请页",这种可点击删除的Panel的id
    getLastEditTabId (listId, detailType) {
      // 如果是第一次新增panel，给与默认tabId
      let res = this.spillTabId(listId, detailType, 0)
      for (let i = this.tabProxy.tabs.length - 1; i > 0; i--) {
        const pane = this.tabProxy.tabs[i]
        if (pane.tabId.length > 1 && this.getDetailTypeFormTabId(pane.tabId) === detailType) {
          res = pane.tabId
          break
        }
      }
      return res
    },
    // tab新增或者删除事件
    tabEditEvent (tabId, action) {
      if (action === 'remove') {
        this.removeTab(tabId)
      }
    },
    // 关闭标签页
    // 两种情景触发当前方法：
    // 1. 当前只有用户点击【x】操作
    // 2. 审批完毕时，this.$emit('removeTab')进行调用
    removeTab (tabId) {
      for (let i = 0; i < this.tabProxy.tabs.length; i++) {
        const pane = this.tabProxy.tabs[i]
        if (pane.tabId === tabId) {
          this.tabProxy.tabs.splice(i, 1)
          break
        }
      }
      // activeId 切换到最后一个 list
      this.tabProxy.activeId = this.getLastListTabId()
      // 这里手动activeTab，是为了防止activeId没改变，导致没触发watch方法的情况
      this.activeTab(this.tabProxy.activeId)
    },
    getCurTabFromTabId (tabId) {
      const correctTab = this.tabProxy.tabs.find((pan) => pan.tabId === tabId)
      // correctTab = correctTab && correctTab.length ? correctTab[0] : {}
      return correctTab || {}
    },
    /**
     * 父级html是这样写的:
     * @html # <div v-if="tabProxy.showList">
     * @html #   <List />
     * @html # </div>
     * @html # <div v-if="tabProxy.showApply">
     * @html #   <Apply />
     * @html # </div>
     * @html # <div v-if="tabProxy.showDetail">
     * @html #   <Approval />
     * @html # </div>
     */
    showPage (tabId) {
      this.tabProxy.showList = false
      this.tabProxy.showApply = false
      this.tabProxy.showDetail = false
      if (/_/.test(tabId)) {
        if (this.getDetailTypeFormTabId(tabId) === '1') {
          this.tabProxy.showApply = true
        }
        if (this.getDetailTypeFormTabId(tabId) === '2') {
          this.tabProxy.showDetail = true
        }
      } else {
        this.tabProxy.showList = true
      }
    },
    // tabid 通过这样的逻辑来创建:
    // 'apply': 0_1_0 [列表下标_类型_自增下标]
    // 'detail': 0_2_0 [列表下标_类型_自增下标]
    upRiseTabId (tabId) {
      const listId = this.getListIdFormTabId(tabId)
      const type = this.getDetailTypeFormTabId(tabId)
      const detailId = this.getDetailIdFormTabId(tabId)
      return this.spillTabId(listId, type, detailId + 1)
    },
    spillTabId (listId = '0', type = '1', detailId = 0) {
      return listId + '_' + type + '_' + detailId
    },
    getListIdFormTabId (tabId) {
      return tabId.split('_')[0]
    },
    getDetailTypeFormTabId (tabId) {
      return tabId.split('_')[1]
    },
    getDetailIdFormTabId (tabId) {
      return Number.parseInt(tabId.split('_')[2])
    }
  }
}
</script>
