import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { NuxtWelcome } from '#components'

describe('NuxtWelcome', () => {
  it('can mount some component', async () => {
      const component = await mountSuspended(NuxtWelcome)
      expect(component.text()).toContain('Welcome to Nuxt')
  })
})
