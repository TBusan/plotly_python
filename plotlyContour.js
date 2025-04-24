import * as d3 from 'd3' // 添加 D3 导入
import Plotly from 'plotly.js-dist-min'
import { v4 as uuidv4 } from 'uuid'

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

// const defaultColorBars = [
//   { level: -20.0, lineType: 'solid', lineColor: '#000', color: '#FF0000' },
//   { level: -10.0, lineType: 'solid', lineColor: '#000', color: '#FF0000' },
//   { level: 0.0, lineType: 'solid', lineColor: '#000', color: '#FF0000' },
//   { level: 10, lineType: 'solid', lineColor: '#000', color: '#ff2200' },
//   { level: 20, lineType: 'solid', lineColor: '#000', color: '#ff4400' },
//   { level: 30, lineType: 'solid', lineColor: '#000', color: '#ff6600' },
//   { level: 40, lineType: 'solid', lineColor: '#000', color: '#ff8800' },
//   { level: 50, lineType: 'solid', lineColor: '#000', color: '#ffaa00' },
//   { level: 60, lineType: 'solid', lineColor: '#000', color: '#ffcc00' },
//   { level: 70, lineType: 'solid', lineColor: '#000', color: '#ffee00' },
//   { level: 80, lineType: 'solid', lineColor: '#000', color: '#e1fa1f' },
//   { level: 90, lineType: 'solid', lineColor: '#000', color: '#a5f05c' },
//   { level: 100, lineType: 'solid', lineColor: '#000', color: '#6ae699' },
//   { level: 110, lineType: 'solid', lineColor: '#000', color: '#2edcd6' },
//   { level: 120, lineType: 'solid', lineColor: '#000', color: '#35aeea' },
//   { level: 130, lineType: 'solid', lineColor: '#000', color: '#5174f1' },
//   { level: 140, lineType: 'solid', lineColor: '#000', color: '#6e3af8' },
//   { level: 150, lineType: 'solid', lineColor: '#000', color: '#8B00FF' },
// ]

// 基础图形类
class Shape {
  constructor(id, type, style = {}) {
    this.id = id
    this.type = type
    this.style = style
    this.createTime = formatDate(new Date())
    this.status = 'active'
    this.note = ''
  }

  // 获取图形属性
  getProperties() {
    return {
      id: this.id,
      type: this.type,
      style: this.style,
      createTime: this.createTime,
      status: this.status,
      note: this.note,
    }
  }

  // 更新图形属性
  updateProperties(properties) {
    Object.assign(this, properties)
  }

  // 更新样式
  updateStyle(style) {
    this.style = { ...this.style, ...style }
  }
}

// 点图形类
class PointShape extends Shape {
  constructor(id, style = {}) {
    super(id, 'point', {
      color: style.color || 'red',
      size: style.size || 12,
      opacity: style.opacity ?? 1,
      symbol: style.symbol || 'circle',
      text: {
        show: style.text?.show !== false,
        content: style.text?.content || '',
        color: style.text?.color || '#000000',
        size: style.text?.size || 12,
        fontFamily: style.text?.fontFamily || 'Arial',
        fontStyle: style.text?.fontStyle || 'normal',
        fontWeight: style.text?.fontWeight || 'normal',
      },
    })
  }

  // 创建 Plotly 图形对象
  createPlotlyShape(points) {
    const shape = {
      type: 'scatter',
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      mode: 'markers',
      marker: {
        color: this.style.color,
        size: this.style.size,
        symbol: this.style.symbol,
        opacity: this.style.opacity,
      },
      hoverinfo: 'none',
      customdata: [this.getProperties()],
    }

    // 如果配置了文字，添加文字图形
    if (this.style.text?.show && this.style.text?.content) {
      const textShape = {
        type: 'scatter',
        x: points.map((p) => p.x),
        y: points.map((p) => p.y + (this.style.size / 10)),
        mode: 'text',
        text: points.map(() => this.style.text.content),
        textposition: 'top center',
        textfont: {
          family: this.style.text.fontFamily,
          size: this.style.text.size,
          color: this.style.text.color,
          style: this.style.text.fontStyle,
          weight: this.style.text.fontWeight,
        },
        hoverinfo: 'none',
        showlegend: false,
        customdata: [{
          id: `${this.id}_text`,
          parentId: this.id,
          type: 'point_text',
          createTime: this.createTime,
          style: { ...this.style.text },
        }],
      }

      return { shape, textShape }
    }

    return { shape }
  }
}

// 折线图形类
class PolylineShape extends Shape {
  constructor(id, style = {}) {
    super(id, 'polyline', {
      color: style.color || '#F4F065',
      width: style.width || 2,
      opacity: style.opacity ?? 1,
      lineType: style.type || 'solid',
      marker: {
        show: style.marker?.show !== false,
        color: style.marker?.color || style.color || '#F4F065',
        size: style.marker?.size || 8,
        symbol: style.marker?.symbol || 'circle',
        opacity: style.marker?.opacity ?? 1,
      },
      text: {
        show: style.text?.show !== false,
        content: style.text?.content || '',
        color: style.text?.color || '#000000',
        size: style.text?.size || 12,
        fontFamily: style.text?.fontFamily || 'Arial',
        fontStyle: style.text?.fontStyle || 'normal',
        fontWeight: style.text?.fontWeight || 'normal',
      },
    })
  }

  // 创建 Plotly 图形对象
  createPlotlyShape(points) {
    // 如果没有点，返回一个空的图形对象
    if (!points || points.length === 0) {
      return {
        shape: {
          type: 'scatter',
          x: [],
          y: [],
          mode: this.style.marker.show ? 'lines+markers' : 'lines',
          line: {
            color: this.style.color,
            width: this.style.width,
            dash: this.style.lineType === 'dash' ? 'dash' : 'solid',
          },
          opacity: this.style.opacity,
          hoverinfo: 'none',
          customdata: [this.getProperties()],
        },
      }
    }

    const shape = {
      type: 'scatter',
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      mode: this.style.marker.show ? 'lines+markers' : 'lines',
      line: {
        color: this.style.color,
        width: this.style.width,
        dash: this.style.lineType === 'dash' ? 'dash' : 'solid',
      },
      opacity: this.style.opacity,
      hoverinfo: 'none',
      customdata: [this.getProperties()],
    }

    // 设置标记点样式
    if (this.style.marker.show) {
      shape.marker = {
        color: this.style.marker.color,
        size: this.style.marker.size,
        symbol: this.style.marker.symbol,
        opacity: this.style.marker.opacity,
      }
    }

    // 如果配置了文字，添加文字到质心
    if (this.style.text?.show && this.style.text?.content) {
      const centroid = this.calculateCentroid(points)
      const textShape = {
        type: 'scatter',
        x: [centroid.x],
        y: [centroid.y],
        mode: 'text',
        text: [this.style.text.content],
        textposition: 'middle center',
        textfont: {
          family: this.style.text.fontFamily,
          size: this.style.text.size,
          color: this.style.text.color,
          style: this.style.text.fontStyle,
          weight: this.style.text.fontWeight,
        },
        hoverinfo: 'none',
        showlegend: false,
        customdata: [{
          id: `${this.id}_text`,
          parentId: this.id,
          type: 'polyline_text',
          createTime: this.createTime,
          style: { ...this.style.text },
        }],
      }

      return { shape, textShape }
    }

    return { shape }
  }

  // 计算质心
  calculateCentroid(points) {
    if (!points || points.length < 2) {
      return { x: 0, y: 0 }
    }

    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)

    return {
      x: sumX / points.length,
      y: sumY / points.length,
    }
  }
}

// 多边形图形类
class PolygonShape extends Shape {
  constructor(id, style = {}) {
    super(id, 'polygon', {
      color: style.lineStyle?.color || '#F4F065',
      width: style.lineStyle?.width || 2,
      opacity: style.lineStyle?.opacity ?? 1,
      lineType: style.lineStyle?.type || 'solid',
      fillType: style.fillStyle?.type || 'color',
      fillColor: style.fillStyle?.color || '#CAEA37',
      fillOpacity: style.fillStyle?.opacity ?? 0.6,
      marker: {
        show: style.marker?.show !== false,
        color: style.marker?.color || style.lineStyle?.color || '#F4F065',
        size: style.marker?.size || 8,
        symbol: style.marker?.symbol || 'circle',
        opacity: style.marker?.opacity ?? 1,
      },
      text: {
        show: style.text?.show !== false,
        content: style.text?.content || '',
        color: style.text?.color || '#000000',
        size: style.text?.size || 12,
        fontFamily: style.text?.fontFamily || 'Arial',
        fontStyle: style.text?.fontStyle || 'normal',
        fontWeight: style.text?.fontWeight || 'normal',
      },
    })

    // 如果是图案填充，添加图案相关属性
    if (this.style.fillType === 'pattern') {
      this.style.pattern = style.fillStyle?.pattern || '+'
      this.style.fgcolor = style.fillStyle?.fgcolor || style.lineStyle?.color || '#F4F065'
      this.style.bgcolor = style.fillStyle?.bgcolor || 'white'
      this.style.patternSize = style.fillStyle?.size || 8
      this.style.patternSolidity = style.fillStyle?.solidity ?? 0.3
    }
  }

  // 创建 Plotly 图形对象
  createPlotlyShape(points) {
    // 如果没有点，返回一个空的图形对象
    if (!points || points.length === 0) {
      return {
        shape: {
          type: 'scatter',
          x: [],
          y: [],
          mode: this.style.marker.show ? 'lines+markers' : 'lines',
          fill: 'toself',
          line: {
            color: this.style.color,
            width: this.style.width,
            dash: this.style.lineType === 'dash' ? 'dash' : 'solid',
          },
          hoverinfo: 'none',
          customdata: [this.getProperties()],
        },
      }
    }

    const shape = {
      type: 'scatter',
      x: [...points.map((p) => p.x), points[0].x], // 闭合多边形
      y: [...points.map((p) => p.y), points[0].y],
      mode: this.style.marker.show ? 'lines+markers' : 'lines',
      fill: 'toself',
      line: {
        color: this.style.color,
        width: this.style.width,
        dash: this.style.lineType === 'dash' ? 'dash' : 'solid',
      },
      hoverinfo: 'none',
      customdata: [this.getProperties()],
    }

    // 设置填充样式
    if (this.style.fillType === 'pattern') {
      shape.fillpattern = {
        shape: this.style.pattern,
        fgcolor: this.style.fgcolor,
        bgcolor: this.style.bgcolor,
        size: this.style.patternSize,
        solidity: this.style.patternSolidity,
      }
      shape.opacity = 1
    } else {
      shape.fillcolor = this.style.fgcolor
      shape.opacity = this.style.fillOpacity
    }

    // 设置标记点样式
    if (this.style.marker.show) {
      shape.marker = {
        color: this.style.marker.color,
        size: this.style.marker.size,
        symbol: this.style.marker.symbol,
        opacity: this.style.marker.opacity,
      }
    }

    // 如果配置了文字，添加文字到质心
    if (this.style.text?.show && this.style.text?.content) {
      const centroid = this.calculateCentroid(points)
      const textShape = {
        type: 'scatter',
        x: [centroid.x],
        y: [centroid.y],
        mode: 'text',
        text: [this.style.text.content],
        textposition: 'middle center',
        textfont: {
          family: this.style.text.fontFamily,
          size: this.style.text.size,
          color: this.style.text.color,
          style: this.style.text.fontStyle,
          weight: this.style.text.fontWeight,
        },
        hoverinfo: 'none',
        showlegend: false,
        customdata: [{
          id: `${this.id}_text`,
          parentId: this.id,
          type: 'polygon_text',
          createTime: this.createTime,
          style: { ...this.style.text },
        }],
      }

      return { shape, textShape }
    }

    return { shape }
  }

