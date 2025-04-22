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

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification
  console.log('Background message received', payload)
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
  })
})
