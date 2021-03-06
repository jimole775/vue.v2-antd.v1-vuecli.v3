const fs = require('fs')
const path = require('path')
const rmDir = require('./rmDir')
const getPathSeparator = require('./getPathSeparator')
/**
 * 删除目录的相邻目录【慎用】
 * @param { String } asbFilePath 绝对路径
 * @return { undefined }
 */
module.exports = function rmSiblingDir (asbFilePath) {
  const pathMark = getPathSeparator(asbFilePath)
  const pathArrs = asbFilePath.split(pathMark)
  const targetFlodar = pathArrs.pop()
  const parentDir = pathArrs.join(pathMark)
  const curLevelFlodars = fs.readdirSync(parentDir)
  const sibilingFlodars = curLevelFlodars.filter(dir => dir !== targetFlodar)
  sibilingFlodars.forEach(sibFlodar => rmDir(path.join(parentDir, sibFlodar)))
}
