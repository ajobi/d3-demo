<template>
  <div :id="id" :style="{ backgroundColor: background }"/>
</template>

<script>
import * as d3 from 'd3'

const DEBOUNCE_TIME = 5

export default {
  props: {
    id: {
      type: String,
      default: 'chart-1'
    },
    data: {
      type: Array,
      default: () => []
    },
    minZoom: {
      type: Number,
      default: 1
    },
    maxZoom: {
      type: Number,
      default: 4
    },
    background: {
      type: String,
      default: '#EEE'
    }
  },
  mounted () {
    let timeout = null

    this.lastZoomEvent = null
    this.hoveredPoints = []

    window.addEventListener('resize', () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        this.drawChart()
      }, DEBOUNCE_TIME)
    })

    this.drawChart()
  },
  computed: {
    allData () {
      const allData = []
      for (const dataSet of this.data) {
        allData.push(...dataSet)
      }
      return allData
    }
  },
  methods: {
    drawChart () {
      d3.select(`#${this.id} > *`).remove()

      this.chartWidth = this.$el.offsetWidth
      this.chartHeight = this.$el.offsetHeight

      this.coordinateScaleX = d3.scaleLinear()
      this.coordinateScaleY = d3.scaleLinear()
      this.radiusScale = d3.scaleLinear()

      const minX = d3.min(this.allData, d => d.x)
      const maxX = d3.max(this.allData, d => d.x)
      const minY = d3.min(this.allData, d => d.y)
      const maxY = d3.max(this.allData, d => d.y)
      const minR = d3.min(this.allData, d => d.r)
      const maxR = d3.max(this.allData, d => d.r)

      const paddingX = Math.abs(minX * 0.2)
      const paddingY = Math.abs(minY * 0.2)

      this.MIN_BUBBLE_RADIUS = Math.max(this.chartWidth / 1000, 2)
      this.MAX_BUBBLE_RADIUS = Math.max(this.chartWidth / 50, 30)

      this.coordinateScaleX.domain([minX - paddingX, maxX + paddingX]).range([0, this.chartWidth])
      this.coordinateScaleY.domain([minY - paddingY, maxY + paddingY]).range([0, this.chartHeight])
      this.radiusScale.domain([minR, maxR]).range([this.MIN_BUBBLE_RADIUS, this.MAX_BUBBLE_RADIUS])

      const canvasChart = d3.select(`#${this.id}`).append('canvas').attr('width', this.chartWidth).attr('height', this.chartHeight)
      this.context = canvasChart.node().getContext('2d')

      const zoom = d3.zoom()
        .translateExtent([[0, 0], [this.chartWidth, this.chartHeight]])
        .scaleExtent([this.minZoom, this.maxZoom])
        .on('zoom', this.zoom)

      d3.select(this.context.canvas).call(zoom)

      if (this.lastZoomEvent) {
        const { x, y, k } = this.lastZoomEvent.transform
        zoom.translateTo(d3.select(this.context.canvas), x, y)
        zoom.scaleTo(d3.select(this.context.canvas), k)
      }

      this.drawPoints()
      this.zoom()

      d3.select(this.context.canvas).on('mousemove', this.mouseMove)
      d3.select(this.context.canvas).on('click', this.click)
    },
    zoom (event) {
      this.lastZoomEvent = event || this.lastZoomEvent

      if (!this.lastZoomEvent) {
        return
      }

      this.context.save()
      this.context.clearRect(0, 0, this.chartWidth, this.chartHeight)

      this.context.translate(this.lastZoomEvent.transform.x, this.lastZoomEvent.transform.y)
      this.context.scale(this.lastZoomEvent.transform.k, this.lastZoomEvent.transform.k)

      this.drawPoints()

      this.context.restore()
    },
    click () {
      if (this.hoveredPoints.length > 0) {
        this.$emit('click', this.hoveredPoints)
      }
    },
    drawPoints () {
      this.context.fillStyle = this.background
      this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height)

      for (const point of this.allData) {
        this.context.beginPath()
        this.context.fillStyle = point.color || 'rgba(128, 128, 128, 0.8)'

        const px = this.coordinateScaleX(point.x)
        const py = this.coordinateScaleY(point.y)
        const r = this.radiusScale(point.r)

        this.context.arc(px, py, r, 0, 2 * Math.PI, true)

        const isThisPointHovered = this.hoveredPoints.some(hoverPoint => hoverPoint.id === point.id)

        if (isThisPointHovered) {
          this.context.fillStyle = point.colorHover || 'rgba(128, 128, 128, 1)'
        }

        if (point.label && ((this.lastZoomEvent && this.lastZoomEvent.transform.k > 2) || isThisPointHovered)) {
          const textWidth = this.context.measureText(point.label).width
          this.context.fillText(point.label, px - (textWidth / 2), py - this.MAX_BUBBLE_RADIUS - 5)
        }

        this.context.closePath()
        this.context.fill()
      }
    },
    mouseMove (event) {
      this.hoveredPoints = []

      this.allData.forEach(point => {
        const circle = new Path2D()

        let px = this.coordinateScaleX(point.x)
        let py = this.coordinateScaleY(point.y)
        let r = this.radiusScale(point.r)

        if (this.lastZoomEvent) {
          const { x, y, k } = this.lastZoomEvent.transform

          px = px * k + x
          py = py * k + y
          r = r * k
        }

        circle.arc(px, py, r, 0, 2 * Math.PI, true)

        if (this.context.isPointInPath(circle, event.offsetX, event.offsetY)) {
          this.hoveredPoints.push(point)
        }
      })

      this.drawPoints()
      this.zoom()
      this.context.canvas.style.cursor = this.hoveredPoints.length > 0 ? 'pointer' : 'auto'
    }
  }
}
</script>
