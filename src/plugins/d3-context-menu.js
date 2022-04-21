let _d3 = null
function install (d3) {
  _d3 = d3
  _d3.contextMenu = contextMenu
}
const contextMenu = function (menu, openCallback) {
}

export default install
