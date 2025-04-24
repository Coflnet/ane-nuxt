
self.addEventListener('notificationclick', event => {
  const clickedNotification = event.notification;
  const notificationData = clickedNotification.data;

  if (event.action === 'view') {
    urlToOpen = notificationData.FCM_MSG.data.link || '/auctions';
  }
  if (event.action == 'edit') {
    urlToOpen = notificationData.FCM_MSG.data?.id ? "https://ane.dealsfilters/create?id=" + notificationData.FCM_MSG.data.id : 'https://ane.deals/filters';
  } else {
    urlToOpen = '/overview';
  }

  event.waitUntil(clients.openWindow(urlToOpen));
  clickedNotification.close();
});


importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB8B7BaoOT_PhPJaa2peh2a_Q8VKDOb0yU",
  authDomain: "anenotifier.firebaseapp.com",
  projectId: "anenotifier",
  storageBucket: "anenotifier.firebasestorage.app",
  messagingSenderId: "625983368920",
  appId: "1:625983368920:web:04af5415ef9a54d14331ad"
});

const messaging = firebase.messaging();

