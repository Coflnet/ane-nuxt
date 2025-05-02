<template>
  <footer class="bg-slate-800 border-t border-slate-700 py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-center items-center">
        <div class="mb-4 md:mb-0">
          <div class="flex items-center space-x-2">
            <UiLogo />
          </div>
          <UiFooterLabel :label="$t('advancedNotification')" :xs="true" />
        </div>

        <div class="flex items-center space-x-12">
          <div class="">
            <h3 class="font-medium text-white mb-2">{{ $t('resources') }}</h3>
            <ul class="space-y-2">
              <li>
                <UiTextButton @on-click="navigateTo('https://ane.coflnet.com/api/index.html')" :gray="true" :sm="true">
                  {{ $t('apiRef') }}
                </UiTextButton>
              </li>
              <li>
                <UiTextButton @on-click="navigateTo('https://discord.gg/vdjgMWDDzW')" :gray="true" :sm="true">
                  {{ $t('support') }}
                </UiTextButton>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium text-white mb-2">{{ $t('company') }}</h3>
            <ul class="space-y-2">
              <li>
                <UiTextButton @on-click="navigateTo('https://coflnet.com/privacy')" :gray="true" :sm="true">
                  {{ $t('privacy') }}
                </UiTextButton>
              </li>
              <li>
                <UiTextButton @on-click="navigateTo('https://coflnet.com/terms-of-service')" :gray="true" :sm="true">
                  {{ $t('tos') }}
                </UiTextButton>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <UiFooterLabel class="border-t mt-8 pt-6 border-slate-700 text-center"
        :label="$t('yearRights', new Date().getFullYear())" :sm="true" />
    </div>
  </footer>
</template>
