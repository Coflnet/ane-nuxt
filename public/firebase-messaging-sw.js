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
console.log('Firebase messaging initialized in service worker');

// Handle background messages
messaging.onBackgroundMessage(payload => {
  console.log("Background message received", payload);

  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  console.log("Notification data", data);
  self.registration.showNotification("hihihihi", {
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
  console.log('Notification clicked', event);

  const clickedNotification = event.notification;
  const notificationData = clickedNotification.data;

  clickedNotification.close();

  let urlToOpen = '/';

  if (event.action === 'view') {
    urlToOpen = notificationData.FCM_MSG.data.link || '/auctions';
    console.log('View Auction action clicked, opening URL:', urlToOpen);
  } else {
    urlToOpen = '/overview';
    console.log('Notification body clicked, opening URL:', urlToOpen);
  }

  event.waitUntil(clients.openWindow(urlToOpen));
});
