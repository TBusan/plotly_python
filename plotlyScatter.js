import * as d3 from 'd3'
import Plotly from 'plotly.js-dist-min'

const defaultColorscale = [
  [0.00, 'rgb(0,0,255)'], // 深蓝色
  [0.05, 'rgb(0,64,255)'], // 蓝色
  [0.10, 'rgb(0,128,255)'], // 浅蓝色
  [0.15, 'rgb(0,191,255)'], // 天蓝色
  [0.20, 'rgb(0,255,255)'], // 青色
  [0.25, 'rgb(0,255,191)'], // 青绿色
  [0.30, 'rgb(0,255,128)'], // 浅青绿色
  [0.35, 'rgb(0,255,64)'], // 黄绿色
  [0.40, 'rgb(0,255,0)'], // 绿色
  [0.45, 'rgb(64,255,0)'], // 浅绿色
  [0.50, 'rgb(128,255,0)'], // 草绿色
  [0.55, 'rgb(191,255,0)'], // 黄绿色
  [0.60, 'rgb(255,255,0)'], // 黄色
  [0.65, 'rgb(255,223,0)'], // 金黄色
  [0.70, 'rgb(255,191,0)'], // 橙黄色
  [0.75, 'rgb(255,159,0)'], // 橙色
  [0.80, 'rgb(255,128,0)'], // 深橙色
  [0.85, 'rgb(255,64,0)'], // 红橙色
  [0.90, 'rgb(255,32,0)'], // 橘红色
  [1.00, 'rgb(255,0,0)'], // 红色
]

