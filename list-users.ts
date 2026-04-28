import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

const listUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    console.log(`Found ${snapshot.size} users:`);
    snapshot.forEach(doc => {
      console.log(`- ${doc.data().email} (uid: ${doc.id}, role: ${doc.data().role}, admin: ${doc.data().isAdmin})`);
    });
  } catch(e) {
    console.error("Failed to fetch users:", e);
  }
  process.exit(0);
}
listUsers();
