import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


// Firebase 
const firebaseConfig = {
	
 // Configuración del SDK 
  apiKey: "AIzaSyAKHWrSC2qjQEnBKmN3Edacnm5mDIEtGPo",
  authDomain: "autenticacion150626.firebaseapp.com",
  projectId: "autenticacion150626",
  storageBucket: "autenticacion150626.firebasestorage.app",
  messagingSenderId: "383422642994",
  appId: "1:383422642994:web:1319ab1a596ebb5b86352b",
  measurementId: "G-Z5CP86CR0G",
  databaseURL: "https://autenticacion150626-default-rtdb.firebaseio.com/"
	  
};
// Esto evita que se inicialice dos veces
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const auth = getAuth(app);

export { auth };
// Initialize Realtime Database and get a reference to the service
		export const database = getDatabase(app);