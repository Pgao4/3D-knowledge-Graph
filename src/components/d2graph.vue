<template>
  <div>
    <div id="mode">
      <div class="gState" style="margin-bottom: 20px;">
      </div>
      <p class="font-sky" style="text-align: left;">
        <strong>Number of nodes:{{ nodes.length }}</strong>
        <br>
        <strong>Number of relationships:{{ links.length }}</strong>
        <br>
        <strong>Average degree:{{ gDegree }}</strong>
        <br>
        <strong>Graph density:{{ gDensity }}</strong>
        <br>
        <strong>Sparsity:{{ gSparsity }}</strong>
      </p>
    </div>
    <svg
      id="svg"
      width="1200"
      height="750"
    ></svg>
    <div id="indicator">
      <div v-for="(name, index) in names" :key="index">
        <span
          @click="hideNodeOfType"
          :data-state="states[index]"
          :data-index="index"
          style="cursor: pointer;"
          :style="{ backgroundColor: states[index] === 'on' ? colors[index] : '#aaa' }"
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
import * as d3 from 'd3'
import install from '@/plugins/d3-context-menu'
install(d3)
export default {
  name: 'd3graph',
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
  data () {
    return {
      svgDom: null, 
      keywords: '',
      nodeState: 0,
      textState: 0,
      nodes: [],
      links: [],
      /* eslint-disable */
      colors: ['#FFE4B5', '#aaaaff', '#4e88af', '#ca635f','#FFC0CB', '#BA55D3', '#1E90FF', '#7FFFD4','#FFFF00'],
      states: [],
      selectNodeData: {}, 
      isNodeClicked: false, 
      temp: {}, 
      dialogFormVisible: false,
      nodeObjMap: {
        'name': 'Name',
        'id': 'ID'
      }
    }
  },
  computed: {
    isShowNode: function () {
      return this.nodeState === 0
    },
    isShowText: function () {
      return this.textState === 0
    },
    gDensity () {
      return this.nodes.length <= 1 ? 0 : (this.links.length / (this.nodes.length * (this.nodes.length - 1))).toFixed(2)
    },
    gDegree () {
      return (this.links.length / this.nodes.length).toFixed(2)
    },
    gMainDegree () {
    },
    gSparsity () {
      return (this.links.length / (this.nodes.length * Math.log(this.nodes.length))).toFixed(10)
    }
  },
  watch: {
    data (newData, oldData) {
      console.log(newData, oldData)
      this.svgDom.on('.', null)
      this.svgDom.selectAll('*').on('.', null)
      this.d3init()
    }
  },
  created () {
  },
  mounted () {
    this.d3init()
  },
  beforeDestroy () {
    this.svgDom.on('.', null)
    this.svgDom.selectAll('*').on('.', null)
  },
  methods: {
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
      this.d3init()
      this.$message({
        message: 'update successfully',
        type: 'success'
      })
    },
    cancelEdit () {
      this.dialogFormVisible = false
    },
    // Hide test
    changeTextState (state) {
      // When state changes, do update
      if (this.textState !== state) {
        this.textState = state
        const text = d3.selectAll('.linkTexts text')
        console.log(text)
        // show different text information following new node status
        if (this.textState === 2) {
          text.style('display', 'none')
        } else {
          text.style('display', 'block')
        }
      }
    },
    
    hideNodeOfType (event) {
      if (this.nodes.length === this.data.nodes.length 
        || this.states.some((state) => state === 'off')) {
        const index = event.target.dataset.index
        const state = event.target.dataset.state
        if (state === 'on') {
          this.$set(this.states, index, 'off')
        } else {
          this.$set(this.states, index, 'on')
        }
        /**************************************
         * Update data after updating status
         */
        const indexs = this.states.map(s => {
          if (s === 'on') {
            return '1'
          } else {
            return '0'
          }
        })
        this.nodes = this.data.nodes.filter(node => {
          for (let i = 0; i < indexs.length; i++) {
            if (node.label === this.labels[i] && indexs[i] === '0') return false
          }
          return true
        })
        this.links = this.data.links.filter(link => {
          for (let i = 0; i < indexs.length; i++) {
            if (i === 0 && indexs[i] === '0') return false
            else if (link.type === this.linkTypes[i] && indexs[i] === '0') return false
          }
          return true
        })
        this.d3render()
      } else {
        this.$message.error('Hide graph after displaying all nodes')
      }
    },
    // d3 initial
    d3init () {
      this.links = this.data.links
      this.nodes = this.data.nodes
      this.svgDom = d3.select('#svg')  // get DOM from svg
      this.d3render()
      this.stateInit()
    },
    stateInit () {
      this.nodeState = 0
      this.textState = 0
      this.states = Array(this.names.length).fill('on')
    },
    d3render () {
      var _this = this 

      // clear all elements of svg before rendering
      _this.svgDom.selectAll('*').remove()

      var svg = _this.svgDom
        .on('click', () => { 
          this.isNodeClicked = false
          // remove all styles
          this.clearGraphStyle()
          if(this.keywords !== '') {
            this.searchKeyWords()
          }
        })
        // translation and zoom
        .call(d3.zoom().on('zoom', event => {
          var scale = event.transform.k,
              translate = [event.transform.x, event.transform.y]
          svg.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
        }))
        .append('g')
        .attr('width', '100%')
        .attr('height', '100%')
        
      this.addMarkers()
      // define collision detection model
      var forceCollide = d3.forceCollide()
        .radius(d => { return 16 * 3 })
        .iterations(0.15)
        .strength(0.75)

      // Define relationship by using d3.forceSimulation()
      var simulation = d3.forceSimulation(this.nodes)
        .force("link", d3.forceLink().id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(svg.node().parentElement.clientWidth / 2, svg.node().parentElement.clientHeight / 2))
        .force("collision", forceCollide)
      
      // D3 map data into HTML
      //g:draw all lines; selectALL: select all lines, and bind data.
      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(this.links).enter()
        .append("line")
        .attr("stroke-width", function(d) {
          return 2 //width of all lines is 2
        })
        .join("path")
        .attr("marker-end", "url(#posMarker)")
      
      var linksName = svg.append("g")
        .attr("class", "linkTexts")
        .selectAll("text")
        .data(this.links)
        .join("text")
        .style('text-anchor','middle')
        .style('fill', '#000')
        .style('font-size', '12px')
        .text(d => d.properties.name)

      var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(this.nodes).enter()
        .append("circle").attr("r", function(d) {
          let size = 16
          switch(d.label){
            case _this.labels[0]: break;
            case _this.labels[1]: size = 14; break;
            case _this.labels[2]: size = 13; break;
            default: size = 13; break;
          }
          return size * 2
        })
        .attr("fill", d => {
          for (let i = 0;i < this.labels.length;i++) {
            if (d.label === this.labels[i]) return this.colors[i]
          }
        })
        .attr("stroke", "none")
        .attr("name", d => d.properties.name)
        .attr("id", d => d.id)
        .call(this.drag(simulation))
        .on("click", nodeClick)
        .on('mouseenter', function (event) {
          const node = d3.select(this)
          //obtain selected elements
          let name = node.attr("name")
          let id = node.attr("id")
          let color = node.attr('fill')
          //set info
          _this.$set(_this.selectNodeData, 'id', id)
          _this.$set(_this.selectNodeData, 'name', name)
          _this.$set(_this.selectNodeData, 'color', color)
          
          //iterate for the attribute of id
          for (let item of _this.nodes) {
            if (item.id == id) {
              _this.$set(_this.selectNodeData, 'properties', item.properties)
            }
          }
          //iterate nodes and adjust the graph style
          _this.changeGraphStyle(name)
        })
        .on('mouseleave', event => {
          console.log(this.isNodeClicked)
          if (!this.isNodeClicked) {
            this.clearGraphStyle()
            if(this.keywords !== '') {
              this.searchKeyWords()
            }
          }
        })
        .on('contextmenu', d3.contextMenu(this.menu))
      // Set the format of text
      var text = svg.append("g")
        .attr("class", "texts")
        .selectAll("text")
        .data(this.nodes)
        .enter()
        .append("text").attr("font-size", () => 14)
        .attr("fill", () => '#000000')
        .attr('name', d => d.properties.name)
        .attr("text-anchor", "middle")
        .attr('x', function (d) {
          return textBreaking(d3.select(this), d.properties.name)
        })
        .call(this.drag(simulation))
        .on("click", nodeClick)
        .on('mouseenter', function (event) {
          const text = d3.select(this)
          let name = text.attr("name")
          _this.$set(_this.selectNodeData, 'name', name)
          
          //obtain id accoding to text name
          for (let item of _this.nodes) {
            if (item.properties.name == name) {
              // set node id and label properties
              _this.$set(_this.selectNodeData, 'id', item.id)
              _this.$set(_this.selectNodeData, 'properties', item.properties)
              // obtain node color according to label
              let index = 0
              switch (item.label) {
                case _this.labels[0]: break;
                case _this.labels[1]: index = 1;break;
                case _this.labels[2]: index = 2;break;
                default: index = 3;break;
              }
              _this.$set(_this.selectNodeData, 'color', _this.colors[index])
            }
          }
          _this.changeGraphStyle(name)
        })
        .on('mouseleave', (event) => {
          if(!this.isNodeClicked) {
            this.clearGraphStyle()
            if(this.keywords !== '') {
              this.searchKeyWords()
            }
          }
        })
        .on('contextmenu', d3.contextMenu(this.menu))
          
      node.append("title").text(d => d.properties.name)
      
      //ticked data init and generate graph
      simulation.on("tick", ticked)
        
      simulation.force("link")
        .links(this.links)
        .distance(d => { // length of each line
          let distance = 20
          switch(d.source.label) {
            case _this.labels[0]: distance += 30;break;
            case _this.labels[1]: distance += 25;break;
            case _this.labels[2]: distance += 22;break;
            default: distance += 20;break; 
          }
          switch(d.target.label) {
            case _this.labels[0]: distance += 30;break;
            case _this.labels[1]: distance += 25;break;
            case _this.labels[2]: distance += 22;break;
            default: distance += 20;break; 
          }
          return distance * 2
        })
      
      /****************************************** 
       * Internal functions
       * Include：ticked、text partition, node-click and text click event
       */
      // ticked(): determine the start point of x,y; node: center point
      function ticked() {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y)
    
        linksName
          .attr('transform', d => {
            let x = Math.min(d.source.x, d.target.x) + Math.abs(d.source.x - d.target.x) / 2
            let y = Math.min(d.source.y, d.target.y) + Math.abs(d.source.y - d.target.y) / 2 - 1
            let tanA = Math.abs(d.source.y - d.target.y) / Math.abs(d.source.x - d.target.x)
            let angle = Math.atan(tanA) / Math.PI * 180
            // first,second quadrant process
            if (d.source.x > d.target.x) {
              // second quadrant
              if (d.source.y <= d.target.y) {
                angle = -angle
              }
            } else if (d.source.y > d.target.y) {
              // first quadrant
              angle = -angle
            }
            return 'translate(' + x + ',' + y + ')' + 'rotate(' + angle + ')'
          })

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
    
        text.attr('transform', function(d) {
          let size = 15
          switch(d.label){
            case _this.labels[0]: break;
            case _this.labels[1]: size = 14;break;
            case _this.labels[2]: size = 13;break;
            default: size = 12;break;
          }
          size -= 5
          return 'translate(' + (d.x - size / 2 + 3) + ',' + (d.y + size / 2) + ')'
        })
      }
      
      /**
       * Text partition
       * @method textBreaking
       * @param {d3text} DOM object
       * @param {text} text value of node
       * @return {void}
       */
      function textBreaking(d3text, text) {
        const len = text.length
        if (len <= 3) {
          d3text.append('tspan')
            .attr('x', 0)
            .attr('y', 2)
            .text(text)
        } else {
          const topText = text.substring(0, 3)
          const midText = text.substring(3, 7)
          let botText = text.substring(7, len)
          let topY = -16
          let midY = 0
          let botY = 16
          if (len <= 7) {
            topY += 10
            midY += 10
          } else if (len > 10){
            botText = text.substring(7, 9) + '...'
          }
  
          d3text.text('')
          d3text.append('tspan')
            .attr('x', 0)
            .attr('y', topY)
            .text(function () {
              return topText
            })
          d3text.append('tspan')
            .attr('x', 0)
            .attr('y', midY)
            .text(function () {
              return midText
            })
          d3text.append('tspan')
            .attr('x', 0)
            .attr('y', botY)
            .text(function () {
              return botText
            })
        }
      }
      // define node-click and text-click event seperately
      // Optimization: only need to define one click event. 
      // we can get node information by this.selectNodeData
      function nodeClick(event, d) {
        // get node information direcly by this.selectNodeData
        event.cancelBubble = true
        event.stopPropagation() // stop propogation
        
        const name = _this.selectNodeData.name
        _this.isNodeClicked = true
        _this.changeGraphStyle(name)

        return false
      }
    },
    // change graph style by current node name
    changeGraphStyle (name) {
      // choose all circle in svg1.nodes and add class
      this.svgDom.select('.nodes').selectAll('circle').attr('class', d => {
        // if node properties name is equal to name, return fixed
        if(d.properties.name == name) {
          return 'fixed'
        }
        else {
          // check the start point of links
          // Note: graph = data
          for (var i = 0; i < this.links.length; i++) {
            // if start point of links is equal to name 
            //and end point is equal to name which is being processed, display
            if (this.links[i]['source'].properties.name == name && this.links[i]['target'].id == d.id) {
                return 'active'
            }
            if (this.links[i]['target'].properties.name == name && this.links[i]['source'].id == d.id) {
                return 'active'
            }
          }
          return this.isNodeClicked ? 'inactive' : ''
        }
      })
      // determine where hide adjacent text
      this.svgDom.select('.texts').selectAll('text')
        .attr('class', d => {
          if(d.properties.name == name) {
            return ''
          }
          else {
            for (var i = 0; i < this.links.length; i++) {
              if (this.links[i]['source'].properties.name == name && this.links[i]['target'].id == d.id) {
                  return ''
              }
              if (this.links[i]['target'].properties.name == name && this.links[i]['source'].id == d.id) {
                  return ''
              }
            }
            return this.isNodeClicked ? 'inactive' : ''
          }
        })
      // determine whether hide adjacent line
      this.svgDom.select(".links").selectAll('line')
        .attr('class', d => {
          if (d.source.properties.name == name || d.target.properties.name == name) {
              return 'active'
          } else {
              return this.isNodeClicked ? 'inactive' : ''
          }
        })
        .attr('marker-end', d => {
          if (d.source.properties.name == name || d.target.properties.name == name) {
            return 'url(#posActMarker)'
          } else {
            return 'url(#posMarker)'
          }
        })
      // determine whether hide text on line 
      this.svgDom.select(".linkTexts").selectAll('text')
        .attr('class', d => {
          if (d.source.properties.name == name || d.target.properties.name == name) {
              return 'active'
          } else {
              return this.isNodeClicked ? 'inactive' : ''
          }
        })
    },
    clearGraphStyle () {
      // remove all style
      this.svgDom.select('.nodes').selectAll('circle').attr('class', '')
      this.svgDom.select(".texts").selectAll('text').attr('class', '')
      this.svgDom.select('.links').selectAll('line').attr('class', '').attr('marker-end', 'url(#posMarker)')
      this.svgDom.select(".linkTexts").selectAll('text').attr('class', '')
    },
    drag(simulation) {
      function dragsubject(event) {
        return simulation.find(event.x, event.y);
      }

      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
      }
      
      return d3.drag()
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    },
    // draw arrows of relationship
    addMarkers() {
      var defs = this.svgDom.append("defs")
      const posMarker = defs.append("marker")
        .attr("id", "posMarker")
        .attr("orient", "auto")
        .attr("stroke-width", 2)
        .attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 31)
        .attr("refY", 0)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M 0 -5 L 10 0 L 0 5")
        .attr('fill', '#e0cac1')
        .attr("stroke-opacity", 0.6);
      const posActMarker = defs.append("marker")
        .attr("id", "posActMarker")
        .attr("orient", "auto")
        .attr("stroke-width", 2)
        .attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 31)
        .attr("refY", 0)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M 0 -5 L 10 0 L 0 5")
        .attr('fill', '#1E90FF')
        .attr("stroke-opacity", 0.6);
    }
  }
}
</script>

