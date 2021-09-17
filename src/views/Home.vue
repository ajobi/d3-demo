<template>
  <div class="home">
    <BubbleChartD3 :data="data" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import BubbleChartD3 from '@/components/BubbleChartD3.vue'

export default defineComponent({
  name: 'Home',
  components: { BubbleChartD3 },
  computed: {
    data () {
      return [
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          dataSet: this.$store.getters.data[0].map(d => {
            d.color = 'rgba(128, 128, 128, 0.8)'
            d.colorHover = 'rgba(128, 128, 128, 1)'
            return d
          })
        },
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          dataSet: this.$store.getters.data[1].map(d => {
            d.color = 'rgba(161, 210, 199, 0.8)'
            d.colorHover = 'rgba(161, 210, 199, 1)'
            return d
          })
        }
      ]
    }
  }
})
</script>

<style>
.home {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
