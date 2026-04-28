import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

const fixPosts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "posts"));
    let count = 0;
    for (const d of snapshot.docs) {
      if (d.data().isDraft === undefined) {
        await updateDoc(doc(db, "posts", d.id), { isDraft: false });
        count++;
      }
    }
    console.log(`Successfully fixed ${count} posts!`);
  } catch(e) {
    console.error("Failed to fix posts:", e);
  }
  process.exit(0);
}
fixPosts();
