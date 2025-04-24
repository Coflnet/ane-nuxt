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

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body: body || '',
    icon: icon || '/icon.png',
    data: {
      ...data,
      FCM_MSG: payload
    },
    actions: [
      { action: 'view', title: 'View Auction' },
      { action: 'edit', title: 'Edit Auction' }
    ]
  });
});


self.addEventListener('notificationclick', event => {
  const clickedNotification = event.notification;
  const notificationData = clickedNotification.data;

  clickedNotification.close();


  if (event.action === 'view') {
    urlToOpen = notificationData.FCM_MSG.data.link || '/auctions';
  } else {
    urlToOpen = '/overview';
  }

  event.waitUntil(clients.openWindow(urlToOpen));
});
