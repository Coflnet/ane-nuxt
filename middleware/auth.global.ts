export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore();
  await userStore.loadUser();
  console.log(userStore.getUser)
})