  // 计算质心
  calculateCentroid(points) {
    if (!points || points.length < 3) {
      return { x: 0, y: 0 }
    }

    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)

    return {
      x: sumX / points.length,
      y: sumY / points.length,
    }
  }
}

// 文本图形类
class TextShape extends Shape {
  constructor(id, style = {}) {
    super(id, 'text', {
      text: style.text || 'Text',
      color: style.color || '#000000',
      size: style.size || 16,
      fontFamily: style.fontFamily || 'Arial',
      fontStyle: style.fontStyle || 'normal',
      fontWeight: style.fontWeight || 'normal',
      opacity: style.opacity ?? 1,
      align: style.align || 'left',
      baseline: style.baseline || 'top',
    })
  }

  // 创建 Plotly 图形对象
  createPlotlyShape(points) {
    const shape = {
      type: 'scatter',
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      mode: 'text',
      text: points.map(() => this.style.text),
      textposition: `${this.style.align} ${this.style.baseline}`,
      textfont: {
        family: this.style.fontFamily,
        size: this.style.size,
        color: this.style.color,
        style: this.style.fontStyle,
        weight: this.style.fontWeight,
      },
      opacity: this.style.opacity,
      hoverinfo: 'none',
      customdata: [this.getProperties()],
    }

    return { shape }
  }
}

// 图形工厂类
class ShapeFactory {
  static _cache = new Map()

  static createShape(type, id, style = {}) {
    // 生成缓存键
    const cacheKey = `${type}_${id}_${JSON.stringify(style)}`

    // 检查缓存
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    // 创建新图形
    let shape
    switch (type) {
      case 'point':
        shape = new PointShape(id, style)
        break
      case 'polyline':
        shape = new PolylineShape(id, style)
        break
      case 'polygon':
        shape = new PolygonShape(id, style)
        break
      case 'text':
        shape = new TextShape(id, style)
        break
      default:
        throw new Error(`Unsupported shape type: ${type}`)
    }

    // 存入缓存
    this._cache.set(cacheKey, shape)

    return shape
  }

  static clearCache() {
    this._cache.clear()
  }
}

// 事件管理类
class EventManager {
  constructor(container, handlers) {
    this.container = container
    this.handlers = handlers
  }

  addEvents() {
    this.container.addEventListener('mousemove', this.handlers.mousemove)
    this.container.addEventListener('click', this.handlers.click)
    this.container.addEventListener('contextmenu', this.handlers.contextmenu)
  }

  removeEvents() {
    this.container.removeEventListener('mousemove', this.handlers.mousemove)
    this.container.removeEventListener('click', this.handlers.click)
    this.container.removeEventListener('contextmenu', this.handlers.contextmenu)
  }
}

// 绘制命令类
class DrawingCommand {
  constructor(chart, type, options) {
    this.chart = chart
    this.type = type
    this.options = options
    // 预处理选项，减少后续操作中的对象计算
    this._processedOptions = this._preprocessOptions(options)
  }

  // 预处理选项，减少重复计算
  _preprocessOptions(options) {
    const processed = {}

    // 根据类型预处理不同的选项
    if (this.type === 'polygon') {
      processed.fillType = options.fillStyle?.type || 'color'
      processed.fillColor = options.fillStyle?.bgcolor || '#CAEA37'
      processed.fillOpacity = options.fillStyle?.opacity ?? 0.6
      processed.lineColor = options.lineStyle?.color || '#F4F065'
      processed.lineWidth = options.lineStyle?.width || 2
      processed.lineDash = options.lineStyle?.type === 'dash' ? 'dash' : 'solid'
      processed.showMarker = options.marker?.show !== false
      processed.markerColor = options.marker?.color || options.lineStyle?.color || '#F4F065'
      processed.markerSize = options.marker?.size || 8
      processed.markerSymbol = options.marker?.symbol || 'circle'
      processed.markerOpacity = options.marker?.opacity ?? 1

      // 图案填充属性
      if (processed.fillType === 'pattern') {
        processed.pattern = options.fillStyle?.pattern || '+'
        processed.fgcolor = options.fillStyle?.fgcolor || options.lineStyle?.color || '#F4F065'
        processed.bgcolor = options.fillStyle?.bgcolor || 'white'
        processed.patternSize = options.fillStyle?.size || 8
        processed.patternSolidity = options.fillStyle?.solidity ?? 0.3
      }
    } else if (this.type === 'polyline') {
      processed.lineColor = options.color || '#F4F065'
      processed.lineWidth = options.width || 2
      processed.lineDash = options.type === 'dash' ? 'dash' : 'solid'
      processed.lineOpacity = options.opacity ?? 1
      processed.showMarker = options.marker?.show !== false
      processed.markerColor = options.marker?.color || options.color || '#F4F065'
      processed.markerSize = options.marker?.size || 8
      processed.markerSymbol = options.marker?.symbol || 'circle'
      processed.markerOpacity = options.marker?.opacity ?? 1
    } else if (this.type === 'point') {
      processed.color = options.color || 'red'
      processed.size = options.size || 12
      processed.symbol = options.symbol || 'circle'
      processed.opacity = options.opacity ?? 1
    }

    return processed
  }

  execute() {
    if (this.chart.isDrawing) return

    this.chart.isDrawing = true
    this.chart.drawingType = this.type
    this.chart.drawingPoints = []

    // 创建图形对象
    const shape = this.chart.shapeFactory.createShape(this.type, this.chart.generateShapeId(), this.options)
    this.chart.drawingShape = shape

    // 保存当前的视图范围
    const currentXRange = this.chart.container._fullLayout.xaxis.range
    const currentYRange = this.chart.container._fullLayout.yaxis.range

    // 更改鼠标样式为十字准线
    this.chart.container.style.cursor = 'crosshair'

    // 性能优化：合并布局更新为一次操作
    Plotly.relayout(this.chart.container, {
      'dragmode': false,
      'hovermode': false,
      'xaxis.fixedrange': true,
      'yaxis.fixedrange': true,
      'xaxis.range': currentXRange,
      'yaxis.range': currentYRange,
      'xaxis.scaleanchor': 'y',
      'xaxis.scaleratio': 1,
      'yaxis.constrain': 'domain',
      'margin': { t: 50, l: 50, r: 50, b: 50 },
    })

    // 设置绘制事件
    this.chart.setupDrawingEvents()

    // 添加临时图形
    const plotlyShape = this._createInitialPlotlyShape()

    // 使用一次操作添加图形，减少重绘次数
    Plotly.addTraces(this.chart.container, plotlyShape)
  }

  // 创建初始的Plotly图形，使用预处理的选项减少计算
  _createInitialPlotlyShape() {
    const plotlyShape = {
      type: 'scatter',
      x: [],
      y: [],
      hoverinfo: 'none',
      customdata: [this.chart.drawingShape.getProperties()],
    }

    // 根据类型设置不同的样式
    if (this.type === 'polygon') {
      // 设置多边形样式
      plotlyShape.mode = this._processedOptions.showMarker ? 'lines+markers' : 'lines'
      plotlyShape.fill = 'toself'

      if (this._processedOptions.fillType === 'pattern') {
        plotlyShape.fillpattern = {
          shape: this._processedOptions.pattern,
          fgcolor: this._processedOptions.fgcolor,
          bgcolor: this._processedOptions.bgcolor,
          size: this._processedOptions.patternSize,
          solidity: this._processedOptions.patternSolidity,
        }
        plotlyShape.opacity = 1
      } else {
        plotlyShape.fillcolor = this._processedOptions.fillColor
        plotlyShape.opacity = this._processedOptions.fillOpacity
      }

      // 设置线条样式
      plotlyShape.line = {
        color: this._processedOptions.lineColor,
        width: this._processedOptions.lineWidth,
        dash: this._processedOptions.lineDash,
      }

      // 设置标记点样式
      if (this._processedOptions.showMarker) {
        plotlyShape.marker = {
          color: this._processedOptions.markerColor,
          size: this._processedOptions.markerSize,
          symbol: this._processedOptions.markerSymbol,
          opacity: this._processedOptions.markerOpacity,
        }
      }
    } else if (this.type === 'polyline') {
      // 设置折线样式
      plotlyShape.mode = this._processedOptions.showMarker ? 'lines+markers' : 'lines'
      plotlyShape.line = {
        color: this._processedOptions.lineColor,
        width: this._processedOptions.lineWidth,
        dash: this._processedOptions.lineDash,
      }
      plotlyShape.opacity = this._processedOptions.lineOpacity

      // 设置标记点样式
      if (this._processedOptions.showMarker) {
        plotlyShape.marker = {
          color: this._processedOptions.markerColor,
          size: this._processedOptions.markerSize,
          symbol: this._processedOptions.markerSymbol,
          opacity: this._processedOptions.markerOpacity,
        }
      }
    } else if (this.type === 'point') {
      // 设置点样式
      plotlyShape.mode = 'markers'
      plotlyShape.marker = {
        color: this._processedOptions.color,
        size: this._processedOptions.size,
        symbol: this._processedOptions.symbol,
        opacity: this._processedOptions.opacity,
      }
    }

    return plotlyShape
  }
}

export class PlotlContourChart {
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
    this.isDrawing = false // 是否正在绘制
    this.drawingType = null // 绘制类型：'polyline' 或 'polygon'
    this.drawingPoints = [] // 绘制过程中的点
    this.tempPoint = null // 临时点（鼠标当前位置）
    this.drawingShape = null // 当前绘制的图形
    this.shapeIdCounter = 1 // 用于生成唯一ID
    this.shapeFactory = ShapeFactory
    this.eventManager = null // 事件管理器实例
    this.eagleEyeContainer = null // 鹰眼图容器
    this.currentIndex = -1 // 当前索引
    this.shapeGroups = new Map() // 分组数据

