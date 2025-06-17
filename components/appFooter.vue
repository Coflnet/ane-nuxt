<template>
  <footer class="bg-slate-800 border-t border-slate-700 py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-center md:justify-between items-center">
        <div class="mb-4 md:mb-0">
          <div class="flex items-center space-x-2">
            <UiLogo />
          </div>
          <UiFooterLabel
            :label="$t('advancedNotification')"
            :xs="true"
          />
        </div>

        <div class="flex items-center space-x-12">
          <div class="">
            <h3 class="font-medium text-white mb-2">
              {{ $t('resources') }}
            </h3>
            <ul class="space-y-2">
              <li>
                <UiLinkLabel
                  :href="'https://ane.coflnet.com/api/index.html'"
                  :gray="true"
                >
                  {{ $t('apiRef') }}
                </UiLinkLabel>
              </li>
              <li>
                <UiLinkLabel
                  :href="'https://discord.gg/vdjgMWDDzW'"
                  :gray="true"
                >
                  {{ $t('support') }}
                </UiLinkLabel>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium text-white mb-2">
              {{ $t('company') }}
            </h3>
            <ul class="space-y-2">
              <li>
                <UiLinkLabel
                  :href="'https://coflnet.com/privacy'"
                  :gray="true"
                >
                  {{ $t('privacy') }}
                </UiLinkLabel>
              </li>
              <li>
                <UiLinkLabel
                  :href="'https://coflnet.com/terms-of-service'"
                  :gray="true"
                >
                  {{ $t('tos') }}
                </UiLinkLabel>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <UiFooterLabel
        class="border-t mt-8 pt-6 border-slate-700 text-center"
        :label="$t('yearRights', new Date().getFullYear())"
        :sm="true"
      />
    </div>
  </footer>
</template>
