<template>
  <div>
    <div id="3d-graph" class="three-graph">
    </div>
    <!-- draw -->
    <div id="indicator">
      <div v-for="(name, index) in names" :key="index">
        <span
          :data-state="states[index]"
          :data-index="index"
          :style="{ backgroundColor: states[index] === 'on' ? nodeColors[index] : '#aaa' }"
        ></span>
        {{ name }}
      </div>
    </div>
    <!-- Draw the result on the right -->
    <div id="info" v-show="selectNodeData.name !== undefined">
      <el-card
        :style="{ backgroundColor: selectNodeData.color }"
        class="node-card"
      >
        <div slot="header" class="clearfix">
          <span>{{ selectNodeData.name }}</span>
        </div>
        <div
          v-for="(item, key) in selectNodeData.properties" :key="item"
        >
          <span style="margin-right: 8px;">{{ (nodeObjMap[key] ? nodeObjMap[key] : key) + ':' }}</span>
          <span style="text-align: right;"><b>{{ item }}</b></span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import ForceGraph3D from '3d-force-graph'
import SpriteText from 'three-spritetext'
export default {
  name: 'threeGraph',
  props: {
    data: {
      type: Object,
      default: function () {
        return {
          nodes: [],
          links: []
        }
      }
    },
    /* eslint-disable */
    names: {
      type: Array
    },
    labels: Array,
    linkTypes: Array
  },
  mounted () {
    this.threeInit()
  },
  data () {
    return {
      // ForceGraph3D object，call globally and update actively
      Graph: {},
      // threeRender(): display data on webpage）
      nodes: [],
      links: [],
      states: [],
      nodeColors: ['#55cccc', '#aaaaff', '#4e88af', '#ca635f','#FFC0CB', '#BA55D3', '#1E90FF', '#7FFFD4','#FFFF00'],
      selectNodeData: {}, 
      temp: {}, 
      dialogFormVisible: false,
      isEdit: true,
      nodeObjMap: {
        'sex': 'Sex',
        'degree': 'Degree',
        'Label': 'Label',
        'agegroup': 'AgeGroup',
        'name': 'ID',
        'affected': 'Affected',
        'age': 'Age'
      }
    }
  },
  watch: {
    data (newData, oldData) {
      console.log(newData, oldData)
      this.threeInit()
    }
  },
  methods: {
    // update view
    update () {
      this.graph = require('../data/records.json')
      this.neoJsonParser(this.graph)
      document.getElementById('3d-graph').innerHTML = ''
      this.threeRender()
    },
    btnEdit () {
      this.temp = Object.assign({}, this.selectNodeData.properties) // copy obj
      this.dialogFormVisible = true
      console.log(this.selectNodeData)
    },
    doEdit () {
      let i = 0
      // update props data and selectNodeData
      this.selectNodeData.name = this.temp.name
      this.selectNodeData.properties = this.temp
      for (let node of this.data.nodes) {
        if (node.id == this.selectNodeData.id) {
          this.data.nodes[i].properties = this.temp
          this.nodes[i].properties = this.temp
          break
        }
        i++
      }
      this.dialogFormVisible = false
      this.threeInit()
      this.$message({
        message: 'Update successfully',
        type: 'success'
      })
    },
    cancelEdit () {
      this.dialogFormVisible = false
    },
    // d3 initial
    threeInit () {
      this.links = this.data.links
      this.nodes = this.data.nodes
      this.threeRender()
      // data state initial
      this.stateInit()
    },
    stateInit () {
      this.states = Array(this.names.length).fill('on')
    },
    threeRender () {
      // DOM initial
      const elm = document.getElementById('3d-graph')
      this.Graph = ForceGraph3D()(elm)
        .graphData(this.data)
      this.Graph.height(750).width(1200)
        .backgroundColor('#9dadc1')
        .nodeRelSize(7)
        .nodeColor(node => {
          let index = 0
          switch(node.label) {
            case this.labels[2]: index=2; break;
            case this.labels[1]: index=1; break;
            case this.labels[0]: break;
            default: index=3; break;
          }
          return this.nodeColors[index]
        })
        .nodeThreeObject(node => {
          const sprite = new SpriteText(node.properties.name)
          sprite.material.depthWrite = false // make sprite background transparent
          let i = 0;
          for(;i<this.labels.length;i++) 
            if(node.label === this.labels[i]) break;
          sprite.color = this.nodeColors[i]
          sprite.textHeight = 8
          return sprite
        })
        .nodeThreeObjectExtend(true)
        .nodeLabel(node => `${node.label}: ${node.properties.name}`)
        .nodeOpacity(0.75)
        // ADD relation
        .linkThreeObjectExtend(true)
        .linkThreeObject(link => {
          // extend link with text sprite
          const sprite = new SpriteText(`from ${link.source} to ${link.target}`);
          sprite.color = 'grey';
          sprite.textHeight = 2;
          return sprite;
        })
        .linkPositionUpdate((sprite, { start, end }) => {
          const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
            [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
          })));

          // Position sprite
          Object.assign(sprite.position, middlePos);
        })
        .onNodeHover(node => elm.style.cursor = node ? 'pointer' : null)
        .onNodeClick(node => {
          this.$set(this.selectNodeData, 'id', node.id)
          this.$set(this.selectNodeData, 'name', node.properties.name)
          let i = 0
          for (;i < this.labels.length;i++) {
            if (node.label === this.labels[i]) break
          }
          this.$set(this.selectNodeData, 'color', this.nodeColors[i])
          this.$set(this.selectNodeData, 'properties', node.properties)
        })
      this.Graph.d3Force('charge').strength(-300)
    },
    threeUpdate (data) {
      this.Graph.graphData({
        data
      })
    },
    createRandomGraph (N = 300) {
      return {
        nodes: [...Array(N).keys()].map(i => ({ id: i })),
        links: [...Array(N).keys()]
          .filter(id => id)
          .map(id => ({
            source: id,
            target: Math.round(Math.random() * (id - 1))
          }))
      }
    }
  },
}
</script>

<style lang="scss" scoped>
@media only screen and (max-width: 1200px){
  #info, #indicator {
    display: none !important;
  }
}
.three-graph {
  width: 1200px;
  height: 750px;
  margin: 20px 0px;
}
// indicator on the bottom left
#indicator {
  position: absolute;
  left: 3vw;
  bottom: 2vw;
  text-align: left;
  color: #f2f2f2;
  font-size: 20px;
  font-weight: bold;
  & > div {
    margin-bottom: 4px;
  }
  span {
    display: inline-block;
    width: 32px;
    height: 16px;
    position: relative;
    top: 2px;
    margin-right: 8px;
  }
}
#info {
  position: absolute;
  bottom: 40px;
  right: 30px;
  width: 270px;
  .node-card {
    border: 1px solid #9faecf;
    background-color: #00aeff9f;
    color: #000;
    text-align: left;
    .el-card__header {
      border-bottom: 1px solid #50596d;
    }
  }
}
</style>