    // 创建自定义事件系统
    this._events = new Map()
  }

  /**
   * 添加事件监听器
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   */
  on(eventName, callback) {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, new Set())
    }
    this._events.get(eventName).add(callback)
  }

  /**
   * 移除事件监听器
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   */
  off(eventName, callback) {
    if (this._events.has(eventName)) {
      this._events.get(eventName).delete(callback)
    }
  }

  /**
   * 触发事件
   * @param {string} eventName 事件名称
   * @param {any} data 事件数据
   */
  emit(eventName, data) {
    if (this._events.has(eventName)) {
      this._events.get(eventName).forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error)
        }
      })
    }
  }

  /**
   * 生成唯一ID
   * @private
   */
  generateShapeId() {
    return `shape_${uuidv4()}`
  }

  /**
   * 创建默认图形属性
   * @param {string} type 图形类型
   * @private
   */
  createDefaultShapeProperties(type) {
    // 通用属性
    const properties = {
      id: this.generateShapeId(),
      name: `${type}_${this.shapeIdCounter}`,
      type,
      createTime: formatDate(new Date()),
      note: '',
      status: 'active',
      style: {},
    }

    // 根据类型添加特定样式属性
    if (type === 'point') {
      properties.style = {
        color: 'red', // 点颜色
        size: 12, // 点大小
        opacity: 1, // 透明度
        symbol: 'circle', // 点样式
      }
    } else {
      // 线条和多边形通用样式
      properties.style = {
        color: '#F4F065', // 线条颜色
        width: 2, // 线条宽度
        opacity: 1, // 线条透明度
        lineType: 'solid', // 线条类型：'solid' 实线, 'dash' 虚线
      }

      // 折线特有样式
      if (type === 'polyline') {
        // 默认文字样式
        properties.style.text = {
          show: false, // 默认不显示文字
          content: '', // 默认无内容
          color: '#000000', // 默认黑色
          size: 12, // 默认大小
          fontFamily: 'Arial', // 默认字体
          fontStyle: 'normal', // 默认字体样式
          fontWeight: 'normal', // 默认字体粗细
        }
      }

      // 多边形特有样式
      if (type === 'polygon') {
        properties.style.fillColor = '#CAEA37' // 多边形填充颜色
        properties.style.fillOpacity = 0.6 // 多边形填充透明度
        properties.style.fillType = 'color' // 默认填充类型

        // 默认文字样式
        properties.style.text = {
          show: false, // 默认不显示文字
          content: '', // 默认无内容
          color: '#000000', // 默认黑色
          size: 12, // 默认大小
          fontFamily: 'Arial', // 默认字体
          fontStyle: 'normal', // 默认字体样式
          fontWeight: 'normal', // 默认字体粗细
        }
      }
    }

    return properties
  }

  /**
   * 初始化等值线图
   * @param {object} options 配置选项
   * @param {object} options.data 数据对象 {x: [], y: [], z: [[]]}
   * @param {object} options.style 样式配置
   * @param {object} options.layout 布局配置
   */
  init(options = {}) {
    const {
      data = {},
      style = {},
      layout = {},
    } = options

    // 检查数据
    if (!data.x || !data.y || !data.z) {
      console.warn('数据格式不正确')
      return
    }

    // const colorscaleLen = style?.colorscale?.length || defaultColorscale.length
    // 处理数据
    this.data = [{
      x: data?.x,
      y: data?.y,
      z: data?.z,
      type: 'contour',
      zmin: data?.zmin || 0, // 0,
      zmax: data?.zmax || 200, // 200,
      colorscale: style?.colorscale || defaultColorscale,
      contours: {
        // coloring: 'heatmap',
        // start: data?.zmin || -93,  // 起始值
        // end: data?.zmax || 941,    // 结束值
        showlines: style?.showlines, // true, // 默认显示等值线
        showlabels: style?.showLabels, // 默认不显示标签
        labelfont: {
          size: style?.labelSize || 12,
          color: style?.labelColor || 'white',
        },
      },
      line: {
        width: 1, // 默认线宽
        color: style?.lineColor || '#000',
        dash: style?.lineStyle || 'solid',
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
      // colorbar: {
      //     // nticks: 5,
      //     // // 可以明确指定刻度值
      //     // tickvals: Array.from({ length: 5 }, (_, i) =>
      //     //     data?.zmin + (data?.zmax - data?.zmin) * (i / (5 - 1))
      //     // ),
      //     // ticktext: Array.from({ length: 5 }, (_, i) =>
      //     //     Math.round(data?.zmin + (data?.zmax - data?.zmin) * (i / (5 - 1)))
      //     // )

      //     nticks: 5,
      //     tickmode: 'array',  // 使用数组模式指定刻度
      //     tickvals: [
      //         data?.zmin || -93,
      //         data?.zmin + (data?.zmax - data?.zmin) * 0.25,
      //         data?.zmin + (data?.zmax - data?.zmin) * 0.5,
      //         data?.zmin + (data?.zmax - data?.zmin) * 0.75,
      //         data?.zmax || 941
      //     ],
      //     ticktext: [
      //         Math.round(data?.zmin || -93),
      //         Math.round(data?.zmin + (data?.zmax - data?.zmin) * 0.25),
      //         Math.round(data?.zmin + (data?.zmax - data?.zmin) * 0.5),
      //         Math.round(data?.zmin + (data?.zmax - data?.zmin) * 0.75),
      //         Math.round(data?.zmax || 941)
      //     ]
      // },
      hoverongaps: false,
      // showscale: style?.showColorbar !== false,
      showscale: false,
    }]

    // 默认布局
    this.layout = {
      showlegend: false,
      // hovermode: 'closest',
      dragmode: 'pan',
      xaxis: {
        showgrid: true,
        zeroline: true,
        side: 'top',
        scaleanchor: 'y', // 锁定x轴和y轴的比例
        scaleratio: 1, // 设置比例为1:1
        constrain: 'domain', // 约束轴在其域内
      },
      yaxis: {
        showgrid: true,
        zeroline: true,
        // scaleanchor: 'x',    // 双向锁定
        // scaleratio: 1,
        constrain: 'domain', // 约束轴在其域内
      },
      margin: { t: 50, l: 50, r: 50, b: 50 },
      ...layout,
    }

    // 创建图表
    Plotly.newPlot(
      this.container,
      this.data,
      this.layout,
      {
        ...this.config,
        modeBarButtonsToAdd: [
          'zoom2d',
          'pan2d',
          {
            name: 'resetScale',
            title: '重置视图',
            click: (gd) => {
              Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true,
                // 'xaxis.scaleanchor': 'y',
                'xaxis.scaleratio': 1,
                'yaxis.scaleanchor': 1,
                'yaxis.constrain': 'domain',
              })
            },
          },
        ],
      },
    )

    // 添加事件监听器以保持比例
    this.container.on('plotly_relayout', () => {
      const layout = this.container._fullLayout
      if (!layout.xaxis.scaleanchor || layout.xaxis.scaleratio !== 1) {
        Plotly.relayout(this.container, {
          'xaxis.scaleanchor': 'y', // 锁定x轴和y轴的比例
          'xaxis.scaleratio': 1, // 设置比例为1:1
          'yaxis.constrain': 'domain', // 约束y轴在其域内
          'xaxis.constrain': 'domain', // 约束y轴在其域内
          'margin': { t: 50, l: 50, r: 50, b: 50 },
        })
      }
    })

    // 保存图表实例
    this.chart = this.container

    // this.addD3ColorBar(defaultColorBars, {
    //   width: 30,
    //   rightMargin: 20,
    //   labelSize: 12,
    // })
  }

  // 计算质心
  calculateCentroid(points) {
    if (!points || points.length < 3) {
      return { x: 0, y: 0 }
    }

    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)

    return {
      x: sumX / points.length,
      y: sumY / points.length,
    }
  }

  /**
   * 更新等值线图数据
   * @param {object} newData 新数据对象 {x: [], y: [], z: [[]]}
   */
  updateData(newData) {
    if (!newData || !newData.x || !newData.y || !newData.z) {
      console.warn('更新数据格式不正确')
      return
    }

    const update = {
      x: [newData.x],
      y: [newData.y],
      z: [newData.z],
    }

    Plotly.restyle(this.container, update)

    // 更新鹰眼图
    this.updateEagleEye()
  }

  /**
   * 更新布局
   * @param {object} newLayout 新布局配置
   */
  updateLayout(newLayout) {
    // 确保新布局不会破坏比例设置
    const updatedLayout = {
      ...newLayout,
      xaxis: {
        ...(newLayout.xaxis || {}),
        scaleanchor: 'y',
        scaleratio: 1,
        constrain: 'domain',
      },
      yaxis: {
        ...(newLayout.yaxis || {}),
        scaleanchor: 'x',
        scaleratio: 1,
      },
    }

    Plotly.relayout(this.container, updatedLayout)
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
   * 销毁图表
   */
  dispose() {
    if (this.container) {
      // 取消所有待处理的动画帧
      if (this._updateRAF) {
        cancelAnimationFrame(this._updateRAF)
        this._updateRAF = null
      }

      // 移除事件监听器
      if (this.eventManager) {
        this.eventManager.removeEvents()
        this.eventManager = null
      }

      // 清除图形工厂缓存
      ShapeFactory.clearCache()

      // 清除 Plotly 图表
      Plotly.purge(this.container)

      // 清除内部状态
      this.chart = null
      this.data = []
      this.layout = {}
      this.isDrawing = false
      this.drawingType = null
      this.drawingPoints = []
      this.tempPoint = null
      this.drawingShape = null
      this.shapeIdCounter = 1
      this.shapeFactory = null
      this._d3ColorBar = null

      // 清除鹰眼图
      if (this.eagleEyeContainer) {
        Plotly.purge(this.eagleEyeContainer)
        this.eagleEyeContainer = null
      }

      // 清除历史记录
      // this.history = []
      this.currentIndex = -1

      // 清除分组数据
      this.shapeGroups.clear()

      console.warn('等值线图已销毁')
    }
  }

  /**
   * 设置颜色范围
   * @param {Array} range [min, max]
   */
  setColorRange(range) {
    if (!Array.isArray(range) || range.length !== 2) {
      console.warn('颜色范围格式不正确')
      return
    }

    Plotly.restyle(this.container, {
      zmin: range[0],
      zmax: range[1],
    })
  }

  /**
   * 设置等值线间隔
   * @param {number} interval 间隔值
   */
  setContourInterval(interval) {
    if (typeof interval !== 'number') {
      console.warn('间隔值必须是数字')
      return
    }

    Plotly.restyle(this.container, {
      'contours.size': interval,
    })
  }

  /**
   * 设置绘制事件
   * @private
   */
  setupDrawingEvents() {
    const container = this.container

    // 移除节流，使用直接响应的方式处理mousemove
    const handleMouseMove = (event) => {
      if (!this.isDrawing) return

      const rect = event.target.getBoundingClientRect()
      const xaxis = container._fullLayout.xaxis
      const yaxis = container._fullLayout.yaxis

      // 获取鼠标在图表中的坐标
      const x = xaxis.p2d(event.clientX - rect.left)
      const y = yaxis.p2d(event.clientY - rect.top)

      // 直接更新临时点，不做额外过滤
      this.tempPoint = { x, y }

      // 直接调用光标位置更新，不经过完整的updateDrawingShape
      this._updateCursorPosition()
    }

    // 其他事件处理（点击和右键）
    const handleOtherEvents = (event) => {
      if (!this.isDrawing) return

      const rect = event.target.getBoundingClientRect()
      const xaxis = container._fullLayout.xaxis
      const yaxis = container._fullLayout.yaxis

      // 获取鼠标在图表中的坐标
      const x = xaxis.p2d(event.clientX - rect.left)
      const y = yaxis.p2d(event.clientY - rect.top)

      switch (event.type) {
        case 'click':
          // 添加点
          this.drawingPoints.push({ x, y })

          // 如果是绘制点或文本，点击一次后自动完成绘制
          if (this.drawingType === 'point' || this.drawingType === 'text') {
            this.finishDrawing()
            return
          }

          // 使用完整更新来重新绘制整个图形
          this.updateDrawingShape()
          break

        case 'contextmenu':
          event.preventDefault()

          // 对于多边形和折线，至少需要2个点才能完成绘制
          if ((this.drawingType === 'polygon' || this.drawingType === 'polyline') && this.drawingPoints.length < 2) {
            return
          }

          // 完成绘制
          this.finishDrawing()
          break
      }
    }

    // 创建事件管理器实例，分别处理鼠标移动和其他事件
    this.eventManager = new EventManager(container, {
      mousemove: handleMouseMove,
      click: handleOtherEvents,
      contextmenu: handleOtherEvents,
    })
    this.eventManager.addEvents()
  }

  /**
   * 仅更新光标位置的轻量级函数
   * 直接更新最后的点，而不重新绘制整个形状
   * @private
   */
  _updateCursorPosition() {
    if (!this.drawingShape || !this.tempPoint) return

    // 使用requestAnimationFrame以便与浏览器渲染周期同步
    if (this._cursorRAF) {
      cancelAnimationFrame(this._cursorRAF)
    }

    this._cursorRAF = requestAnimationFrame(() => {
      // 准备当前所有点
      const points = [...this.drawingPoints]
      if (this.tempPoint) {
        points.push(this.tempPoint)
      }

      // 如果没有点，不进行更新
      if (points.length === 0) return

      // 创建更简单的更新对象，只包含坐标
      let update = {
        x: [points.map((p) => p.x)],
        y: [points.map((p) => p.y)],
      }

      // 如果是多边形且有足够的点，需要闭合
      if (this.drawingType === 'polygon' && points.length > 0) {
        update.x[0].push(points[0].x)
        update.y[0].push(points[0].y)
      }

      // 使用Plotly.restyle进行高效更新
      // 只更新一个属性以提高性能
      Plotly.restyle(this.container, update, this.container.data.length - 1)
    })
  }

  /**
   * 更新绘制中的图形
   * @private
   */
  updateDrawingShape() {
    if (!this.drawingShape) return

    // 使用 requestAnimationFrame 进行防抖
    if (this._updateRAF) {
      cancelAnimationFrame(this._updateRAF)
    }

    this._updateRAF = requestAnimationFrame(() => {
      // 性能优化：只在有足够的点时才更新
      if (!this.drawingPoints.length && !this.tempPoint) return

      const points = [...this.drawingPoints]
      if (this.tempPoint) {
        points.push(this.tempPoint)
      }

      // 性能优化：检查点数量，避免过多点的渲染
      // 对于完整重绘情况下的优化，光标更新使用_updateCursorPosition
      if (points.length > 1000) {
        // 对于过多的点，可以采样处理
        const sampledPoints = this._samplePoints(points, 1000)
        points.length = 0
        points.push(...sampledPoints)
      }

      // 性能优化：准备一次性更新的属性
      let update = {
        x: [points.map((p) => p.x)],
        y: [points.map((p) => p.y)],
      }

      // 根据图形类型添加特定属性
      if (this.drawingType === 'polygon' && points.length > 0) {
        // 多边形需要闭合
        update.x[0].push(points[0].x)
        update.y[0].push(points[0].y)
      }

      // 更新图形 - 只更新一次，减少重绘
      Plotly.restyle(this.container, update, this.container.data.length - 1)
    })
  }

  /**
   * 对点进行采样，减少渲染点的数量
   * @private
   * @param {Array} points 原始点数组
   * @param {number} maxPoints 最大点数
   * @returns {Array} 采样后的点数组
   */
  _samplePoints(points, maxPoints) {
    if (points.length <= maxPoints) return points

    const step = Math.ceil(points.length / maxPoints)
    const result = []

    // 始终保留第一个和最后一个点
    result.push(points[0])

    // 按步长采样中间点
    for (let i = step; i < points.length - 1; i += step) {
      result.push(points[i])
    }

    // 添加最后一个点
    if (points.length > 1) {
      result.push(points[points.length - 1])
    }

    return result
  }

  /**
   * 开始绘制点
   * @param {object} options 点的样式配置选项
   */
  startDrawPoint(options = {}) {
    const command = new DrawingCommand(this, 'point', options)
    command.execute()
  }

  /**
   * 开始绘制折线
   * @param {object} options 折线样式配置选项
   */
  startDrawPolyline(options = {}) {
    // 使用更短的防抖延迟
    if (this._drawCommandTimeout) {
      clearTimeout(this._drawCommandTimeout)
    }

    this._drawCommandTimeout = setTimeout(() => {
      const command = new DrawingCommand(this, 'polyline', options)
      command.execute()
      this._drawCommandTimeout = null
    }, 5) // 减少延迟到5ms
  }

  /**
   * 开始绘制多边形
   * @param {object} options 多边形样式配置选项
   */
  startDrawPolygon(options = {}) {
    // 使用更短的防抖延迟
    if (this._drawCommandTimeout) {
      clearTimeout(this._drawCommandTimeout)
    }

    this._drawCommandTimeout = setTimeout(() => {
      const command = new DrawingCommand(this, 'polygon', options)
      command.execute()
      this._drawCommandTimeout = null
    }, 5) // 减少延迟到5ms
  }

  /**
   * 设置绘制完成的回调函数
   * @param {Function} callback 回调函数，参数为绘制的点数据和类型
   * @deprecated 请使用 .on('drawingComplete', callback) 方法代替
   */
  setDrawingCompleteCallback(callback) {
    console.warn('setDrawingCompleteCallback 方法已弃用，请使用 .on("drawingComplete", callback) 方法代替')
    this.onDrawingComplete = callback
    // 同时将回调添加到事件系统，确保两种方式都能工作
    if (typeof callback === 'function') {
      this.on('drawingComplete', callback)
    }
  }

  /**
   * 完成绘制
   * @private
   */
  finishDrawing() {
    if (!this.isDrawing || (this.drawingType !== 'point' && this.drawingType !== 'text' && this.drawingPoints.length < 2)) return

    // 移除临时图形
    Plotly.deleteTraces(this.container, this.container.data.length - 1)

    // 恢复鼠标样式和图表模式
    this.container.style.cursor = 'auto'
    Plotly.relayout(this.container, {
      'dragmode': 'pan',
      'hovermode': 'closest',
      'xaxis.fixedrange': false,
      'yaxis.fixedrange': false,
      'xaxis.scaleanchor': 'y',
      'xaxis.scaleratio': 1,
      'yaxis.constrain': 'domain',
    })

    // 创建最终图形
    const { shape, textShape } = this.drawingShape.createPlotlyShape(this.drawingPoints)
    Plotly.addTraces(this.container, shape)
    if (textShape) {
      Plotly.addTraces(this.container, textShape)
    }

    // 触发绘制完成事件
    const drawingData = {
      ...this.drawingShape.getProperties(),
      points: this.drawingPoints.map((p) => ({ x: p.x, y: p.y })),
      isClosed: this.drawingType === 'polygon',
    }

    // 触发事件
    this.emit('drawingComplete', drawingData)

    // 向后兼容：如果设置了回调函数，也调用它
    if (typeof this.onDrawingComplete === 'function') {
      try {
        this.onDrawingComplete(drawingData)
      } catch (error) {
        console.error('Error in drawing complete callback:', error)
      }
    }

    // 清理绘制状态
    this.cleanupDrawing()
  }

  /**
   * 取消绘制
   */
  cancelDrawing() {
    if (!this.isDrawing) return

    // 移除临时图形
    if (this.drawingShape) {
      Plotly.deleteTraces(this.container, this.container.data.length - 1)
    }

    // 恢复鼠标样式和图表模式
    this.container.style.cursor = 'auto'
    Plotly.relayout(this.container, {
      dragmode: 'pan',
      hovermode: 'closest',
    })

    this.cleanupDrawing()
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
    const eagleEyeData = [...this.data] // 复制主图数据
    eagleEyeData[0] = {
      ...eagleEyeData[0],
      showscale: false, // 不显示色标
      contours: {
        ...eagleEyeData[0].contours,
        showlabels: false, // 不显示等值线标签
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
        // scaleanchor: 'y',    // 锁定x轴和y轴的比例
        // scaleratio: 1,       // 设置比例为1:1
        side: 'top',
      },
      yaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
        // autorange: 'reversed',
        showline: false,
      },
      shapes: [{ // 添加视图框
        type: 'rect',
        xref: 'x',
        yref: 'y',
        x0: this.data[0].x[0],
        y0: this.data[0].y[0],
        x1: this.data[0].x[this.data[0].x.length - 1],
        y1: this.data[0].y[this.data[0].y.length - 1],
        fillcolor: 'rgba(255, 255, 255, 0.3)',
        line: {
          color: 'rgb(68, 68, 68)',
          width: 1,
          dash: 'solid',
        },
      }],
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

    // 监听主图的视图变化
    this.container.on('plotly_relayout', (eventData) => {
      if (eventData['xaxis.range[0]'] !== undefined) {
        // 更新鹰眼图中的视图框
        Plotly.relayout(container, {
          'shapes[0].x0': eventData['xaxis.range[0]'],
          'shapes[0].x1': eventData['xaxis.range[1]'],
          'shapes[0].y0': eventData['yaxis.range[0]'],
          'shapes[0].y1': eventData['yaxis.range[1]'],
        })
      }
    })
  }

  /**
   * 更新鹰眼图数据
   * @private
   */
  updateEagleEye() {
    if (!this.eagleEyeContainer) return

    // 更新鹰眼图数据
    const eagleEyeData = [...this.data]
    eagleEyeData[0] = {
      ...eagleEyeData[0],
      showscale: false,
      contours: {
        ...eagleEyeData[0].contours,
        showlabels: false,
      },
    }

    // 更新数据
    Plotly.update(this.eagleEyeContainer, eagleEyeData)
  }

  /**
   * 设置等值线的显示状态
   * @param {boolean} visible 是否显示等值线
   */
  setContoursVisible(visible = true) {
    const update = {
      'line.width': visible ? 1 : 0, // 当隐藏时将线宽设为0
      // 'contours': {
      //     showlines: visible,
      //     coloring: 'heatmap'  // 保持颜色渐变
      // }
    }

    // 更新主图
    Plotly.restyle(this.container, update, [0]) // 只更新第一个trace（等值线图层）

    // 同步更新鹰眼图
    if (this.eagleEyeContainer) {
      Plotly.restyle(this.eagleEyeContainer, update, [0]) // 只更新第一个trace
    }
  }

  /**
   * 更新图形属性
   * @param {string} shapeId 图形ID
   * @param {object} properties 要更新的属性
   */
  updateShapeProperties(shapeId, properties) {
    const traces = this.container.data
    for (let i = 0; i < traces.length; i++) {
      if (traces[i].customdata && traces[i].customdata[0].id === shapeId) {
        const updatedProperties = {
          ...traces[i].customdata[0],
          ...properties,
        }

        // 更新存储的属性
        Plotly.update(this.container, {
          customdata: [[updatedProperties]],
        }, {}, [i])

        // 如果更新了样式，同时更新图形外观
        if (properties.style) {
          const updateStyle = {
            'line.color': properties.style.color,
            'line.width': properties.style.width,
            'line.dash': properties.style.lineType === 'dash' ? 'dash' : 'solid',
            'opacity': properties.style.opacity,
          }

          // 如果是多边形，添加填充相关属性
          if (traces[i].fill === 'toself') {
            updateStyle.fillcolor = properties.style.fillColor
            updateStyle.opacity = properties.style.fillOpacity
          }

          Plotly.restyle(this.container, updateStyle, [i])
        }
        break
      }
    }
  }

  /**
   * 获取图形属性
   * @param {string} shapeId 图形ID
   * @returns {object | null} 图形属性
   */
  getShapeProperties(shapeId) {
    const traces = this.container.data
    for (const trace of traces) {
      if (trace.customdata && trace.customdata[0].id === shapeId) {
        return trace.customdata[0]
      }
    }
    return null
  }

  /**
   * 初始化已有的图形
   * @param {object} shapeData 图形数据
   */
  initShape(shapeData) {
    const {
      id,
      name,
      type,
      createTime,
      note = '',
      status = 'active',
      style = {},
      points = [],
    } = shapeData

    // 验证必要参数
    if (!id || !name || !type || !points.length) {
      console.warn('图形数据格式不正确')
      return
    }

    // 验证类型
    if (!['point', 'polyline', 'polygon', 'text'].includes(type)) {
      console.warn('图形类型必须是 point, polyline, polygon 或 text')
      return
    }

    // 对于线条和多边形，需要至少2个点
    if ((type === 'polyline' || type === 'polygon') && points.length < 2) {
      console.warn(`${type} 类型至少需要2个点`)
      return
    }

    // 创建图形属性
    const shapeProperties = {
      id,
      name,
      type,
      createTime: createTime || formatDate(new Date()),
      note,
      status,
      style: {},
    }

    // 根据类型设置样式属性
    switch (type) {
      case 'point':
        // 点样式
        shapeProperties.style = {
          color: style.color || 'red',
          size: style.size || 12,
          opacity: style.opacity ?? 1,
          symbol: style.symbol || 'circle',
        }
        break

      case 'polyline':
        // 折线样式
        shapeProperties.style = {
          color: style.color || '#F4F065',
          width: style.width || 2,
          opacity: style.opacity ?? 1,
          lineType: style.type || 'solid',
          marker: {
            show: style.marker?.show !== false,
            color: style.marker?.color || style.color || '#F4F065',
            size: style.marker?.size || 8,
            symbol: style.marker?.symbol || 'circle',
            opacity: style.marker?.opacity ?? 1,
          },
          text: {
            show: style.text?.show !== false,
            content: style.text?.content || '',
            color: style.text?.color || '#000000',
            size: style.text?.size || 12,
            fontFamily: style.text?.fontFamily || 'Arial',
            fontStyle: style.text?.fontStyle || 'normal',
            fontWeight: style.text?.fontWeight || 'normal',
          },
        }
        break

      case 'polygon':
        // 多边形样式
        shapeProperties.style = {
          lineStyle: {
            color: style.lineStyle?.color || '#F4F065',
            width: style.lineStyle?.width || 2,
            opacity: style.lineStyle?.opacity ?? 1,
            type: style.lineStyle?.type || 'solid',
          },
          fillStyle: {
            type: style.fillStyle?.type || 'color',
            color: style.fillStyle?.bgcolor || '#CAEA37',
            opacity: style.fillStyle?.opacity ?? 0.6,
            // 图案填充相关属性
            pattern: style.fillStyle?.pattern,
            fgcolor: style.fillStyle?.fgcolor,
            bgcolor: style.fillStyle?.bgcolor,
            size: style.fillStyle?.size,
            solidity: style.fillStyle?.solidity,
          },
          marker: {
            show: style.marker?.show !== false,
            color: style.marker?.color || style.lineStyle?.color || '#F4F065',
            size: style.marker?.size || 8,
            symbol: style.marker?.symbol || 'circle',
            opacity: style.marker?.opacity ?? 1,
          },
          text: {
            show: style.text?.show !== false,
            content: style.text?.content || '',
            color: style.text?.color || '#000000',
            size: style.text?.size || 12,
            fontFamily: style.text?.fontFamily || 'Arial',
            fontStyle: style.text?.fontStyle || 'normal',
            fontWeight: style.text?.fontWeight || 'normal',
          },
        }
        break

      case 'text':
        // 文本样式
        shapeProperties.style = {
          text: style.text || 'Text',
          color: style.color || '#000000',
          size: style.size || 16,
          fontFamily: style.fontFamily || 'Arial',
          fontStyle: style.fontStyle || 'normal',
          fontWeight: style.fontWeight || 'normal',
          opacity: style.opacity ?? 1,
          align: style.align || 'left',
          baseline: style.baseline || 'top',
        }
        break
    }

    // 创建基础图形对象
    const shape = {
      type: 'scatter',
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      hoverinfo: 'none',
      customdata: [shapeProperties],
    }

    // 根据类型设置特定属性
    switch (type) {
      case 'point':
        // 点图形
        shape.mode = 'markers'
        shape.marker = {
          color: shapeProperties.style.color,
          size: shapeProperties.style.size,
          symbol: shapeProperties.style.symbol,
          opacity: shapeProperties.style.opacity,
        }
        break

      case 'polyline':
        // 折线
        shape.mode = shapeProperties.style.marker.show ? 'lines+markers' : 'lines'
        shape.line = {
          color: shapeProperties.style.color,
          width: shapeProperties.style.width,
          dash: shapeProperties.style.lineType === 'dash' ? 'dash' : 'solid',
        }
        shape.opacity = shapeProperties.style.opacity
        if (shapeProperties.style.marker.show) {
          shape.marker = {
            color: shapeProperties.style.marker.color,
            size: shapeProperties.style.marker.size,
            symbol: shapeProperties.style.marker.symbol,
            opacity: shapeProperties.style.marker.opacity,
          }
        }
        break

      case 'polygon':
        // 多边形
        shape.mode = shapeProperties.style.marker.show ? 'lines+markers' : 'lines'
        shape.line = {
          color: shapeProperties.style.lineStyle.color,
          width: shapeProperties.style.lineStyle.width,
          dash: shapeProperties.style.lineStyle.type === 'dash' ? 'dash' : 'solid',
        }
        shape.fill = 'toself'

        // 根据填充类型设置填充属性
        if (shapeProperties.style.fillStyle.type === 'pattern') {
          shape.fillpattern = {
            shape: shapeProperties.style.fillStyle.pattern || '+',
            fgcolor: shapeProperties.style.fillStyle.fgcolor || shapeProperties.style.lineStyle.color,
            bgcolor: shapeProperties.style.fillStyle.bgcolor || 'white',
            size: shapeProperties.style.fillStyle.size || 8,
            solidity: shapeProperties.style.fillStyle.solidity ?? 0.3,
          }
          shape.opacity = 1
        } else {
          shape.fillcolor = shapeProperties.style.fillStyle.color
          shape.opacity = shapeProperties.style.fillStyle.opacity
        }

        if (shapeProperties.style.marker.show) {
          shape.marker = {
            color: shapeProperties.style.marker.color,
            size: shapeProperties.style.marker.size,
            symbol: shapeProperties.style.marker.symbol,
            opacity: shapeProperties.style.marker.opacity,
          }
        }

        // 闭合多边形
        shape.x.push(points[0].x)
        shape.y.push(points[0].y)
        break

      case 'text':
        // 文本
        shape.mode = 'text'
        shape.text = [shapeProperties.style.text]
        shape.textposition = `${shapeProperties.style.align} ${shapeProperties.style.baseline}`
        shape.textfont = {
          family: shapeProperties.style.fontFamily,
          size: shapeProperties.style.size,
          color: shapeProperties.style.color,
          style: shapeProperties.style.fontStyle,
          weight: shapeProperties.style.fontWeight,
        }
        shape.opacity = shapeProperties.style.opacity
        break
    }

    // 添加到图表
    Plotly.addTraces(this.container, shape)

    // 如果有文本配置且需要显示，添加文本图形
    if ((type === 'polyline' || type === 'polygon')
      && shapeProperties.style.text?.show
      && shapeProperties.style.text?.content) {
      // 计算质心位置
      const centroid = this.calculateCentroid(points)
      const textShape = {
        type: 'scatter',
        x: [centroid.x],
        y: [centroid.y],
        mode: 'text',
        text: [shapeProperties.style.text.content],
        textposition: 'middle center',
        textfont: {
          family: shapeProperties.style.text.fontFamily,
          size: shapeProperties.style.text.size,
          color: shapeProperties.style.text.color,
          style: shapeProperties.style.text.fontStyle,
          weight: shapeProperties.style.text.fontWeight,
        },
        hoverinfo: 'none',
        showlegend: false,
        customdata: [{
          id: `${id}_text`,
          parentId: id,
          type: `${type}_text`,
          createTime: shapeProperties.createTime,
          style: { ...shapeProperties.style.text },
        }],
      }
      Plotly.addTraces(this.container, textShape)
    }

    return id
  }

  /**
   * 根据ID删除图形
   * @param {string} shapeId 图形ID
   * @returns {boolean} 是否删除成功
   */
  deleteShapeById(shapeId) {
    const traces = this.container.data
    let deleted = false

    // 遍历所有图形
    for (let i = traces.length - 1; i >= 0; i--) {
      const trace = traces[i]
      if (trace.customdata && trace.customdata[0]) {
        const customdata = trace.customdata[0]

        // 检查是否是目标图形或其关联的文字图形
        if (customdata.id === shapeId
          || (customdata.parentId === shapeId
            && (customdata.type === 'polygon_text'
              || customdata.type === 'polyline_text'
              || customdata.type === 'point_text'))) {
          // 删除图形
          Plotly.deleteTraces(this.container, i)
          deleted = true
        }
      }
    }

    if (!deleted) {
      console.warn(`未找到ID为 ${shapeId} 的图形`)
    }

    return deleted
  }

  /**
   * 根据ID定位图形
   * @param {string} shapeId 图形ID
   * @param {object} options 定位选项
   * @param {number} options.padding 边距百分比 (0-1)
   * @returns {boolean} 是否定位成功
   */
  locateShapeById(shapeId, options = {}) {
    const { padding = 0.1 } = options

    if (!shapeId) {
      console.warn('图形ID不能为空')
      return false
    }

    const traces = this.container.data
    console.warn('正在查找图形:', shapeId)
    console.warn('当前图表中的图形数量:', traces.length)

    // 遍历所有图形
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i]

      // 检查是否有 customdata
      if (!trace.customdata || !trace.customdata[0]) {
        continue
      }

      const customdata = trace.customdata[0]
      console.warn('检查图形:', customdata.id, '类型:', customdata.type)

      // 检查是否是目标图形
      if (customdata.id === shapeId) {
        console.warn('找到目标图形:', customdata.id)

        // 计算图形的边界范围
        const xMin = Math.min(...trace.x)
        const xMax = Math.max(...trace.x)
        const yMin = Math.min(...trace.y)
        const yMax = Math.max(...trace.y)

        // 计算边距
        const xPadding = (xMax - xMin) * padding
        const yPadding = (yMax - yMin) * padding

        // 计算新的视图范围
        const xRange = [xMin - xPadding, xMax + xPadding]
        const yRange = [yMin - yPadding, yMax + yPadding]

        // 计算宽高比
        const xSpan = xRange[1] - xRange[0]
        const ySpan = yRange[1] - yRange[0]
        const containerAspect = this.container.clientWidth / this.container.clientHeight
        const dataAspect = xSpan / ySpan

        // 调整范围以保持原始比例
        if (dataAspect > containerAspect) {
          // 宽度主导，调整y轴范围
          const yCenter = (yRange[0] + yRange[1]) / 2
          const yHalfSpan = (xSpan / containerAspect) / 2
          yRange[0] = yCenter - yHalfSpan
          yRange[1] = yCenter + yHalfSpan
        } else {
          // 高度主导，调整x轴范围
          const xCenter = (xRange[0] + xRange[1]) / 2
          const xHalfSpan = (ySpan * containerAspect) / 2
          xRange[0] = xCenter - xHalfSpan
          xRange[1] = xCenter + xHalfSpan
        }

        // 更新视图范围
        const update = {
          'xaxis.range': xRange,
          'yaxis.range': yRange,
          'xaxis.scaleanchor': 'y',
          'xaxis.scaleratio': 1,
          'yaxis.constrain': 'domain',
          'margin': { t: 50, l: 50, r: 50, b: 50 },
        }

        // 应用更新
        Plotly.relayout(this.container, update)

        // 高亮显示该图形
        const originalColor = trace.line?.color
        const originalWidth = trace.line?.width

        if (originalColor && originalWidth) {
          // 临时改变样式
          Plotly.restyle(this.container, {
            'line.color': 'red',
            'line.width': originalWidth * 2,
          }, [i])

          // 1秒后恢复原样式
          setTimeout(() => {
            Plotly.restyle(this.container, {
              'line.color': originalColor,
              'line.width': originalWidth,
            }, [i])
          }, 1000)
        }

        return true
      }
    }

    console.warn(`未找到ID为 ${shapeId} 的图形`)
    return false
  }

  /**
   * 设置所有绘制图形的显示状态
   * @param {object} options 显示配置选项
   * @param {boolean} options.showPolyline 是否显示折线
   * @param {boolean} options.showPolygon 是否显示多边形
   * @param {boolean} options.showPoint 是否显示点
   * @param {boolean} options.showText 是否显示文字
   */
  setShapesVisibility(options = {}) {
    const {
      showPolyline = true,
      showPolygon = true,
      showPoint = true,
      showText = true,
    } = options

    const traces = this.container.data

    // 创建一个映射来存储多边形ID和其可见性
    const polygonVisibilityMap = {}

    // 创建一个映射来存储折线ID和其可见性
    const polylineVisibilityMap = {}

    // 遍历所有图形
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i]
      // 检查是否是我们绘制的图形（有customdata属性）
      if (trace.customdata && trace.customdata[0]) {
        const customdata = trace.customdata[0]
        const shapeType = customdata.type
        let visible = true
        let parentId

        // 根据类型决定是否显示
        switch (shapeType) {
          case 'polyline':
            visible = showPolyline
            // 记录折线ID和可见性
            polylineVisibilityMap[customdata.id] = visible
            break
          case 'polygon':
            visible = showPolygon
            // 记录多边形ID和可见性
            polygonVisibilityMap[customdata.id] = visible
            break
          case 'point':
            visible = showPoint
            break
          case 'text':
            visible = showText
            break
          case 'polygon_text':
            // 多边形的文字跟随多边形的可见性
            parentId = customdata.parentId
            if (polygonVisibilityMap[parentId] !== undefined) {
              visible = polygonVisibilityMap[parentId] && showText
            } else {
              visible = showPolygon && showText
            }
            break
          case 'polyline_text':
            // 折线的文字跟随折线的可见性
            parentId = customdata.parentId
            if (polylineVisibilityMap[parentId] !== undefined) {
              visible = polylineVisibilityMap[parentId] && showText
            } else {
              visible = showPolyline && showText
            }
            break
          default:
            visible = true // 未知类型默认显示
        }

        // 获取原始样式
        const originalStyle = customdata.style

        // 更新图形可见性和透明度
        const update = {
          visible,
        }

        // 根据图形类型设置正确的透明度
        if (visible) {
          if (shapeType === 'polygon') {
            // 多边形使用 fillOpacity
            update.opacity = originalStyle.fillOpacity ?? 0.6
          } else {
            // 其他类型使用普通 opacity
            update.opacity = originalStyle.opacity ?? 1
          }
        } else {
          // 隐藏时设置透明度为0
          update.opacity = 0
        }

        // 应用更新
        Plotly.restyle(this.container, update, [i])
      }
    }
  }

  /**
   * 更新指定图形的样式
   * @param {string} shapeId 图形ID
   * @param {string} type 图形类型 ('point', 'polyline', 'polygon', 或 'text')
   * @param {object} newStyle 新的样式配置（只需包含要更新的属性）
   * @returns {boolean} 是否更新成功
   */
  updateShapeStyle(shapeId, type, newStyle = {}) {
    if (!shapeId || !type || !newStyle) {
      console.warn('参数不完整')
      return false
    }

    if (!['point', 'polyline', 'polygon', 'text'].includes(type)) {
      console.warn('图形类型必须是 point, polyline, polygon 或 text')
      return false
    }

    const traces = this.container.data
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i]
      if (trace.customdata && trace.customdata[0].id === shapeId) {
        // 获取当前样式
        const currentCustomData = trace.customdata[0]
        let updatedStyle = {}

        // 根据图形类型处理样式更新
        switch (type) {
          case 'point':
            // 点样式
            updatedStyle = {
              ...currentCustomData.style,
              color: newStyle.color ?? currentCustomData.style.color,
              size: newStyle.size ?? currentCustomData.style.size,
              opacity: newStyle.opacity ?? currentCustomData.style.opacity,
              symbol: newStyle.symbol ?? currentCustomData.style.symbol,
            }
            break

          case 'polyline':
            // 折线样式
            updatedStyle = {
              ...currentCustomData.style,
              color: newStyle.color ?? currentCustomData.style.color,
              width: newStyle.width ?? currentCustomData.style.width,
              opacity: newStyle.opacity ?? currentCustomData.style.opacity,
              lineType: newStyle.lineType ?? currentCustomData.style.lineType,
            }

            // 更新标记点样式
            if (newStyle.marker) {
              updatedStyle.marker = {
                ...currentCustomData.style.marker,
                ...newStyle.marker,
              }
            }

            // 更新文本样式
            if (newStyle.text) {
              updatedStyle.text = {
                ...currentCustomData.style.text,
                ...newStyle.text,
              }
            }
            break

          case 'polygon':
            // 多边形样式
            updatedStyle = { ...currentCustomData.style }

            // 更新线条样式
            if (newStyle.lineStyle) {
              updatedStyle.lineStyle = {
                ...currentCustomData.style.lineStyle,
                ...newStyle.lineStyle,
              }
            }

            // 更新填充样式
            if (newStyle.fillStyle) {
              updatedStyle.fillStyle = {
                ...currentCustomData.style.fillStyle,
                ...newStyle.fillStyle,
              }
            }

            // 更新标记点样式
            if (newStyle.marker) {
              updatedStyle.marker = {
                ...currentCustomData.style.marker,
                ...newStyle.marker,
              }
            }

            // 更新文本样式
            if (newStyle.text) {
              updatedStyle.text = {
                ...currentCustomData.style.text,
                ...newStyle.text,
              }
            }
            break

          case 'text':
            // 文本样式
            updatedStyle = {
              ...currentCustomData.style,
              text: newStyle.text ?? currentCustomData.style.text,
              color: newStyle.color ?? currentCustomData.style.color,
              size: newStyle.size ?? currentCustomData.style.size,
              fontFamily: newStyle.fontFamily ?? currentCustomData.style.fontFamily,
              fontStyle: newStyle.fontStyle ?? currentCustomData.style.fontStyle,
              fontWeight: newStyle.fontWeight ?? currentCustomData.style.fontWeight,
              opacity: newStyle.opacity ?? currentCustomData.style.opacity,
              align: newStyle.align ?? currentCustomData.style.align,
              baseline: newStyle.baseline ?? currentCustomData.style.baseline,
            }
            break
        }

        // 更新存储的样式属性
        const updatedProperties = {
          ...currentCustomData,
          style: updatedStyle,
        }

        // 更新 customdata
        Plotly.update(this.container, {
          customdata: [[updatedProperties]],
        }, {}, [i])

        // 准备样式更新对象
        const styleUpdate = {}

        // 根据图形类型应用样式
        switch (type) {
          case 'point':
            // 点样式更新
            styleUpdate['marker.color'] = updatedStyle.color
            styleUpdate['marker.size'] = updatedStyle.size
            styleUpdate['marker.symbol'] = updatedStyle.symbol
            styleUpdate['marker.opacity'] = updatedStyle.opacity
            break

          case 'polyline':
            // 线条样式更新
            styleUpdate['line.color'] = updatedStyle.color
            styleUpdate['line.width'] = updatedStyle.width
            styleUpdate['line.dash'] = updatedStyle.lineType === 'dash' ? 'dash' : 'solid'
            styleUpdate.opacity = updatedStyle.opacity

            // 标记点样式
            if (updatedStyle.marker) {
              styleUpdate.mode = updatedStyle.marker.show ? 'lines+markers' : 'lines'
              if (updatedStyle.marker.show) {
                styleUpdate['marker.color'] = updatedStyle.marker.color
                styleUpdate['marker.size'] = updatedStyle.marker.size
                styleUpdate['marker.symbol'] = updatedStyle.marker.symbol
                styleUpdate['marker.opacity'] = updatedStyle.marker.opacity
              }
            }

            // 文本标注更新 (需要单独更新文本图形)
            this.updateTextShape(shapeId, updatedStyle.text)
            break

          case 'polygon':
            // 线条样式更新
            if (updatedStyle.lineStyle) {
              styleUpdate['line.color'] = updatedStyle.lineStyle.color
              styleUpdate['line.width'] = updatedStyle.lineStyle.width
              styleUpdate['line.dash'] = updatedStyle.lineStyle.type === 'dash' ? 'dash' : 'solid'
            }

            // 标记点样式
            if (updatedStyle.marker) {
              styleUpdate.mode = updatedStyle.marker.show ? 'lines+markers' : 'lines'
              if (updatedStyle.marker.show) {
                styleUpdate['marker.color'] = updatedStyle.marker.color
                styleUpdate['marker.size'] = updatedStyle.marker.size
                styleUpdate['marker.symbol'] = updatedStyle.marker.symbol
                styleUpdate['marker.opacity'] = updatedStyle.marker.opacity
              }
            }

            // 填充样式更新
            if (updatedStyle.fillStyle) {
              if (updatedStyle.fillStyle.type === 'pattern') {
                // 使用图案填充
                styleUpdate.fillpattern = {
                  shape: updatedStyle.fillStyle.pattern || '+',
                  fgcolor: updatedStyle.fillStyle.fgcolor || updatedStyle.lineStyle.color,
                  bgcolor: updatedStyle.fillStyle.bgcolor || 'white',
                  size: updatedStyle.fillStyle.size || 8,
                  solidity: updatedStyle.fillStyle.solidity ?? 0.3,
                }
                styleUpdate.opacity = 1
              } else {
                // 使用颜色填充
                styleUpdate.fillcolor = updatedStyle.fillStyle.color
                styleUpdate.opacity = updatedStyle.fillStyle.opacity
              }
            }

            // 文本标注更新 (需要单独更新文本图形)
            this.updateTextShape(shapeId, updatedStyle.text)
            break

          case 'text':
            // 文本样式更新
            styleUpdate.text = [updatedStyle.text]
            styleUpdate.textposition = `${updatedStyle.align} ${updatedStyle.baseline}`
            styleUpdate.textfont = {
              family: updatedStyle.fontFamily,
              size: updatedStyle.size,
              color: updatedStyle.color,
              style: updatedStyle.fontStyle,
              weight: updatedStyle.fontWeight,
            }
            styleUpdate.opacity = updatedStyle.opacity
            break
        }

        // 应用样式更新
        Plotly.restyle(this.container, styleUpdate, [i])
        return true
      }
    }

    console.warn(`未找到ID为 ${shapeId} 的图形`)
    return false
  }

  /**
   * 更新文本图形
   * @private
   * @param {string} parentId 父图形ID
   * @param {object} textStyle 文本样式
   */
  updateTextShape(parentId, textStyle) {
    if (!parentId || !textStyle) return false

    const traces = this.container.data
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i]
      if (trace.customdata && trace.customdata[0].parentId === parentId
        && (trace.customdata[0].type === 'polygon_text' || trace.customdata[0].type === 'polyline_text')) {
        // 获取当前文本数据
        const currentCustomData = trace.customdata[0]

        // 更新文本内容和样式
        const updatedTextStyle = {
          ...currentCustomData.style,
          ...textStyle,
        }

        // 更新 customdata
        const updatedProperties = {
          ...currentCustomData,
          style: updatedTextStyle,
        }

        Plotly.update(this.container, {
          customdata: [[updatedProperties]],
        }, {}, [i])

        // 更新文本显示
        const textUpdate = {
          visible: updatedTextStyle.show,
          text: [updatedTextStyle.content],
          textfont: {
            family: updatedTextStyle.fontFamily,
            size: updatedTextStyle.size,
            color: updatedTextStyle.color,
            style: updatedTextStyle.fontStyle,
            weight: updatedTextStyle.fontWeight,
          },
        }

        // 应用文本更新
        Plotly.restyle(this.container, textUpdate, [i])
        return true
      }
    }

    return false
  }

  /**
   * 更新颜色范围
   * @param {Array} colorScale 新的配色数组，格式为 [[pos, color], ...]
   * @param {object} contourConfig 等值线配置，包括是否显示等值线和颜色
   * @param {object} labelConfig 标注配置，包括是否显示标注和颜色
   */
  updateColorScale(colorScale, contourConfig = {}, labelConfig = {}) {
    if (!Array.isArray(colorScale) || colorScale.length < 2) {
      console.warn('配色数组格式不正确，至少需要包含两个颜色点')
      return
    }

    const updateConfig = {
      colorscale: [colorScale],
    }

    if (contourConfig.showLines !== undefined) {
      updateConfig['contours.showlines'] = contourConfig.showLines
    }

    if (contourConfig.color !== undefined) {
      updateConfig['line.color'] = contourConfig.color
    }

    if (labelConfig.showLabels !== undefined) {
      updateConfig['contours.showlabels'] = labelConfig.showLabels
    }

    if (labelConfig.color !== undefined) {
      updateConfig['contours.labelfont.color'] = labelConfig.color
    }

    // 只更新第一个 trace（等值线图层）
    Plotly.restyle(this.container, updateConfig, [0])

    // 如果存在鹰眼图，也更新鹰眼图
    if (this.eagleEyeContainer) {
      Plotly.restyle(this.eagleEyeContainer, updateConfig, [0])
    }
  }

  /**
   * 更新等值线图的配色和值域范围
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
      'colorscale': [colorscale],
      'colorbar.tickmode': 'array',
    }

    // 如果提供了新的值域范围，更新 zmin 和 zmax
    if (typeof zmin === 'number') {
      update.zmin = zmin
      this.data[0].zmin = zmin
    }
    if (typeof zmax === 'number') {
      update.zmax = zmax
      this.data[0].zmax = zmax
    }
    // 计算 colorbar 的刻度值
    const currentZmin = this.data[0].zmin
    const currentZmax = this.data[0].zmax

    update['colorbar.tickvals'] = Array.from(
      { length: colorscale.length },
      (_, i) => currentZmin + (currentZmax - currentZmin) * colorscale[i][0],
    )
    update['colorbar.ticktext'] = Array.from(
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
        'colorscale': [colorscale],
        'zmin': update.zmin,
        'zmax': update.zmax,
        'contours.ncontours': colorscale.length - 1,
      }
      Plotly.update(this.eagleEyeContainer, eagleEyeUpdate, {}, [0])
    }
  }

  /**
   * 同时更新图表的数据和颜色比例尺
   * @param {object} options 更新选项
   * @param {object} options.data 新数据对象 {x: [], y: [], z: [[]]}
   * @param {Array} options.colorscale 新的配色数组，格式为 [[pos, color], ...]
   * @param {number} [options.zmin] 新的最小值，如果不提供则使用数据中的最小值
   * @param {number} [options.zmax] 新的最大值，如果不提供则使用数据中的最大值
   */
  updateDataAndColorScale({ data, colorscale, zmin, zmax }) {
    // 验证数据
    if (!data || !data.x || !data.y || !data.z) {
      console.warn('更新数据格式不正确，需要提供 x, y, z 数组')
      return
    }

    // 验证颜色比例尺
    if (!Array.isArray(colorscale) || colorscale.length < 2) {
      console.warn('配色数组格式不正确，至少需要包含两个颜色点')
      return
    }

    // 如果没有提供 zmin 或 zmax，尝试从数据中计算
    if (zmin === undefined) {
      // 找出 z 中的最小值
      zmin = Number.MAX_SAFE_INTEGER
      for (let i = 0; i < data.z.length; i++) {
        for (let j = 0; j < data.z[i].length; j++) {
          if (!Number.isNaN(data.z[i][j]) && data.z[i][j] < zmin) {
            zmin = data.z[i][j]
          }
        }
      }
    }

    if (zmax === undefined) {
      // 找出 z 中的最大值
      zmax = Number.MIN_SAFE_INTEGER
      for (let i = 0; i < data.z.length; i++) {
        for (let j = 0; j < data.z[i].length; j++) {
          if (!Number.isNaN(data.z[i][j]) && data.z[i][j] > zmax) {
            zmax = data.z[i][j]
          }
        }
      }
    }

    // 准备数据更新
    const update = {
      'x': [data.x],
      'y': [data.y],
      'z': [data.z],
      'zmin': zmin,
      'zmax': zmax,
      'colorscale': [colorscale],
      'colorbar.tickmode': 'array',
    }

    // 更新内部数据引用
    this.data[0].x = data.x
    this.data[0].y = data.y
    this.data[0].z = data.z
    this.data[0].zmin = zmin
    this.data[0].zmax = zmax
    this.data[0].colorscale = colorscale

    // 计算 colorbar 的刻度值
    update['colorbar.tickvals'] = Array.from(
      { length: colorscale.length },
      (_, i) => zmin + (zmax - zmin) * colorscale[i][0],
    )
    update['colorbar.ticktext'] = Array.from(
      { length: colorscale.length },
      (_, i) => Math.round(zmin + (zmax - zmin) * colorscale[i][0]),
    )

    // 更新等值线配置
    update['contours.ncontours'] = colorscale.length - 1
    update['contours.start'] = zmin
    update['contours.end'] = zmax
    update['contours.size'] = (zmax - zmin) / (colorscale.length - 1)

    // 在一个操作中更新图表，减少重绘次数
    Plotly.restyle(this.container, update, [0])

    // 如果存在鹰眼图，也更新鹰眼图
    if (this.eagleEyeContainer) {
      const eagleEyeData = {
        ...data,
        showscale: false,
        contours: {
          ...this.data[0].contours,
          showlabels: false,
        },
      }

      Plotly.restyle(this.eagleEyeContainer, {
        'x': [eagleEyeData.x],
        'y': [eagleEyeData.y],
        'z': [eagleEyeData.z],
        'zmin': zmin,
        'zmax': zmax,
        'colorscale': [colorscale],
        'contours.ncontours': colorscale.length - 1,
      }, [0])
    }
  }

  /**
   * 获取当前等值线图的配色方案
   * @returns {Array} 配色数组，格式为 [[pos, color], ...]
   */
  getColorScale() {
    if (!this.container || !this.container.data || !this.container.data[0]) {
      console.warn('等值线图未初始化')
      return null
    }

    // 获取当前的 colorscale
    const currentColorscale = this.container.data[0].colorscale

    // 如果没有 colorscale，返回默认值
    if (!currentColorscale) {
      return defaultColorscale
    }

    // 返回当前配色方案的深拷贝
    return JSON.parse(JSON.stringify(currentColorscale))
  }

  /**
   * 获取当前等值线图的值域范围
   * @returns {object} 值域范围对象，包含 zmin 和 zmax
   */
  getValueRange() {
    if (!this.container || !this.container.data || !this.container.data[0]) {
      console.warn('等值线图未初始化')
      return null
    }

    const { zmin, zmax } = this.container.data[0]

    return {
      zmin: typeof zmin === 'number' ? zmin : null,
      zmax: typeof zmax === 'number' ? zmax : null,
    }
  }

  /**
   * 使用 D3.js 添加自定义颜色条
   * @param {Array} colorBars 颜色条配置，默认使用 defaultColorBars
   * @param {object} options 配置选项
   * @param {number} options.width 颜色条宽度，默认 30
   * @param {number} options.rightMargin 右侧边距，默认 20
   * @param {number} options.topMargin 顶部边距，默认 50
   * @param {number} options.bottomMargin 底部边距，默认 50
   * @param {string} options.labelColor 标签颜色，默认 '#000'
   * @param {number} options.labelSize 标签字体大小，默认 12
   * @param {string} options.fontFamily 字体，默认 'Arial'
   * @returns {HTMLElement} 创建的颜色条元素
   */
  addD3ColorBar(colorBars, options = {}) {
    if (!this.container) {
      console.warn('等值线图未初始化')
      return null
    }

    // 验证 colorBars 数据
    if (!Array.isArray(colorBars) || colorBars.length < 2) {
      console.warn('颜色条数据格式不正确，至少需要包含两个颜色点')
      return null
    }

    // 默认配置
    const {
      width = 30,
      rightMargin = 20,
      topMargin = 80,
      bottomMargin = 80,
      labelColor = '#000',
      labelSize = 12,
      fontFamily = 'Arial',
    } = options

    // 移除已存在的自定义颜色条
    this.removeD3ColorBar()

    // 检查容器可见性
    const containerStyle = window.getComputedStyle(this.container)
    if (containerStyle.display === 'none' || !this.container.clientHeight) {
      // 容器不可见，创建一个数据存储对象而不是实际渲染
      const colorBarData = {
        colorBars: [...colorBars],
        options: { ...options },
        pendingRender: true,
      }

      // 将数据存储在容器上，等待下次更新时使用
      this._pendingColorBar = colorBarData
      return null
    }

    // 创建 SVG 容器
    // 添加安全检查防止负值
    const containerHeight = Math.max(1, this.container.clientHeight - topMargin - bottomMargin)
    const containerWidth = width + 60 // 颜色条宽度 + 标签宽度

    // 创建 SVG 元素
    const svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'd3-color-bar')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('data-custom-colorbar', 'true')
      .style('position', 'absolute')
      .style('right', `${rightMargin}px`)
      .style('top', `${topMargin}px`)
      .style('bottom', `${bottomMargin}px`)
      .style('z-index', '1000')
      .style('pointer-events', 'none') // 防止干扰鼠标事件

    // 对颜色条数据进行排序（从小到大）
    const sortedColorBars = [...colorBars].sort((a, b) => Number(a[0]) - Number(b[0]))

    // 计算每个颜色块的高度，确保至少为1像素
    const blockHeight = Math.max(1, containerHeight / sortedColorBars.length)

    // 添加颜色块
    svg.selectAll('rect')
      .data(sortedColorBars)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => containerHeight - (i + 1) * blockHeight) // 从底部开始
      .attr('width', width)
      .attr('height', blockHeight)
      .attr('fill', (d) => d[1])
      .style('stroke', 'rgba(0,0,0,0.1)')
      .style('stroke-width', '0.5px')

    // 添加标签
    svg.selectAll('text')
      .data(sortedColorBars)
      .enter()
      .append('text')
      .attr('x', width + 5) // 标签位置在颜色条右侧
      .attr('y', (d, i) => containerHeight - (i + 0.5) * blockHeight) // 垂直居中
      .attr('dy', '0.35em') // 微调垂直对齐
      .attr('fill', labelColor)
      .attr('font-size', `${labelSize}px`)
      .attr('font-family', fontFamily)
      .style('text-anchor', 'start')
      .text((d) => d[0])

    // 保存引用和元数据
    this._d3ColorBar = svg.node()
    this._d3ColorBarData = {
      colorBars: sortedColorBars,
      options: { ...options },
    }

    return svg.node()
  }

  /**
   * 移除 D3 自定义颜色条
   */
  removeD3ColorBar() {
    // 清除待渲染数据
    if (this._pendingColorBar) {
      this._pendingColorBar = null
    }

    // 移除已存在的自定义颜色条
    if (this._d3ColorBar && this._d3ColorBar.parentNode) {
      this._d3ColorBar.parentNode.removeChild(this._d3ColorBar)
      this._d3ColorBar = null
      this._d3ColorBarData = null
    }

    // 查找并移除所有 D3 自定义颜色条
    if (this.container && this.container.parentNode) {
      const existingColorBars = this.container.parentNode.querySelectorAll('svg.d3-color-bar')
      existingColorBars.forEach((el) => {
        el.parentNode.removeChild(el)
      })
    }

    // 清除待更新标记
    this._pendingColorBarUpdate = false
  }

  /**
   * 更新 D3 自定义颜色条
   * @param {Array} colorBars 新的颜色条配置
   * @param {object} options 配置选项，同 addD3ColorBar
   */
  updateD3ColorBar(colorBars, options = {}) {
    if (!this._d3ColorBar) return this.addD3ColorBar(colorBars, options)

    // 获取SVG元素
    const svgElement = this._d3ColorBar.svg

    // 添加安全检查，确保 svgElement 是一个有效的 DOM 元素
    if (!svgElement || !(svgElement instanceof Element)) {
      // SVG 元素无效，创建新的颜色条
      return this.addD3ColorBar(colorBars, options)
    }

    const svgDisplay = window.getComputedStyle(svgElement).display

    // 如果SVG元素不可见，先记录数据但不执行更新逻辑
    if (svgDisplay === 'none' || !svgElement.clientHeight) {
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

  // /**
  //  * 移除D3颜色条
  //  */
  // removeD3ColorBar() {
  //   if (this._d3ColorBar?.svg?.parentNode) {
  //     this._d3ColorBar.svg.parentNode.removeChild(this._d3ColorBar.svg)
  //     this._d3ColorBar = null
  //     this._pendingColorBarUpdate = false
  //   }
  // }

  /**
   * 开始绘制文字
   * @param {object} options 文字样式配置选项
   * @param {string} options.text 文字内容，默认 'Text'
   * @param {string} options.color 文字颜色，默认 '#000000'
   * @param {number} options.size 文字大小，默认 16
   * @param {string} options.fontFamily 字体样式，默认 'Arial'
   * @param {string} options.fontStyle 字体样式，可选值：'normal', 'italic'，默认 'normal'
   * @param {string} options.fontWeight 字体粗细，可选值：'normal', 'bold'，默认 'normal'
   * @param {number} options.opacity 文字透明度 0-1，默认 1
   * @param {string} options.align 文字对齐方式，可选值：'left', 'center', 'right'，默认 'left'
   * @param {string} options.baseline 文字基线对齐方式，可选值：'top', 'middle', 'bottom'，默认 'top'
   */
  startDrawText(options = {}) {
    if (this.isDrawing) return
    this.isDrawing = true
    this.drawingType = 'text'
    this.drawingPoints = []

    // 解构样式配置，并提供默认值
    const {
      text = 'Text',
      color = '#000000',
      size = 16,
      fontFamily = 'Arial',
      fontStyle = 'normal',
      fontWeight = 'normal',
      opacity = 1,
      align = 'left',
      baseline = 'top',
    } = options

    // 创建文本图形对象
    const shape = this.shapeFactory.createShape('text', this.generateShapeId(), {
      text,
      color,
      size,
      fontFamily,
      fontStyle,
      fontWeight,
      opacity,
      align,
      baseline,
    })
    this.drawingShape = shape

    // 保存当前的视图范围
    const currentXRange = this.container._fullLayout.xaxis.range
    const currentYRange = this.container._fullLayout.yaxis.range

    // 更改鼠标样式为十字准线
    this.container.style.cursor = 'crosshair'

    // 更新 Plotly 图表配置，锁定比例
    Plotly.relayout(this.container, {
      'dragmode': false,
      'hovermode': false,
      'xaxis.fixedrange': true,
      'yaxis.fixedrange': true,
      'xaxis.range': currentXRange,
      'yaxis.range': currentYRange,
      'xaxis.scaleanchor': 'y',
      'xaxis.scaleratio': 1,
      'yaxis.constrain': 'domain',
    })

    this.setupDrawingEvents()

    // 添加临时文字图形
    const { shape: plotlyShape } = shape.createPlotlyShape([])
    Plotly.addTraces(this.container, plotlyShape)
  }

  /**
   * 清理绘制状态
   * @private
   */
  cleanupDrawing() {
    // 取消所有待处理的动画帧
    if (this._updateRAF) {
      cancelAnimationFrame(this._updateRAF)
      this._updateRAF = null
    }

    if (this._cursorRAF) {
      cancelAnimationFrame(this._cursorRAF)
      this._cursorRAF = null
    }

    // 移除事件监听
    if (this.eventManager) {
      this.eventManager.removeEvents()
      this.eventManager = null
    }

    // 重置状态
    this.isDrawing = false
    this.drawingType = null
    this.drawingPoints = []
    this.tempPoint = null
    this.drawingShape = null
  }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从0开始，所以需要加1
  const day = String(date.getDate()).padStart(2, '0')

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export default PlotlContourChart
