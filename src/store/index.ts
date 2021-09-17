import { createStore } from 'vuex'
import { engagementDataResponse } from '@/store/mockData'

export default createStore({
  state: {
    data: engagementDataResponse
  },
  mutations: {
  },
  getters: {
    data: (state) => {
      const startDate = '1900-01-01T00:00:00.000Z'
      const endDate = (new Date()).toISOString()

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const diffTime = Math.abs(new Date(endDate) - new Date(startDate))
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 28)) + 1
      const dataPercentageToKeep = Math.min(100, (diffMonths / 12) * 100)

      const responseCopy = JSON.parse(JSON.stringify(state.data))

      delete responseCopy.world
      delete responseCopy.date

      const topics = []

      for (const key in responseCopy) {
        topics.push({ title: key, ...responseCopy[key] })
      }

      const topicsToKeep = Math.floor(topics.length * (dataPercentageToKeep / 100) * 3)
      topics.splice(topicsToKeep, topics.length)

      const articles = []

      for (const topic of topics) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const topicArticles = topic.articles.map(article => ({ article: article, topicId: topic.topic_id }))

        const articlesToKeep = Math.floor(topicArticles.length * (dataPercentageToKeep / 100) * 3)
        topicArticles.splice(articlesToKeep, topicArticles.length)

        articles.push(...topicArticles)
        delete topic.articles
      }

      const topicPoints = topics.map(topic => ({
        x: topic.x,
        y: topic.y,
        r: 120,
        pointData: {
          id: topic.topic_id,
          title: topic.title,
          _type: 'TOPIC'
        }
      }))

      const articlePoints = articles.map(({ article }) => {
        let overallScore = 2

        if (article.engagement > 70) {
          overallScore = 7
        }

        if (article.engagement > 85) {
          overallScore = 9
        }

        return {
          x: article.x,
          y: article.y,
          r: overallScore,
          pointData: {
            id: article.article_id,
            _type: 'ARTICLE'
          }
        }
      })

      return [
        topicPoints,
        articlePoints
      ]
    }
  }
})
