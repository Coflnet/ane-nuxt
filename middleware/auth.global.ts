export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore();
  await userStore.loadUser();
  console.log(userStore.isLoggedIn);
  if (!userStore.isLoggedIn && to.path != "/register" && to.path != "/login") {
    console.log('hekk')
    return navigateTo('/register', { redirectCode: 301 });
  }
})

