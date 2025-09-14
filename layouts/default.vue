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
