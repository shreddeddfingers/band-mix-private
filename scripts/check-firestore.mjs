import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log('Querying Firestore for users...');
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Found ${usersSnap.docs.length} users in Firestore:`);
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    console.log(`- [${data.role}] ${data.name} (id: ${data.id}, directorId: ${data.directorId})`);
  }

  console.log('\nQuerying Firestore for bands...');
  const bandsSnap = await getDocs(collection(db, 'bands'));
  console.log(`Found ${bandsSnap.docs.length} bands in Firestore:`);
  for (const doc of bandsSnap.docs) {
    const data = doc.data();
    console.log(`- ${data.name} (directorId: ${data.directorId || data.createdBy})`);
  }

  console.log('\nQuerying Firestore for invites...');
  const invitesSnap = await getDocs(collection(db, 'invites'));
  console.log(`Found ${invitesSnap.docs.length} invites in Firestore:`);
  for (const doc of invitesSnap.docs) {
    const data = doc.data();
    console.log(`- Code: ${data.code}, Studio: ${data.studioName}, Director: ${data.directorName} (${data.directorId})`);
  }
}

check().catch(console.error);
