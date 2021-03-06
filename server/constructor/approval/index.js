// import mock from './mock.json'
const { object2file, stringMark } = require('../../utils')
// const basePath = 'approval'
// buildApproval(mock)
module.exports = function buildApproval (tabsTree, { name: moduleName, parent: parentName }, basePath) {
  let approvalFiles = [
    // {
    //   path: '',
    //   content: ''
    // }
  ]
  const tabIndexs = Object.keys(tabsTree)
  tabIndexs.forEach((tabIndex) => {
    const tabFolder = `${basePath}/tab${(tabIndex * 1 + 1)}`
    const permissionFolder = `${tabFolder}/permission`
    const dispermissionFolder = `${tabFolder}/dispermission`
    const uniPanels = getUniPanels(tabsTree[tabIndex])
    approvalFiles = approvalFiles.concat(buildPanels(permissionFolder, uniPanels.permission))
    approvalFiles = approvalFiles.concat(buildPanels(dispermissionFolder, uniPanels.dispermission))
    approvalFiles.push(buildPanelsLoadFile(tabFolder, tabsTree[tabIndex], uniPanels))
  })
  approvalFiles.push(buildTabLoadFile(basePath, tabsTree))
  return approvalFiles
}

// 略过 nodes，把唯一的panel存进一个数组里，过滤重复项
function getUniPanels (tab) {
  const nodes = Object.keys(tab)
  const res = { permission: [], dispermission: [] }
  nodes.forEach((node) => {
    const { permission, dispermission } = tab[node].panels
    permission.forEach((panel) => {
      if (!res.permission.find(i => i.title === panel.title)) {
        res.permission.push(panel)
      }
    })
    dispermission.forEach((panel) => {
      if (!res.dispermission.find(i => i.title === panel.title)) {
        res.dispermission.push(panel)
      }
    })
  })
  return res
}

function buildPanels (prevDir, panels) {
  const res = []
  const exportCode = `export default `
  panels.forEach((panel, index) => {
    let fileName = ''
    let data = {}
    if (panel.component === 'ApprovalOperation') {
      fileName = `operation.js`
      data = panel.operationItem
    } else {
      fileName = `panel${index + 1}.js`
      data = panel.formItems
    }
    res.push({
      path: `${prevDir}/${fileName}`,
      content: `${exportCode}${object2file(data)}`
    })
  })
  return res
}

function buildPanelsLoadFile (prevPath, tab, uniPanels) {
  const { permission, dispermission } = buildLoadsAndModules(uniPanels)

  const exportModule = buildExportsModules(tab, permission.modules, dispermission.modules)

  const log = buildAndInsertLog(exportModule)

  const code1 = dispermission.loads.map(i => i.code).join('\n')
  const code2 = permission.loads.map(i => i.code).join('\n')
  const code3 = dispermission.modules.map(i => i.code).join('\n')
  const code4 = permission.modules.map(i => i.code).join('\n')
  const code5 = log.moduleCode
  const code6 = exportModule.cmd
  const code7 = object2file(exportModule.data)

  const fileContent = (`${code1}\n${code2}\n${code3}\n${code4}\n${code5}\n${code6}\n${code7}\n`)
  return {
    path: `${prevPath}/index.js`,
    content: fileContent
  }
}

function buildAndInsertLog (exportModule) {
  const log = {
    moduleVar: 'approveLogViewer',
    moduleCode: `const approveLogViewer = { component: 'PPApproveLog', title: '操作日志', mode: 'readonly', show: true }\n`
  }
  const nodes = Object.keys(exportModule.data)
  nodes.forEach((node) => {
    const { dispermission, permission } = exportModule['data'][node]['panels']
    permission.push(stringMark.noQuotation(log.moduleVar))
    dispermission.push(stringMark.noQuotation(log.moduleVar))
  })
  return log
}

function buildExportsModules (tab, permissionModules, dispermissionModules) {
  const nodes = Object.keys(tab)
  const exportModule = {
    cmd: `export default `,
    data: {}
  }
  nodes.forEach((node) => {
    exportModule['data'][node] = { panels: { dispermission: [], permission: [] } }
    const { dispermission, permission } = exportModule['data'][node]['panels']
    const { dispermission: dataDispermission, permission: dataPermission } = tab[node]['panels']
    dataDispermission.forEach((panel) => {
      const module = dispermissionModules.find(i => i.title === panel.title)
      if (module) {
        dispermission.push(stringMark.noQuotation(module.var))
      }
    })
    dataPermission.forEach((panel) => {
      const module = permissionModules.find(i => i.title === panel.title)
      // “结束节点”不需要【审批操作】模块
      if (module || (node === 'end' && module.var !== 'operationRender')) {
        permission.push(stringMark.noQuotation(module.var))
      }
    })
  })
  return exportModule
}

function buildLoadsAndModules (uniPanels) {
  const permission = {
    loads: [],
    modules: []
  }
  const dispermission = {
    loads: [],
    modules: []
  }
  uniPanels.permission.forEach((panel, index) => {
    const pIndex = index + 1
    // 单独处理【审批操作】
    if (panel.component === 'ApprovalOperation') {
      permission.loads.push({
        path: `'./permission/operation'`,
        var: `operation`,
        code: `import operation from './permission/operation'\n`
      })
      permission.modules.push({
        title: panel.title,
        var: `operationRender`,
        code: `const operationRender = { component: 'ApprovalOperation', title: '审批操作', mode: 'edit', show: true, operationItem: operation }\n`
      })
    } else {
      const load = {
        path: `'./permission/panel${pIndex}'`,
        var: `panel${pIndex}Edit`,
        code: `import panel${pIndex}Edit from './permission/panel${pIndex}'\n`
      }
      const module = {
        title: panel.title,
        var: `panel${pIndex}EditRender`,
        code: `const panel${pIndex}EditRender = { component: '${panel.component}', title: '${panel.title}', mode: '${panel.mode}', show: ${panel.show}, formItems: ${load.var} }\n`
      }
      permission.loads.push(load)
      permission.modules.push(module)
    }
  })

  uniPanels.dispermission.forEach((panel, index) => {
    const pIndex = index + 1
    const load = {
      path: `'./permission/panel${pIndex}'`,
      var: `panel${pIndex}Read`,
      code: `import panel${pIndex}Read from './dispermission/panel${pIndex}'\n`
    }
    const module = {
      title: panel.title,
      var: `panel${pIndex}ReadRender`,
      code: `const panel${pIndex}ReadRender = { component: '${panel.component}', title: '${panel.title}', mode: '${panel.mode}', show: ${panel.show}, formItems: ${load.var} }\n`
    }
    dispermission.loads.push(load)
    dispermission.modules.push(module)
  })

  return {
    permission,
    dispermission
  }
}

function buildTabLoadFile (prevPath, tabsTree) {
  let importCmd = ''
  let exportCmd = 'export default {'
  const tabIndexs = Object.keys(tabsTree)
  tabIndexs.forEach((tabIndex) => {
    const varTab = 'tab' + (tabIndex * 1 + 1)
    importCmd += `import ${varTab} from './${varTab}'\n`
    exportCmd += `${tabIndex * 1}: ${varTab}\n`
  })
  exportCmd += '}'
  return {
    path: `${prevPath}/index.js`,
    content: `${importCmd}\n${exportCmd}`
  }
}
