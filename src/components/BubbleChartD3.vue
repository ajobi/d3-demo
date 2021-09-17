<template>
  <div :id="id" />
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
  methods: {
    drawChart () {
      d3.select(`#${this.id} > *`).remove()

      const chartWidth = window.innerWidth
      const chartHeight = window.innerHeight

      const coordinateScaleX = d3.scaleLinear()
      const coordinateScaleY = d3.scaleLinear()
      const radiusScale = d3.scaleLinear()

      const allData = []
      for (const dataSet of this.data) {
        allData.push(...dataSet.dataSet)
      }

      const minX = d3.min(allData, d => d.x)
      const maxX = d3.max(allData, d => d.x)
      const minY = d3.min(allData, d => d.y)
      const maxY = d3.max(allData, d => d.y)
      const minR = d3.min(allData, d => d.r)
      const maxR = d3.max(allData, d => d.r)

      const paddingX = Math.abs(minX * 0.2)
      const paddingY = Math.abs(minY * 0.2)

      const MIN_BUBBLE_RADIUS = Math.max(chartWidth / 1000, 2)
      const MAX_BUBBLE_RADIUS = Math.max(chartWidth / 50, 30)

      coordinateScaleX.domain([minX - paddingX, maxX + paddingX]).range([0, chartWidth])
      coordinateScaleY.domain([minY - paddingY, maxY + paddingY]).range([0, chartHeight])
      radiusScale.domain([minR, maxR]).range([MIN_BUBBLE_RADIUS, MAX_BUBBLE_RADIUS])

      const canvasChart = d3.select(`#${this.id}`).append('canvas')
        .attr('width', chartWidth)
        .attr('height', chartHeight)

      const context = canvasChart.node().getContext('2d')

      const drawPoints = () => {
        if (this.lastZoomEvent) {
          context.save()
          context.clearRect(0, 0, chartWidth, chartHeight)

          context.translate(this.lastZoomEvent.transform.x, this.lastZoomEvent.transform.y)
          context.scale(this.lastZoomEvent.transform.k, this.lastZoomEvent.transform.k)
        }

        context.fillStyle = this.background
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        for (const dataSet of this.data) {
          for (const point of dataSet.dataSet) {
            context.beginPath()
            context.fillStyle = point.color || 'rgba(128, 128, 128, 0.8)'

            const px = coordinateScaleX(point.x)
            const py = coordinateScaleY(point.y)
            const r = radiusScale(point.r)

            context.arc(px, py, r, 0, 2 * Math.PI, true)

            const isThisPointHovered = this.hoveredPoints.some(hoverPoint => hoverPoint.id === point.id)

            if (isThisPointHovered) {
              context.fillStyle = point.colorHover || 'rgba(128, 128, 128, 1)'
            }

            if (point.label && ((this.lastZoomEvent && this.lastZoomEvent.transform.k > 2) || isThisPointHovered)) {
              const textWidth = context.measureText(point.label).width
              context.fillText(point.label, px - (textWidth / 2), py - MAX_BUBBLE_RADIUS - 5)
            }

            context.closePath()
            context.fill()
          }
        }

        context.restore()
      }

      const zoom = d3.zoom()
        .translateExtent([[0, 0], [chartWidth, chartHeight]])
        .scaleExtent([this.minZoom, this.maxZoom])
        .on('zoom', (e) => {
          this.lastZoomEvent = e
          drawPoints()
        })

      d3.select(context.canvas).call(zoom)

      if (this.lastZoomEvent) {
        const { x, y, k } = this.lastZoomEvent.transform
        zoom.translateTo(d3.select(context.canvas), x, y)
        zoom.scaleTo(d3.select(context.canvas), k)
      }

      drawPoints()

      d3.select(context.canvas).on('mousemove', (event) => {
        this.hoveredPoints = []

        allData.forEach(point => {
          const circle = new Path2D()

          let px = coordinateScaleX(point.x)
          let py = coordinateScaleY(point.y)
          let r = radiusScale(point.r)

          if (this.lastZoomEvent) {
            const {
              x,
              y,
              k
            } = this.lastZoomEvent.transform

            px = px * k + x
            py = py * k + y
            r = r * k
          }

          circle.arc(px, py, r, 0, 2 * Math.PI, true)

          if (context.isPointInPath(circle, event.offsetX, event.offsetY)) {
            this.hoveredPoints.push(point)
          }
        })

        if (this.hoveredPoints.length > 0) {
          context.canvas.style.cursor = 'pointer'
          drawPoints()
        } else {
          context.canvas.style.cursor = 'auto'
          drawPoints()
        }
      })

      d3.select(context.canvas).on('click', () => {
        if (this.hoveredPoints.length > 0) {
          this.$emit('click', this.hoveredPoints)
        }
      })
    }
  }
}
</script>
