import { getAllPosts } from './src/lib/db.js';

const testQuery = async () => {
  try {
    const posts = await getAllPosts();
    console.log(`Found ${posts.length} posts!`);
  } catch(e) {
    console.error("Query failed:", e);
  }
  process.exit(0);
}
testQuery();
