self.addEventListener(
  "notificationclick",
  function (event) {
    if (!event.action) {
      console.log("Notification Click.");
      var url = '';
      if (event.notification.data.toString().startsWith("http"))
        url = event.notification.data;
      else
        url = event.notification.data.FCM_MSG?.data?.link ?? event.notification.data.link;
      event.waitUntil(clients.openWindow(url));
      event.notification.close();
      return;
    }
    switch (event.action) {
      case "view":
        clients.openWindow(event.notification.data.FCM_MSG?.data?.link ?? event.notification.data.link);
        event.notification.close();
        break;
      case "edit":
        console.log("User clicked on Edit button.", event);
        let id = event.notification.data.id;
        let token = event.notification.data.token;
        if (!id) {
          id = event.notification.data.FCM_MSG?.data?.id;
          token = event.notification.data.FCM_MSG?.data?.token;
        }
        clients.openWindow("https://ane.coflnet.com/edit/" + id + "?token=" + token);
        event.notification.close();
        break;
      case "any_other_action":
        clients.openWindow("https://ane.coflnet.com");
        break;
    }
  },
  false,
);
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyB8B7BaoOT_PhPJaa2peh2a_Q8VKDOb0yU",
  authDomain: "anenotifier.firebaseapp.com",
  projectId: "anenotifier",
  storageBucket: "anenotifier.firebasestorage.app",
  messagingSenderId: "625983368920",
  appId: "1:625983368920:web:04af5415ef9a54d14331ad"
})


console.log('Service worker loaded')

const messaging = firebase.messaging()

console.log(messaging)

messaging.onBackgroundMessage(payload => {
  console.log("starting")
  const { title, body } = payload.notification
  console.log('Background message received', payload)
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',

  })
})

