import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

const seedPosts = async () => {
  const posts = [
    {
      title: "The Rise of the Micro-Computer: A Fad or the Future?",
      content: "<p>The sudden proliferation of so-called 'micro-computers' in the home has left many traditional businessmen scratching their heads. Brands like Commodore, Apple, and IBM are pushing these electronic typewriters into the hands of the youth.</p><p>But is it a mere passing fad? Some experts suggest that by the year 2000, there could be a computer in every neighborhood. Others scoff at the idea, citing the astronomical costs and complex 'programming' languages required to operate them.</p><p>Time will tell if the micro-computer is truly the future, or simply an expensive toy for the electronics enthusiast.</p>",
      authorId: "system_seed",
      authorEmail: "editor@thevoices.com",
      createdAt: Timestamp.now(),
      likesCount: 142
    },
    {
      title: "Wall Street Panic: Ripple Effects of Black Monday",
      content: "<p>The recent stock market crash has sent shockwaves through the financial sector, leaving many brokers devastated and investors questioning the stability of the global economy.</p><p>As trading floors attempt to recover from the unprecedented volume of sell-offs, analysts are pointing fingers at computerized trading systems that automatically trigger sales when prices drop.</p><p>The government is currently investigating these systems, suggesting that human oversight is desperately needed before the machines cause another economic catastrophe.</p>",
      authorId: "system_seed",
      authorEmail: "finance@thevoices.com",
      createdAt: Timestamp.now(),
      likesCount: 89
    },
    {
      title: "Space Shuttle Era: What It Means for the Common Man",
      content: "<p>The successful launch of the new Space Shuttle program promises a new era of reusable spacecraft, making orbital flight routine and potentially cheaper.</p><p>While astronauts celebrate the technical triumph, the common citizen wonders: when will civilian space travel become a reality? NASA remains tight-lipped, but ambitious engineers hint at commercial space stations within our lifetime.</p><blockquote>The final frontier is no longer a dream; it is a destination.</blockquote>",
      authorId: "system_seed",
      authorEmail: "science@thevoices.com",
      createdAt: Timestamp.now(),
      likesCount: 215
    },
    {
      title: "The Synthesizer Sound: Electronic Music Takes Over the Radio",
      content: "<p>Gone are the days of acoustic guitars dominating the airwaves. A new, strange, and entirely artificial sound is sweeping the nation.</p><p>The synthesizer, a massive electronic keyboard capable of producing otherworldly noises, is now the instrument of choice for pop musicians. Traditionalists argue that it lacks 'soul,' while the youth embrace the robotic, rhythmic beats.</p><p>Whether you love it or hate it, the electronic wave is here to stay, fundamentally altering the landscape of popular music.</p>",
      authorId: "system_seed",
      authorEmail: "arts@thevoices.com",
      createdAt: Timestamp.now(),
      likesCount: 304
    },
    {
      title: "Video Arcades: Corrupting Youth or Harmless Fun?",
      content: "<p>Parents are raising alarms over the sudden boom of 'Video Arcades' popping up in malls and storefronts across the city.</p><p>Teenagers are spending their entire allowances on games like Pac-Man and Space Invaders, staring blankly at glowing cathode-ray tubes for hours. Critics claim these games promote violence and truancy.</p><p>However, some sociologists argue that it improves hand-eye coordination and provides a safe social environment. The debate rages on as the quarters continue to flow.</p>",
      authorId: "system_seed",
      authorEmail: "culture@thevoices.com",
      createdAt: Timestamp.now(),
      likesCount: 56
    }
  ];

  console.log("Publishing articles to the front page...");
  for (const post of posts) {
    try {
      await addDoc(collection(db, "posts"), post);
      console.log(`Successfully published: ${post.title}`);
    } catch (e) {
      console.error(`Failed to publish ${post.title}:`, e);
    }
  }
  console.log("All articles published! The printing presses have stopped.");
  process.exit(0);
};

seedPosts();
