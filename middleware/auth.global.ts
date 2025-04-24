
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;
  if (["/", "/register", "/login", "/forgot-password"].includes(to.path)) return;
  const userStore = useUserStore();
  if (!userStore.isLoggedIn) {
    return navigateTo('/register', { redirectCode: 301 });
  }
})