<style lang="scss">
// @import '@/plugins/d3-context-menu';
$opacity: 0.15;
$activeColor: #1E90FF;  
svg {
  margin: 20px 0px;
}
.links line {
  stroke: #e0cac1b2; 
  stroke-opacity: 1;
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
  &.active {
    stroke: $activeColor;
    stroke-width: 3px;
  }
  &.hide {
    display: none !important;
  }
}
.nodes circle {
  &.fixed {
    // fill: rgb(102, 81, 81);
    stroke: #FFC0CB;  // #888;
    stroke-width: 14px;
    stroke-opacity: $opacity + 0.3;
    border: 10px #000 solid;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
  &.active {
    stroke: $activeColor;
    stroke-width: 4px;
  }
  &:hover {
    cursor: pointer;
  }
  &.hide {
    display: none !important;
  }
}
.texts text {
  cursor: pointer;
  text-decoration: none;
  user-select: none;
  &:hover {
    cursor: pointer;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
}
.linkTexts text {
  stroke: #ecddd8b2; // #bbb
  stroke-opacity: 1;
  &.active {
    stroke: $activeColor;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
}
</style>
<style lang="scss" scoped>
@media only screen and (max-width: 1125px){
  #info, #mode {
    display: none !important;
  }
}
.font-sky {
  font-size: 18px;
  color: #034c6a !important;
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
/*mode style*/
#mode {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  top: 200px;
  left: 40px;
  .gState span {
    display: inline-block;
    border: 1px solid #000;
    color: #000;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 14px;
    transition: color, background-color .3s;
    -o-transition: color, background-color .3s;
    -ms-transition: color, background-color .3s;
    -moz-transition: color, background-color .3s;
    -webkit-transition: color, background-color .3s;
    ~ .active, ~ :hover {
      background-color: #fff;
      color: #333;
      cursor: pointer;
    }
  }
  .gState span.active, .gState span:hover {
    background-color: #fff;
    color: #333;
    cursor: pointer;
  }
}
/*suspended node info style*/
#info {
  position: absolute;
  bottom: 40px;
  right: 30px;
  width: 270px;
  .node-card {
    border: 1px solid #9faecf;
    background-color: #00aeff6b;
    color: #000;
    text-align: left;
    .el-card__header {
      border-bottom: 1px solid #50596d;
    }
  }
}
</style>