export class PlotlyScatterChart {
  constructor(container) {
    this.container = container // DOM容器
    this.chart = null // Plotly图表实例
    this.data = [] // 数据
    this.layout = {} // 布局配置
    this.config = { // 图表配置
      responsive: true, // 响应式
      displayModeBar: false, // 显示模式栏
      scrollZoom: true, // 允许滚轮缩放
      modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'resetScale2d'],
    }
    this.isSelectMode = false // 添加选择模式状态标记
    this.isPropertyViewMode = false // 添加属性查看模式状态标记
    this.selectedPoints = new Set() // 存储被选中的点
    this.hiddenPoints = new Set() // 存储被隐藏的点
    this.pointIds = [] // 存储所有点的 id
    this.extendedData = [] // 存储扩展属性
  }

  /**
   * 初始化散点图
   * @param {object} options 配置选项
   * @param {object} options.data 数据对象 {x: [], y: [], v: [], visible: [], id: []}
   * @param {object} options.style 样式配置
   * @param {object} options.layout 布局配置
   */
  init(options = {}) {
    const {
      data = {},
      style = {},
      layout = {},
    } = options

    // 保存点的 id 和扩展属性
    this.pointIds = data.id || []
    this.extendedData = data.a?.map((_, i) => ({
      a: data.a[i],
      b: data.b[i],
      m: data.m[i],
      n: data.n[i],
      row: data.row[i],
      pseu: data.pseu[i],
    })) || []

    // 根据 visible 数组初始化点的不透明度
    const opacities = data.visible.map((v) => v === 1 ? 0 : 1)

    // 初始化隐藏点集合
    data.visible.forEach((v, index) => {
      if (v === 1) {
        this.hiddenPoints.add(index)
      }
    })

    // const colorscaleLen = style?.colorscale?.length || defaultColorscale.length
    // console.log('style?.colorscale', style?.colorscale)
    // 处理数据
    this.data = [{
      x: data.x,
      y: data.y,
      type: 'scatter',
      mode: style.mode || 'markers',
      zmin: data?.zmin, // 0,
      zmax: data?.zmax, // 200,
      customdata: this.extendedData, // 存储扩展属性
      hovertemplate: `
  X: %{x}<br>
  Y: %{y}<br>
  Value: %{marker.color}<br>
  a: %{customdata.a}<br>
  b: %{customdata.b}
  <extra></extra> 
`,
      marker: {
        size: style.markerSize || 7,
        color: data.v,
        colorscale: style?.colorscale,
        symbol: 'square',
        opacity: opacities, // 设置初始不透明度
        line: {
          color: Array.from({ length: data.x.length }).fill('white'),
          width: Array.from({ length: data.x.length }).fill(1),
        },
        // colorbar: {
        //   tickmode: 'array',
        //   tickvals: Array.from({ length: colorscaleLen }, (_, i) =>
        //     data?.zmin + (data?.zmax - data?.zmin) * (i / (colorscaleLen - 1))),
        //   ticktext: Array.from({ length: colorscaleLen }, (_, i) =>
        //     Math.round(data?.zmin + (data?.zmax - data?.zmin) * (i / (colorscaleLen - 1)))),
        //   ticks: 'outside', // 刻度线显示在外侧
        //   ticklen: 5, // 刻度线长度
        //   tickwidth: 1, // 刻度线宽度
        //   showticklabels: true, // 显示刻度标签
        //   tickcolor: '#000', // 刻度线颜色
        //   len: 1, // colorbar 长度比例
        //   thickness: 20, // colorbar 宽度（像素）
        // },
      },
      showscale: false,
    }]

    // 默认布局
    this.layout = {
      title: layout.title || '',
      showlegend: false,
      hovermode: 'closest',
      dragmode: 'pan',
      xaxis: {
        // title: layout.xAxisTitle || '',
        showgrid: true,
        zeroline: true,
        autorange: true,
        showline: true,
        // scaleanchor: 'y', // 锁定x轴和y轴的比例
        // scaleratio: 1, // 设置比例为1:1
        side: 'top',
        // autorange: 'reversed',
        // scaleanchor: 'y',
        // constrain: 'domain',
        // constraintoward: 'center'
      },
      yaxis: {
        title: layout.yAxisTitle || '',
        showgrid: true,
        zeroline: true,
        autorange: 'reversed',
        showline: true,
        // scaleanchor: 'x', // 锁定x轴和y轴的比例
        // scaleratio: 1, // 设置比例为1:1
        // scaleanchor: 'x',
        // constrain: 'domain',
        // constraintoward: 'center'

      },
      margin: { t: 50, l: 50, r: 50, b: 50 },
      ...layout,
    }

    // 创建图表
    Plotly.newPlot(
      this.container,
      this.data,
      this.layout,
      this.config,
    )

    // 保存图表实例
    this.chart = this.container

    // 绑定事件
    // this.bindEvents();
  }

  /**
   * 更新数据
   * @param {Array} newData 新数据
   */
  updateData(newData) {
    const update = {
      x: [newData.map((point) => point.x)],
      y: [newData.map((point) => point.y)],
      text: [newData.map((point) => point.text)],
    }

    Plotly.restyle(this.container, update)
  }

  /**
   * 更新布局
   * @param {object} newLayout 新布局配置
   */
  updateLayout(newLayout) {
    Plotly.relayout(this.container, newLayout)
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    this.chart.on('plotly_click', (data) => {
      if (this.onPointClick) {
        const point = data.points[0]
        this.onPointClick({
          x: point.x,
          y: point.y,
          text: point.text,
          pointIndex: point.pointIndex,
        })
      }
    })

    this.chart.on('plotly_hover', (data) => {
      if (this.onPointHover) {
        const point = data.points[0]
        this.onPointHover({
          x: point.x,
          y: point.y,
          text: point.text,
          pointIndex: point.pointIndex,
        })
      }
    })
  }

  /**
   * 设置点击事件回调
   * @param {Function} callback 回调函数
   * @param {string} [cursorStyle] 鼠标样式
   */
  setPointClickCallback(callback, cursorStyle = 'default') {
    // 设置属性查看模式标记
    this.isPropertyViewMode = true

    // 创建一个样式元素
    const styleEl = document.createElement('style')
    const containerId = this.container.id

    // 添加一个特定于此容器的样式规则
    styleEl.textContent = `
      #${containerId}, 
      #${containerId} .plotly, 
      #${containerId} svg, 
      #${containerId} .plot-container, 
      #${containerId} .draglayer,
      #${containerId} .nsewdrag,
      #${containerId} .pointtext,
      #${containerId} .scatter,
      #${containerId} .scatterlayer {
        cursor: ${cursorStyle} !important;
      }
    `

    // 添加样式到文档头
    document.head.appendChild(styleEl)

    // 保存样式元素引用以便后续移除
    this._cursorStyleElement = styleEl

    this.container.on('plotly_click', (eventData) => {
      if (!eventData.points?.length) return

      const point = eventData.points[0]
      const customData = this.extendedData[point.pointIndex]

      console.warn('点击的点：', customData)

      callback({
        x: point.x,
        y: point.y,
        pointIndex: point.pointIndex,
        ...customData,
      })
    })
  }

  /**
   * 设置悬停事件回调
   * @param {Function} callback 回调函数
   */
  setPointHoverCallback(callback) {
    this.onPointHover = callback
  }

  /**
   * 销毁图表
   */
  destroy() {
    if (this.chart) {
      Plotly.purge(this.container)
      this.chart = null
    }
    console.warn('散点图已销毁')
  }

  /**
   * 调整图表大小
   */
  resize() {
    if (this.chart) {
      Plotly.Plots.resize(this.container)
    }
  }

  /**
   * 进入选择模式
   */
  enterSelectMode() {
    if (this.isSelectMode) return

    this.isSelectMode = true

    // 修改鼠标样式
    this.container.style.cursor = 'crosshair'

    // 更新图表配置，禁用拖拽和缩放
    Plotly.relayout(this.container, {
      dragmode: false,
      selectmode: 'select',
    })
    // 绑定点击事件
    this.container.on('plotly_click', this.handlePointSelect.bind(this))
  }

  /**
   * 退出选择模式
   */
  exitSelectMode() {
    if (!this.isSelectMode) return

    this.isSelectMode = false

    // 恢复鼠标样式
    this.container.style.cursor = 'auto'

    // 恢复图表配置
    Plotly.relayout(this.container, {
      dragmode: 'pan',
      selectmode: false,
    })

    // 移除点击事件
    this.container.removeAllListeners('plotly_click')

    // 清除所有选中状态
    this.clearSelection()
  }

  /**
   * 处理点选择
   * @private
   */
  handlePointSelect(eventData) {
    if (!this.isSelectMode || !eventData.points || !eventData.points.length) return

    const point = eventData.points[0]
    const pointIndex = point.pointIndex
    const customData = point.data.customdata[pointIndex]

    // 更新选中点的集合
    if (this.selectedPoints.has(pointIndex)) {
      this.selectedPoints.delete(pointIndex)
    } else {
      this.selectedPoints.add(pointIndex)
    }

    // 触发回调时传递完整数据
    if (this.onSelectionChange) {
      this.onSelectionChange({
        index: pointIndex,
        x: point.x,
        y: point.y,
        ...customData, // 包含 a,b,m,n,row,pseu 等属性
      })
    }

    this.updatePointStyles()
  }

  /**
   * 更新点的样式
   * @private
   */
  updatePointStyles() {
    // 创建新的边框颜色和宽度数组
    const lineColors = Array.from({ length: this.data[0].x.length }).fill('white')
    const lineWidths = Array.from({ length: this.data[0].x.length }).fill(1)

    // 更新选中点的样式
    this.selectedPoints.forEach((index) => {
      lineColors[index] = 'red'
      lineWidths[index] = 2
    })

    const update = {
      'marker.line': {
        color: lineColors,
        width: lineWidths,
      },
    }

    // 使用 Plotly.restyle 更新样式
    Plotly.restyle(this.container, update, [0])
  }

  /**
   * 清除所有选中状态
   * @private
   */
  clearSelection() {
    this.selectedPoints.clear()
    const update = {
      'marker.line': {
        color: Array.from({ length: this.data[0].x.length }).fill('white'),
        width: Array.from({ length: this.data[0].x.length }).fill(1),
      },
    }
    Plotly.restyle(this.container, update, [0])
  }

  /**
   * 获取选中的点
   * @returns {Array} 选中点的索引数组
   */
  getSelectedPoints() {
    return Array.from(this.selectedPoints)
  }

  /**
   * 设置选择变化的回调函数
   * @param {Function} callback 回调函数
   */
  setSelectionChangeCallback(callback) {
    this.onSelectionChange = callback
  }

  /**
   * 隐藏选中的点
   */
  hideSelectedPoints() {
    if (!this.selectedPoints.size) return

    // 获取当前的数据
    const currentTrace = this.data[0]
    const currentOpacities = currentTrace.marker.opacity || Array.from({ length: currentTrace.x.length }).fill(1)

    // 创建新的不透明度数组
    const newOpacities = [...currentOpacities]

    // 更新选中点的不透明度
    this.selectedPoints.forEach((index) => {
      this.hiddenPoints.add(index)
      newOpacities[index] = 0
    })

    // 更新图表
    const update = {
      'marker.opacity': [newOpacities], // 注意：这里需要将数组包装在另一个数组中
    }

    // 应用更新
    Plotly.restyle(this.container, update)

    // 清除选中状态
    this.selectedPoints.clear()
    this.updatePointStyles() // 更新点的样式（清除红色边框）
  }

  /**
   * 显示所有被隐藏的点
   */
  showHiddenPoints() {
    if (!this.hiddenPoints.size) return

    // 获取当前的数据
    const currentTrace = this.data[0]
    const currentOpacities = currentTrace.marker.opacity || Array.from({ length: currentTrace.x.length }).fill(1)

    // 创建新的不透明度数组
    const newOpacities = [...currentOpacities]

    // 更新隐藏点的不透明度
    this.hiddenPoints.forEach((index) => {
      newOpacities[index] = 1
    })

    // 更新图表
    const update = {
      'marker.opacity': [newOpacities], // 注意：这里需要将数组包装在另一个数组中
    }

    // 应用更新
    Plotly.restyle(this.container, update)

    // 清空隐藏点集合
    this.hiddenPoints.clear()
  }

  /**
   * 获取隐藏的点
   * @returns {Array} 隐藏点的索引数组
   */
  getHiddenPoints() {
    return Array.from(this.hiddenPoints)
  }

  /**
   * 检查点是否被隐藏
   * @param {number} index 点的索引
   * @returns {boolean} 是否被隐藏
   */
  isPointHidden(index) {
    return this.hiddenPoints.has(index)
  }

  /**
   * 获取可见点的数量
   * @returns {number} 可见点的数量
   */
  getVisiblePointsCount() {
    return this.data[0].x.length - this.hiddenPoints.size
  }

  /**
   * 获取所有隐藏点的 ID
   * @returns {Array} 隐藏点的 ID 数组
   */
  getHiddenPointIds() {
    return Array.from(this.hiddenPoints).map((index) => this.pointIds[index])
  }

  /**
   * 获取所有选中点的 ID
   * @returns {Array} 选中点的 ID 数组
   */
  getSelectedPointIds() {
    return Array.from(this.selectedPoints).map((index) => this.pointIds[index])
  }

  /**
   * 根据 ID 获取点的索引
   * @param {string|number} id 点的 ID
   * @returns {number} 点的索引，如果未找到返回 -1
   */
  getPointIndexById(id) {
    return this.pointIds.indexOf(id)
  }

  /**
   * 根据 ID 检查点是否被隐藏
   * @param {string|number} id 点的 ID
   * @returns {boolean} 是否被隐藏
   */
  isPointHiddenById(id) {
    const index = this.getPointIndexById(id)
    return index !== -1 && this.hiddenPoints.has(index)
  }

  /**
   * 根据 ID 检查点是否被选中
   * @param {string|number} id 点的 ID
   * @returns {boolean} 是否被选中
   */
  isPointSelectedById(id) {
    const index = this.getPointIndexById(id)
    return index !== -1 && this.selectedPoints.has(index)
  }

  /**
   * 更新散点图数据
   * @param {object} newData 新数据
   * @param {Array} newData.x x轴数据
   * @param {Array} newData.y y轴数据
   * @param {Array} newData.v 颜色值数据
   * @param {number} newData.zmin 最小值
   * @param {number} newData.zmax 最大值
   */
  updateScatterData(newData) {
    if (!this.container || !newData) {
      return
    }

    // 获取当前的 colorscale
    const currentColorscale = this.data[0].marker.colorscale || defaultColorscale

    // 如果newData中包含visible属性，则更新hiddenPoints集合
    if (newData.visible && Array.isArray(newData.visible)) {
      // 清空当前hiddenPoints集合
      this.hiddenPoints.clear()

      // 根据新的visible属性更新hiddenPoints
      newData.visible.forEach((v, index) => {
        if (v === 1) {
          this.hiddenPoints.add(index)
        }
      })
    }

    // 计算新的不透明度数组
    const newOpacities = Array.from({ length: newData.x.length }, (_, i) => {
      return this.hiddenPoints.has(i) ? 0 : 1
    })

    // 更新主图的配置
    const update = {
      'x': [newData.x],
      'y': [newData.y],
      // 'marker.color': [newData.v],
      // 'zmin': newData?.zmin, // 0,
      // 'zmax': newData?.zmax, // 200,
      'marker.opacity': [newOpacities],
      'marker.colorscale': [currentColorscale],
    }

    // 如果newData中包含v属性，则更新颜色值
    if (newData.v) {
      update['marker.color'] = [newData.v]
    }

    // 更新内部数据存储
    this.data[0].x = newData.x
    this.data[0].y = newData.y
    if (newData.v) {
      this.data[0].marker.color = newData.v
    }
    this.data[0].marker.opacity = newOpacities

    // 不清除隐藏状态，但清除选中状态
    this.selectedPoints.clear()

    // 更新点的样式
    this.updatePointStyles()

    // 设置布局，让图表自动调整轴范围和宽高比
    const layout = {
      autosize: true,
      xaxis: {
        autorange: true,
        constrain: 'domain',
      },
      yaxis: {
        autorange: 'reversed',
        constrain: 'domain',
      },
    }

    // 更新主图
    Plotly.update(this.container, update, layout, [0])

    // 如果存在鹰眼图，也更新鹰眼图
    if (this.eagleEyeContainer) {
      const eagleEyeUpdate = {
        'x': [newData.x],
        'y': [newData.y],
        'marker.opacity': [newOpacities],
        'marker.colorscale': [currentColorscale],
      }

      // 如果newData中包含v属性，则更新鹰眼图的颜色值
      if (newData.v) {
        eagleEyeUpdate['marker.color'] = [newData.v]
      }

      // 使用相同的布局配置更新鹰眼图
      Plotly.update(this.eagleEyeContainer, eagleEyeUpdate, layout, [0])
    }
  }

  /**
   * 更新散点图数据和颜色比例尺
   * @param {object} newData 新数据对象，格式为 {x: [], y: [], v: [], visible:[], zmin: number, zmax: number}
   * @param {Array} colorScale 新的颜色比例尺，格式为 [[pos, color], ...]
   */
  updateScatterDataAndColorScale(newData, colorScale) {
    if (!this.container || !newData || !Array.isArray(colorScale) || colorScale.length < 2) {
      console.error('参数不正确，散点图数据或颜色比例尺格式错误')
      return
    }

    // 如果newData中包含visible属性，则更新hiddenPoints集合
    if (newData.visible && Array.isArray(newData.visible)) {
      // 清空当前hiddenPoints集合
      this.hiddenPoints.clear()

      // 根据新的visible属性更新hiddenPoints
      newData.visible.forEach((v, index) => {
        if (v === 1) {
          this.hiddenPoints.add(index)
        }
      })
    }

    // 计算新的不透明度数组
    const newOpacities = Array.from({ length: newData.x.length }, (_, i) => {
      return this.hiddenPoints.has(i) ? 0 : 1
    })

    // 更新主图的配置
    const update = {
      'x': [newData.x],
      'y': [newData.y],
      'marker.color': [newData.v],
      'marker.opacity': [newOpacities],
      'marker.colorscale': [colorScale],
    }

    // 更新值域范围
    if (typeof newData.zmin === 'number') {
      update['marker.cmin'] = newData.zmin
      this.data[0].marker.cmin = newData.zmin
    }
    if (typeof newData.zmax === 'number') {
      update['marker.cmax'] = newData.zmax
      this.data[0].marker.cmax = newData.zmax
    }

    // 更新内部数据存储
    this.data[0].x = newData.x
    this.data[0].y = newData.y
    this.data[0].marker.color = newData.v
    this.data[0].marker.opacity = newOpacities
    this.data[0].marker.colorscale = colorScale

    // 不清除隐藏状态，但清除选中状态
    this.selectedPoints.clear()

    // 更新点的样式
    this.updatePointStyles()

    // 设置布局，让图表自动调整轴范围和宽高比
    const layout = {
      autosize: true,
      xaxis: {
        autorange: true,
        constrain: 'domain',
      },
      yaxis: {
        autorange: 'reversed',
        constrain: 'domain',
      },
    }

    // 更新主图
    Plotly.update(this.container, update, layout, [0])

    // 如果存在鹰眼图，也更新鹰眼图
    if (this.eagleEyeContainer) {
      const eagleEyeUpdate = {
        'x': [newData.x],
        'y': [newData.y],
        'marker.color': [newData.v],
        'marker.opacity': [newOpacities],
        'marker.colorscale': [colorScale],
        'marker.cmin': update['marker.cmin'],
        'marker.cmax': update['marker.cmax'],
      }

      // 使用相同的布局配置更新鹰眼图
      Plotly.update(this.eagleEyeContainer, eagleEyeUpdate, layout, [0])
    }
  }

  /**
   * 销毁散点图
   */
  dispose() {
    if (this.container) {
      // 移除所有事件监听器
      if (this.chart) {
        this.chart.removeAllListeners('plotly_click')
        this.chart.removeAllListeners('plotly_hover')
      }

      // 清除 Plotly 图表
      Plotly.purge(this.container)

      // 清除内部状态
      this.chart = null
      this.data = []
      this.layout = {}
      this.selectedPoints.clear()
      this.hiddenPoints.clear()
      this.pointIds = []
      this.isSelectMode = false

      // 重置容器样式
      this.container.style.cursor = 'auto'

      console.warn('散点图已销毁')
    }
  }

  /**
   * 添加鹰眼图
   * @param {object} options 鹰眼图配置选项
   * @param {HTMLElement} options.container 鹰眼图容器
   * @param {object} options.style 鹰眼图样式
   */
  addEagleEye(options = {}) {
    const {
      container,
      style = {},
    } = options

    if (!container) {
      console.warn('鹰眼图容器不能为空')
      return
    }

    // 创建鹰眼图的数据
    const eagleEyeData = [{
      x: this.data[0].x,
      y: this.data[0].y,
      type: 'scatter',
      mode: 'markers',
      marker: {
        size: style.markerSize || 2,
        color: this.data[0].marker.color,
        colorscale: this.data[0].marker.colorscale,
        opacity: this.data[0].marker.opacity,
        symbol: 'square',
      },
    }]

    // 初始视图框
    const initialViewBox = {
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: this.data[0].x[0],
      y0: this.data[0].y[0],
      x1: this.data[0].x[this.data[0].x.length - 1],
      y1: this.data[0].y[this.data[0].y.length - 1],
      fillcolor: 'rgba(255, 255, 255, 0.3)',
      line: {
        color: 'rgb(38, 139, 57)',
        width: 1,
        dash: 'solid',
      },
    }

    // 鹰眼图布局配置
    const eagleEyeLayout = {
      showlegend: false,
      hovermode: false,
      dragmode: false,
      xaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
        autorange: true,
        showline: false,
        side: 'top',
      },
      yaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
        autorange: 'reversed',
        showline: false,
      },
      shapes: [initialViewBox], // 添加初始视图框
      margin: { t: 2, l: 2, r: 2, b: 2 },
      plot_bgcolor: style.backgroundColor || '#ffffff',
      paper_bgcolor: style.backgroundColor || '#ffffff',
      width: style.width || 200,
      height: style.height || 200,
    }

    // 鹰眼图配置
    const eagleEyeConfig = {
      displayModeBar: false,
      responsive: true,
      staticPlot: true,
    }

    // 创建鹰眼图
    Plotly.newPlot(
      container,
      eagleEyeData,
      eagleEyeLayout,
      eagleEyeConfig,
    )

    // 存储鹰眼图容器引用
    this.eagleEyeContainer = container

    // 使用防抖函数来减少更新频率
    let updateTimeout

    // 同步主图和鹰眼图的视图范围
    this.container.on('plotly_relayout', (eventData) => {
      if (eventData['xaxis.range[0]'] !== undefined) {
        // 清除之前的定时器
        if (updateTimeout) {
          clearTimeout(updateTimeout)
        }

        // 设置新的定时器
        updateTimeout = setTimeout(() => {
          // 更新视图框的位置
          Plotly.relayout(container, {
            'shapes[0].x0': eventData['xaxis.range[0]'],
            'shapes[0].x1': eventData['xaxis.range[1]'],
            'shapes[0].y0': eventData['yaxis.range[0]'],
            'shapes[0].y1': eventData['yaxis.range[1]'],
          })
        }, 16) // 约60fps的更新频率
      }
    })
  }

  /**
   * 更新鹰眼图数据
   * @private
   */
  updateEagleEye() {
    if (!this.eagleEyeContainer) return

    const update = {
      'x': [this.data[0].x],
      'y': [this.data[0].y],
      'marker.color': [this.data[0].marker.color],
      'marker.opacity': [this.data[0].marker.opacity],
    }

    Plotly.update(this.eagleEyeContainer, update)
  }

  /**
   * 获取当前散点图的值域范围
   * @returns {object} 值域范围对象，包含 zmin 和 zmax
   */
  getValueRange() {
    if (!this.container || !this.container.data || !this.container.data[0]) {
      console.warn('散点图未初始化')
      return null
    }

    // 获取当前的 marker.color 数组
    const colorValues = this.container.data[0].marker.color
    if (!Array.isArray(colorValues)) {
      return null
    }

    // 计算最小值和最大值
    const zmin = Math.min(...colorValues)
    const zmax = Math.max(...colorValues)

    return {
      zmin: typeof zmin === 'number' ? zmin : null,
      zmax: typeof zmax === 'number' ? zmax : null,
    }
  }

  /**
   * 获取当前散点图的配色方案
   * @returns {Array} 配色数组，格式为 [[pos, color], ...]
   */
  getColorScale() {
    if (!this.container || !this.container.data || !this.container.data[0]) {
      console.warn('散点图未初始化')
      return null
    }

    // 获取当前的 colorscale
    const currentColorscale = this.container.data[0].marker.colorscale

    // 如果没有 colorscale，返回默认值
    if (!currentColorscale) {
      return defaultColorscale
    }

    // 返回当前配色方案的深拷贝
    return JSON.parse(JSON.stringify(currentColorscale))
  }

  /**
   * 更新散点图的配色和值域范围
   * @param {object} options 更新选项
   * @param {Array} options.colorscale 新的配色数组，格式为 [[pos, color], ...]
   * @param {number} [options.zmin] 新的最小值
   * @param {number} [options.zmax] 新的最大值
   */
  updateColorScaleAndRange({ colorscale, zmin, zmax }) {
    if (!Array.isArray(colorscale) || colorscale.length < 2) {
      console.warn('配色数组格式不正确，至少需要包含两个颜色点')
      return
    }

    // 更新主图的配置
    const update = {
      'marker.colorscale': [colorscale],
      'colorbar.tickmode': 'array',
      // 'marker.showscale': true,
      // 'marker.colorbar': {
      //     tickmode: 'array',
      //     len: 1,
      //     thickness: 20,
      //     ticks: 'outside',
      //     ticklen: 5,
      //     tickwidth: 1,
      //     showticklabels: true,
      //     tickcolor: '#000',
      // },
    }

    // 如果提供了新的值域范围，更新 cmin 和 cmax
    if (typeof zmin === 'number') {
      update['marker.cmin'] = zmin
      this.data[0].marker.cmin = zmin
    }
    if (typeof zmax === 'number') {
      update['marker.cmax'] = zmax
      this.data[0].marker.cmax = zmax
    }

    // 计算 colorbar 的刻度值
    const currentZmin = this.data[0].marker.cmin || Math.min(...this.data[0].marker.color)
    const currentZmax = this.data[0].marker.cmax || Math.max(...this.data[0].marker.color)

    update['marker.colorbar.tickvals'] = Array.from(
      { length: colorscale.length },
      (_, i) => currentZmin + (currentZmax - currentZmin) * colorscale[i][0],
    )

    update['marker.colorbar.ticktext'] = Array.from(
      { length: colorscale.length },
      (_, i) => Math.round(currentZmin + (currentZmax - currentZmin) * colorscale[i][0]),
    )

    // 更新 colorbar 的其他属性
    Object.assign(update, {
      'colorbar.len': 1,
      'colorbar.thickness': 20,
      'colorbar.ticks': 'outside',
      'colorbar.ticklen': 5,
      'colorbar.tickwidth': 1,
      'colorbar.showticklabels': true,
      'colorbar.tickcolor': '#000',
      // 根据 colorscale 长度更新分组
      'contours.ncontours': colorscale.length - 1,
      'contours.start': currentZmin,
      'contours.end': currentZmax,
      'contours.size': (currentZmax - currentZmin) / (colorscale.length - 1),
    })

    // 更新主图
    Plotly.update(this.container, update, {}, [0])

    // 如果存在鹰眼图，也更新鹰眼图
    if (this.eagleEyeContainer) {
      const eagleEyeUpdate = {
        'marker.colorscale': [colorscale],
        'marker.cmin': update['marker.cmin'],
        'marker.cmax': update['marker.cmax'],
      }
      Plotly.update(this.eagleEyeContainer, eagleEyeUpdate, {}, [0])
    }
  }

  /**
   * 更新散点图配色方案
   * @param {Array} colorscale 新的配色数组，格式为 [[pos, color], ...]
   */
  updateColorScale(colorscale) {
    if (!Array.isArray(colorscale) || colorscale.length < 2) {
      console.warn('配色数组格式不正确，至少需要包含两个颜色点')
      return
    }

    // 更新主图的配置
    const update = {
      'marker.colorscale': [colorscale],
    }

    // // 使用当前值域范围计算刻度
    // const currentZmin = this.data[0].marker.cmin || Math.min(...this.data[0].marker.color)
    // const currentZmax = this.data[0].marker.cmax || Math.max(...this.data[0].marker.color)

    // // 更新colorbar刻度
    // update['marker.colorbar.tickvals'] = colorscale.map((item) =>
    //   currentZmin + (currentZmax - currentZmin) * item[0],
    // )
    // update['marker.colorbar.ticktext'] = colorscale.map((item) =>
    //   Math.round(currentZmin + (currentZmax - currentZmin) * item[0]),
    // )

    // 更新主图
    Plotly.update(this.container, update, {}, [0])

    // 同步更新鹰眼图
    if (this.eagleEyeContainer) {
      const eagleEyeUpdate = {
        'marker.colorscale': [colorscale],
        // 'marker.colorbar.tickvals': update['marker.colorbar.tickvals'],
        // 'marker.colorbar.ticktext': update['marker.colorbar.ticktext'],
      }
      Plotly.update(this.eagleEyeContainer, eagleEyeUpdate, {}, [0])
    }
  }

  /**
   * 添加 D3 自定义颜色条
   * @param {Array} colorBars 颜色条配置，格式为 [[level, color], ...]
   * @param {object} options 配置选项
   * @param {number} options.width 颜色条宽度，默认为 30
   * @param {number} options.rightMargin 颜色条右侧边距，默认为 20
   * @param {boolean} options.showLabels 是否显示标签，默认为 true
   * @param {string} options.labelColor 标签颜色，默认为 '#333'
   * @param {number} options.labelSize 标签字体大小，默认为 12
   * @param {string} options.fontFamily 标签字体，默认为 'Arial'
   * @returns {SVGElement} 创建的 SVG 元素
   */
  addD3ColorBar(colorBars, options = {}) {
    if (typeof d3 === 'undefined') {
      console.warn('D3.js 库未加载，无法创建自定义颜色条')
      return null
    }

    // 数据验证
    if (!Array.isArray(colorBars) || colorBars.length < 2) {
      console.warn('颜色条数据格式不正确')
      return null
    }

    // 移除旧颜色条
    // this.removeD3ColorBar()

    // 合并配置选项
    const {
      width = 30,
      rightMargin = 20,
      topMargin = 80,
      showLabels = true,
      labelColor = '#333',
      labelSize = 12,
      fontFamily = 'Arial',
      bottomMargin = 80,
    } = options

    // 获取容器尺寸
    const containerRect = this.container.getBoundingClientRect()
    const containerHeight = containerRect.height - topMargin - bottomMargin

    // 排序颜色数据
    const sortedColorBars = [...colorBars].sort((a, b) => a[0] - b[0])

    // 创建 SVG 容器
    const svg = d3.create('svg')
      .attr('class', 'd3-color-bar1')
      .attr('width', width + (showLabels ? 60 : 0))
      .attr('height', containerHeight)
      .style('position', 'absolute')
      .style('top', `${topMargin}px`)
      .style('bottom', `${bottomMargin}px`)
      .style('right', `${rightMargin}px`)
      .style('z-index', '1000')
      .style('pointer-events', 'none')

    // 计算颜色块参数
    const blockHeight = containerHeight / sortedColorBars.length

    // 绘制颜色块
    svg.selectAll('rect.color-block')
      .data(sortedColorBars)
      .enter()
      .append('rect')
      .attr('class', 'color-block')
      .attr('x', 0)
      .attr('y', (_, i) => containerHeight - (i + 1) * blockHeight)
      .attr('width', width)
      .attr('height', blockHeight)
      .attr('fill', (d) => d[1])
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5)

    // 添加标签
    if (showLabels) {
      // const currentZmin = this.data[0].marker.cmin || Math.min(...this.data[0].marker.color)
      // const currentZmax = this.data[0].marker.cmax || Math.max(...this.data[0].marker.color)

      svg.selectAll('text.level-label')
        .data(sortedColorBars)
        .enter()
        .append('text')
        .attr('class', 'level-label')
        .attr('x', width + 5)
        .attr('y', (_, i) => containerHeight - (i + 0.5) * blockHeight)
        .attr('dy', '0.35em')
        .attr('fill', labelColor)
        .attr('font-size', `${labelSize}px`)
        .attr('font-family', fontFamily)
        .text((d) => d[0])
    }

    // 挂载到 DOM
    this.container.appendChild(svg.node())

    // 保存引用
    this._d3ColorBar = {
      svg: svg.node(),
      options,
      data: sortedColorBars,
    }

    return svg.node()
  }

  /**
   * 更新 D3 自定义颜色条
   * @param {Array} colorBars 新的颜色条配置
   * @param {object} options 配置选项
   */
  updateD3ColorBar(colorBars, options = {}) {
    if (!this._d3ColorBar) return this.addD3ColorBar(colorBars, options)

    // 检查SVG元素是否可见
    const svgElement = this._d3ColorBar.svg
    const svgDisplay = window.getComputedStyle(svgElement).display

    // 如果SVG元素不可见，先记录数据但不执行更新逻辑
    if (svgDisplay === 'none' || !svgElement.clientHeight) {
      // 只更新数据和选项，等下次元素可见时再更新视图
      this._d3ColorBar.options = { ...this._d3ColorBar.options, ...options }
      this._d3ColorBar.data = [...colorBars].sort((a, b) => Number(a[0]) - Number(b[0]))
      // 标记需要更新
      this._pendingColorBarUpdate = true
      return
    }

    // 合并配置
    const mergedOptions = { ...this._d3ColorBar.options, ...options }
    const sortedColorBars = [...colorBars].sort((a, b) => Number(a[0]) - Number(b[0]))

    // 获取容器参数 - 添加安全检查防止负值
    const containerHeight = Math.max(1, this.container.clientHeight - mergedOptions.topMargin - mergedOptions.bottomMargin)
    const blockHeight = Math.max(1, Math.floor(containerHeight / sortedColorBars.length))

    const svg = d3.select(this._d3ColorBar.svg)

    // 更新颜色块
    const blocks = svg.selectAll('rect.color-block')
      .data(sortedColorBars)

    blocks.exit().remove()

    blocks.enter()
      .append('rect')
      .attr('class', 'color-block')
      .merge(blocks)
      .attr('y', (_, i) => containerHeight - (i + 1) * blockHeight)
      .attr('width', mergedOptions.width)
      .attr('height', blockHeight)
      .attr('fill', (d) => d[1])
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5)

    // 更新标签
    if (mergedOptions.showLabels) {
      const labels = svg.selectAll('text.level-label')
        .data(sortedColorBars)

      labels.exit().remove()

      labels.enter()
        .append('text')
        .attr('class', 'level-label')
        .merge(labels)
        .attr('x', mergedOptions.width + 5)
        .attr('y', (_, i) => containerHeight - (i + 0.5) * blockHeight)
        .attr('fill', mergedOptions.labelColor)
        .attr('font-size', `${mergedOptions.labelSize}px`)
        .text((d) => d[0])
    } else {
      svg.selectAll('text.level-label').remove()
    }

    // 保存新配置
    this._d3ColorBar.options = mergedOptions
    this._d3ColorBar.data = sortedColorBars
    // 清除待更新标记
    this._pendingColorBarUpdate = false
  }

  /**
   * 检查并应用待处理的颜色条更新
   * 当容器从不可见变为可见时调用此方法
   */
  checkPendingColorBarUpdate() {
    if (this._pendingColorBarUpdate && this._d3ColorBar) {
      // 如果有待处理的更新，执行更新操作
      this.updateD3ColorBar(this._d3ColorBar.data, this._d3ColorBar.options)
      this._pendingColorBarUpdate = false
    }
  }

  /**
   * 移除 D3 自定义颜色条
   */
  removeD3ColorBar() {
    if (this._d3ColorBar?.svg?.parentNode) {
      this._d3ColorBar.svg.parentNode.removeChild(this._d3ColorBar.svg)
      this._d3ColorBar = null
      this._pendingColorBarUpdate = false
    }
  }

  /**
   * 添加头部点
   * @param {Array} headerPoints 头部点数据，格式为 [{x, y, v, num}]
   * @param {object} options 配置选项
   * @param {string} options.mode 点的显示模式，默认为 'markers'
   * @param {number} options.markerSize 点的大小，默认为 10
   * @param {string} options.markerSymbol 点的形状，默认为 'circle'
   * @param {string} options.markerColor 点的颜色，默认为 'red'
   * @param {number} options.markerOpacity 点的透明度，默认为 1
   * @param {object} options.markerLine 点的边框配置
   * @param {string} options.markerLine.color 边框颜色，默认为 'white'
   * @param {number} options.markerLine.width 边框宽度，默认为 2
   * @param {boolean} options.showLabels 是否显示标签，默认为 false
   * @param {string} options.labelText 标签文本，支持模板字符串，如 'Point: %{num}'
   * @param {object} options.textOptions 文本标签配置选项
   * @param {string} options.textOptions.position 标签位置，默认为 'top center'
   * @param {number} options.textOptions.size 标签字体大小，默认为 12
   * @param {string} options.textOptions.color 标签颜色，默认为 'black'
   * @param {string} options.textOptions.family 标签字体，默认为 'Arial'
   * @param {boolean} options.smartLabels 是否启用智能标签布局，默认为 false
   * @param {number} options.maxLabels 最大显示标签数量，默认为 20
   * @returns {number} 添加的头部点图层的索引
   */
  addHeaderPoints(headerPoints, options = {}) {
    if (!Array.isArray(headerPoints) || headerPoints.length === 0) {
      console.warn('头部点数据为空或格式不正确')
      return -1
    }

    // 默认配置
    const {
      mode = 'markers',
      markerSize = 10,
      markerSymbol = 'circle',
      markerColor = 'red',
      markerOpacity = 1,
      markerLine = {
        color: 'white',
        width: 2,
      },
      showLabels = false,
      textOptions = {},
      smartLabels = true,
      maxLabels = 50,
    } = options

    // 文本标签配置
    const {
      position = 'top center',
      size = 12,
      color = 'black',
      family = 'Arial',
    } = textOptions

    // 提取数据
    const xValues = headerPoints.map((point) => point.x)
    const yValues = headerPoints.map((point) => point.y)
    const vValues = headerPoints.map((point) => point.v)
    const numValues = headerPoints.map((point) => point.num)

    // 处理标签显示
    let textArray = numValues
    const textPositionArray = Array.from({ length: numValues.length }).fill(position)

    // 如果启用智能标签布局且点数量超过最大标签数
    if (showLabels && smartLabels && headerPoints.length > maxLabels) {
      // 方法1: 只显示部分标签
      const step = Math.ceil(headerPoints.length / maxLabels)
      textArray = numValues.map((val, idx) => idx % step === 0 ? val : '')

      // // 方法2: 交错显示标签位置
      // if (headerPoints.length > 10) {
      //   const positions = ['top center', 'top right', 'top left', 'bottom center', 'bottom left', 'bottom right']
      //   textPositionArray = numValues.map((_, idx) => {
      //     // 如果是空标签，位置无所谓
      //     if (textArray[idx] === '') return position
      //     // 否则根据索引交错分配位置
      //     return positions[idx % positions.length]
      //   })
      // }
    }

    // 创建新的散点图层
    const headerTrace = {
      x: xValues,
      y: yValues,
      type: 'scatter',
      mode: showLabels ? `${mode}+text` : mode,
      marker: {
        size: markerSize,
        color: vValues.length > 0 ? vValues : markerColor,
        symbol: markerSymbol,
        opacity: markerOpacity,
        line: {
          color: markerLine.color,
          width: markerLine.width,
        },
        // 添加原始颜色存储
        originalColor: vValues.length > 0 ? [...vValues] : markerColor,
      },
      text: textArray,
      textposition: textPositionArray,
      textfont: {
        family,
        size,
        color,
      },
      hoverinfo: 'x+y+text',
      hovertemplate: `x: %{x}<br>y: %{y}<br>num: %{text}<extra></extra>`,
      customdata: numValues,
      showlegend: false,
      zindex: 999,
      role: 'header',
    }

    // 添加新的图层到图表
    Plotly.addTraces(this.container, headerTrace)

    // 返回新添加的图层索引
    return this.container.data.length - 1
  }

  /**
   * 更新头部点
   * @param {number} traceIndex 头部点图层的索引
   * @param {Array} headerPoints 新的头部点数据
   * @param {object} options 配置选项，同 addHeaderPoints
   */
  updateHeaderPoints(traceIndex, headerPoints, options = {}) {
    if (!Array.isArray(headerPoints) || headerPoints.length === 0) {
      console.warn('头部点数据为空或格式不正确')
      return
    }

    if (traceIndex < 0 || traceIndex >= this.container.data.length) {
      console.warn('图层索引无效')
      return
    }

    // 提取数据
    const xValues = headerPoints.map((point) => point.x)
    const yValues = headerPoints.map((point) => point.y)
    const vValues = headerPoints.map((point) => point.v)
    const numValues = headerPoints.map((point) => point.num)

    // 更新配置
    const {
      mode,
      markerSize,
      markerSymbol,
      markerColor,
      markerOpacity,
      markerLine,
      showLabels,
      labelText,
    } = options

    // 准备更新对象
    const update = {
      x: [xValues],
      y: [yValues],
      customdata: [numValues],
    }

    // 更新标记相关配置
    if (vValues.length > 0) {
      update['marker.color'] = [vValues]
    } else if (markerColor) {
      update['marker.color'] = markerColor
    }

    if (markerSize) update['marker.size'] = markerSize
    if (markerSymbol) update['marker.symbol'] = markerSymbol
    if (markerOpacity !== undefined) update['marker.opacity'] = markerOpacity
    if (markerLine) {
      if (markerLine.color) update['marker.line.color'] = markerLine.color
      if (markerLine.width) update['marker.line.width'] = markerLine.width
    }

    // 更新文本相关配置
    if (mode) {
      update.mode = showLabels ? `${mode}+text` : mode
    } else if (showLabels !== undefined) {
      const currentMode = this.container.data[traceIndex].mode || 'markers'
      const baseMode = currentMode.replace('+text', '')
      update.mode = showLabels ? `${baseMode}+text` : baseMode
    }

    if (numValues) update.text = [numValues]
    if (labelText) {
      update.hovertemplate = `x: %{x}<br>y: %{y}<br>`
    }

    // 应用更新
    Plotly.restyle(this.container, update, [traceIndex])
  }

  /**
   * 移除头部点图层
   * @param {number} traceIndex 头部点图层的索引
   */
  removeHeaderPoints(traceIndex) {
    if (traceIndex < 0 || traceIndex >= this.container.data.length) {
      console.warn('图层索引无效')
      return
    }

    Plotly.deleteTraces(this.container, traceIndex)
  }

  /**
   * 获取所有图层的数量
   * @returns {number} 图层数量
   */
  getTraceCount() {
    return this.container.data.length
  }

  highlightHeaderPoints(nums) {
    if (!Array.isArray(nums) || nums.length !== 4) {
      console.warn('参数必须是长度为4的数组')
      return
    }

    const colors = ['red', 'blue', 'green', '#F4B008']

    // 只处理header类型的图层，避免不必要的循环
    const headerTraces = []
    this.container.data.forEach((trace, traceIndex) => {
      if (trace.role === 'header') {
        headerTraces.push({ trace, traceIndex })
      }
    })

    // 如果没有header图层，直接返回
    if (headerTraces.length === 0) return

    // 使用requestAnimationFrame来避免阻塞UI
    requestAnimationFrame(() => {
      headerTraces.forEach(({ trace, traceIndex }) => {
        // 获取原始颜色数组
        const originalColors = trace.marker.originalColor
        const numValues = trace.customdata || []

        // 如果是第一次高亮，保存原始颜色
        if (!trace.marker.originalColorSaved) {
          trace.marker.originalColor = Array.isArray(trace.marker.color)
            ? [...trace.marker.color]
            : trace.marker.color
          trace.marker.originalColorSaved = true
        }

        // 预先分配数组大小，避免动态扩容
        const newColors = Array.from({ length: numValues.length })

        // 批量处理颜色更新
        for (let i = 0; i < numValues.length; i++) {
          const num = numValues[i]
          const colorIndex = nums.indexOf(num)

          if (colorIndex !== -1) {
            newColors[i] = colors[colorIndex]
          } else {
            newColors[i] = Array.isArray(originalColors) ? originalColors[i] : originalColors
          }
        }

        // 一次性更新图层颜色，减少重绘次数
        Plotly.restyle(this.container, {
          'marker.color': [newColors],
        }, [traceIndex])
      })
    })
  }

  // 添加重置方法
  resetHeaderPointsColor(traceIndex) {
    if (traceIndex < 0 || traceIndex >= this.container.data.length) return

    const trace = this.container.data[traceIndex]
    if (trace.role === 'header' && trace.marker.originalColor) {
      Plotly.restyle(this.container, {
        'marker.color': [trace.marker.originalColor],
      }, [traceIndex])
    }
  }

  /**
   * 移除点击事件回调
   */
  removePointClickCallback() {
    // 重置属性查看模式标记
    this.isPropertyViewMode = false

    // 移除自定义样式
    if (this._cursorStyleElement) {
      document.head.removeChild(this._cursorStyleElement)
      this._cursorStyleElement = null
    }

    // 恢复默认鼠标样式
    this.container.style.cursor = 'auto'

    // 移除点击事件监听器
    this.container.removeAllListeners('plotly_click')
  }

  /**
   * 检查是否处于属性查看模式
   * @returns {boolean} 是否处于属性查看模式
   */
  isInPropertyViewMode() {
    return this.isPropertyViewMode
  }
}

export default PlotlyScatterChart
