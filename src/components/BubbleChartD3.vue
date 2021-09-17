<template>
  <div :id="id" />
</template>

<script>
import * as d3 from 'd3'

const BACKGROUND_ARTICLE = 'rgba(161,210,199,0.8)'
const BACKGROUND_TOPIC = 'rgba(128, 128, 128, 0.8)'
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
      default: 8
    },
    background: {
      type: String,
      default: '#EEE'
    }
  },
  mounted () {
    let timeout = null

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

      const minX = d3.min(this.data, d => d.x)
      const maxX = d3.max(this.data, d => d.x)
      const minY = d3.min(this.data, d => d.y)
      const maxY = d3.max(this.data, d => d.y)
      const minR = d3.min(this.data, d => d.r)
      const maxR = d3.max(this.data, d => d.r)

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

      this.lastZoomEvent = null

      const drawPoints = () => {
        context.fillStyle = this.background
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        for (const point of this.data) {
          context.beginPath()
          context.fillStyle = point.pointData._type === 'ARTICLE' ? BACKGROUND_ARTICLE : BACKGROUND_TOPIC

          const px = coordinateScaleX(point.x)
          const py = coordinateScaleY(point.y)
          const r = radiusScale(point.r)

          context.arc(px, py, r, 0, 2 * Math.PI, true)

          if (point.pointData._type === 'TOPIC' && this.lastZoomEvent && this.lastZoomEvent.transform.k > 2) {
            const textWidth = context.measureText(point.pointData.title).width
            context.fillText(point.pointData.title, px - (textWidth / 2), py - MAX_BUBBLE_RADIUS - 5)
          }

          context.closePath()
          context.fill()
        }
      }

      drawPoints()

      d3.select(context.canvas).call(d3.zoom()
        .translateExtent([[0, 0], [chartWidth, chartHeight]])
        .scaleExtent([this.minZoom, this.maxZoom])
        .on('zoom', (e) => {
          context.save()
          context.clearRect(0, 0, chartWidth, chartHeight)

          context.translate(e.transform.x, e.transform.y)
          context.scale(e.transform.k, e.transform.k)

          drawPoints()
          context.restore()
          this.lastZoomEvent = e
        }))

      let hoveredPoint = null

      d3.select(context.canvas).on('mousemove', (event) => {
        hoveredPoint = null

        this.data.forEach(point => {
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
            hoveredPoint = point
          }
        })

        if (hoveredPoint) {
          context.canvas.style.cursor = 'pointer'
        } else {
          context.canvas.style.cursor = 'auto'
        }
      })

      d3.select(context.canvas).on('click', () => {
        if (hoveredPoint) {
          alert(`${hoveredPoint.pointData._type} - ${hoveredPoint.pointData.id}`)
        }
      })
    }
  }
}
</script>
