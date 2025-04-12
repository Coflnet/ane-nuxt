
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;
  if (["/", "/register", "/login"].includes(to.path)) return;
  const userStore = useUserStore();
  if (!userStore.isLoggedIn && to.path != "/register" && to.path != "/login") {
    return navigateTo('/register', { redirectCode: 301 });
  }
})

