import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCUC4ConlLR7nONsqECFc_8S5_rO9oiwuQ",
  authDomain: "car-sales-7ddec.firebaseapp.com",
  databaseURL: "https://car-sales-7ddec-default-rtdb.firebaseio.com",
  projectId: "car-sales-7ddec",
  storageBucket: "car-sales-7ddec.firebasestorage.app",
  messagingSenderId: "360924922585",
  appId: "1:360924922585:web:0f18b076fff3e82460f4c8"
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
export const storage = getStorage(app)
