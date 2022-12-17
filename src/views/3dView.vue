<template>
  <div class="gContainer">
    <gSearch @getData="update" />
    <threeGraph
      :data="data"
      :names="names"
      :labels="labels"
      :linkTypes="linkTypes"
    />
  </div>
</template>

<script>
import gSearch from '@/components/gSearch.vue'
import threeGraph from '@/components/d3graph.vue'

export default {
  name: 'threeView',
  components: {
    gSearch,
    threeGraph
  },
  data () {
    return {
      // d3jsonParser(): return results after processing JSON
      data: {
        nodes: [],
        links: []
      },
      names: ['Role'],
      labels: ['role'],
      linkTypes: ['']
    }
  },
  methods: {
    // update view
    update (json) {
      console.log('update')
      console.log(json)
      this.d3jsonParser(json)
    },
    /*eslint-disable*/
    // parse json data 
    d3jsonParser (json) {
      const nodes =[]
      const links = [] // // store node and relation
      const nodeSet = [] // store id after removing duplicated nodes

      for (let item of json) {
        for (let segment of item.p.segments) {
          // change data style
          if (nodeSet.indexOf(segment.start.identity) == -1) {
            nodeSet.push(segment.start.identity)
            nodes.push({
              id: segment.start.identity,
              label: segment.start.labels[0],
              properties: segment.start.properties
            })
          }
          if (nodeSet.indexOf(segment.end.identity) == -1) {
            nodeSet.push(segment.end.identity)
            nodes.push({
              id: segment.end.identity,
              label: segment.end.labels[0],
              properties: segment.end.properties
            })
          }
          links.push({
            source: segment.relationship.start,
            target: segment.relationship.end,
            properties: segment.relationship.properties
          })
        }
      }
      console.log(nodes)
      console.log(links)
      this.data = { nodes, links }
    }
  }
}
</script>

<style lang="scss" scoped>
.gContainer {
  position: relative;
  border: 2px #000 solid;
  background-color: #9dadc1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>
