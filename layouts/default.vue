<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const i18nHead = useLocaleHead()

useSeoMeta({
  title: t('site.title'),
  description: t('site.description'),
  keywords: t('site.keywords'),
  author: t('site.author'),
  ogTitle: t('meta.ogTitle'),
  ogDescription: t('meta.ogDescription'),
  ogType: 'website',
})

// JSON-LD structured data for SEO
useHead({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify([
      {
        '@type': 'HowTo',
        name: t('structuredData.howTo.main.name'),
        description: t('structuredData.howTo.main.description'),
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: t('structuredData.howTo.main.step1Name'),
            text: t('structuredData.howTo.main.step1Text')
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: t('structuredData.howTo.main.step2Name'),
            text: t('structuredData.howTo.main.step2Text')
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: t('structuredData.howTo.main.step3Name'),
            text: t('structuredData.howTo.main.step3Text')
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: t('structuredData.howTo.main.step4Name'),
            text: t('structuredData.howTo.main.step4Text')
          }
        ],
        tool: [
          {
            '@type': 'HowToTool',
            name: t('structuredData.howTo.main.toolName')
          }
        ]
      },
      {
        '@type': 'HowTo',
        name: t('structuredData.howTo.download.name'),
        description: t('structuredData.howTo.download.description'),
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: t('structuredData.howTo.download.step1Name'),
            text: t('structuredData.howTo.download.step1Text')
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: t('structuredData.howTo.download.step2Name'),
            text: t('structuredData.howTo.download.step2Text')
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: t('structuredData.howTo.download.step3Name'),
            text: t('structuredData.howTo.download.step3Text')
          }
        ]
      },
      {
        '@type': 'HowTo',
        name: t('structuredData.howTo.presentation.name'),
        description: t('structuredData.howTo.presentation.description'),
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: t('structuredData.howTo.presentation.step1Name'),
            text: t('structuredData.howTo.presentation.step1Text')
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: t('structuredData.howTo.presentation.step2Name'),
            text: t('structuredData.howTo.presentation.step2Text')
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: t('structuredData.howTo.presentation.step3Name'),
            text: t('structuredData.howTo.presentation.step3Text')
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: t('structuredData.howTo.presentation.step4Name'),
            text: t('structuredData.howTo.presentation.step4Text')
          }
        ]
      },
      {
        '@type': 'WebApplication',
        name: t('site.name'),
        description: t('meta.applicationDescription'),
        url: 'https://nosleep.williamchong.cloud',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web Browser',
        author: {
          '@type': 'Person',
          name: t('site.author'),
          url: 'https://blog.williamchong.cloud'
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: t('structuredData.faq.useCases.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.useCases.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.howItWorks.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.howItWorks.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.safety.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.safety.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.browserSupport.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.browserSupport.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.timerFeature.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.timerFeature.answer')
            }
          },
          {
            '@type': 'Question',
            name: t('structuredData.faq.properUsage.question'),
            acceptedAnswer: {
              '@type': 'Answer',
              text: t('structuredData.faq.properUsage.answer')
            }
          }
        ]
      }
    ])
    }
  ]
})

</script>

<style>
/* Fix overscroll bounce showing white background on iOS/Safari */
html {
  background-color: white;
}

html.dark {
  background-color: rgb(17 24 39); /* gray-900 */
}
</style>
