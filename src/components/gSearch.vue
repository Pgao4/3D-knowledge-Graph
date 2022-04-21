<template>
  <div style="margin-top: 20px;width: 500px;">
  </div>
</template>

<script>
export default {
  name: 'gSearch',
  data () {
    return {
      input: '',
      mode: '1',
      data: require('../data/records.json'),
      results: []
    }
  },
  mounted () {
    this.$emit('getData', this.data)
    this.results = this.loadAll()
  }
}
</script>

<style lang='scss' scoped>
.el-select {
  width: 120px;
  // background-color: #fff;
}
.input-with-select .el-input-group__prepend {
  background-color: #6ecbf3;
}
</style>
