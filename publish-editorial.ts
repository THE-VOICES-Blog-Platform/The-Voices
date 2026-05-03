import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

const editorialArticles = [
  {
    title: "The Physical Ceiling of the Digital Mind",
    content: `
      <p>We talk about AI as if it’s a ghost in the machine, something ethereal and infinite. But the reality is far heavier, built on silicon and memory that we are rapidly running out of.</p>
      <p>The tech world is currently staring at a crisis dubbed "RAMageddon." As AI data centers expand at a relentless pace, the demand for High-Bandwidth Memory (HBM) has officially outstripped global production capacities. Major suppliers have issued a stark warning: the shortage will persist through 2027. We’ve reached a point where our software ambitions have finally hit the physical wall of our hardware reality.</p>
      <p>This isn't just a supply chain hiccup; it’s a bottleneck for progress. In India, where the push for indigenous AI and data sovereignty is accelerating, the scarcity of these core components could delay critical infrastructure. Globally, it forces a conversation about the sustainability of "growth at all costs" in the silicon age.</p>
      <p>We are entering an era of forced optimization. For years, inefficient code was masked by faster hardware. Now, developers must learn to be "lean" again. This shortage might actually be the catalyst we need to move away from brute-force AI models toward more elegant, efficient architectures.</p>
      <blockquote>Perhaps a limit on memory is exactly what we need to remember the value of focus.</blockquote>
    `,
    category: "Technology",
    authorId: "editorial_engine",
    authorEmail: "tech@thevoices.com",
    createdAt: Timestamp.now(),
    likesCount: 0,
    viewsCount: 0,
    isDraft: false,
    violationCount: 0
  },
  {
    title: "The Quiet Reshuffling of the Indian Wallet",
    content: `
      <p>Banking used to be about marble pillars and heavy ledgers. Today, it’s a line of code on a smartphone—and as we’ve recently seen, that code can be rewritten or revoked in an instant.</p>
      <p>The Indian financial landscape is shifting beneath our feet. The Reserve Bank of India’s decision to cancel the banking license of Paytm Payments Bank marks the end of an era for the country’s fintech pioneer. Simultaneously, traditional giants like Axis Bank are leaning so heavily into digital-first transformations that they are beginning to shed human headcount in favor of automated systems.</p>
      <p>This is the "Growing Pains" phase of Digital India. We are moving from the chaotic, "move fast and break things" stage of fintech to a period of rigorous, adult-like regulation. For the millions of users who relied on these digital gateways, it’s a reminder that convenience always comes with a layer of institutional risk.</p>
      <p>The real story isn't about one company failing or another automating. It’s about the erosion of the "middle ground." Banking is becoming either hyper-regulated and traditional or hyper-efficient and invisible. The human element of the "local bank manager" is being replaced by a sophisticated algorithm that doesn't know your face, only your credit score.</p>
      <blockquote>In our rush toward a cashless future, we must ensure we don't end up with a heartless one.</blockquote>
    `,
    category: "India",
    authorId: "editorial_engine",
    authorEmail: "finance@thevoices.com",
    createdAt: Timestamp.now(),
    likesCount: 0,
    viewsCount: 0,
    isDraft: false,
    violationCount: 0
  },
  {
    title: "The Fragility of a Silence",
    content: `
      <p>Peace is often described as the absence of war, but in the modern world, it feels more like a held breath. It is fragile, temporary, and requires constant maintenance to keep from shattering.</p>
      <p>The US-brokered ceasefire in the Middle East currently stands as a testament to this fragility. While the guns have largely fallen silent, reports of violations and deep-seated skepticism from global leaders suggest that the peace is more of a tactical pause than a philosophical shift. At the same time, the strategic movement of troops across Europe highlights a continent that is still very much on edge, recalibrating its defenses for a new kind of cold reality.</p>
      <p>For India and the global South, these tremors in the North and West aren't just distant headlines—they dictate energy prices, trade routes, and diplomatic balancing acts. When the world’s superpowers reshuffle their forces, everyone else has to brace for the ripple effects.</p>
      <p>We are witnessing the death of "Permanent Peace" as a concept. In the 21st century, stability is dynamic. It is something that must be negotiated daily through digital diplomacy and economic leverage, rather than signed once on a piece of paper.</p>
      <blockquote>We should appreciate the quiet moments, even when we know they are temporary.</blockquote>
    `,
    category: "World",
    authorId: "editorial_engine",
    authorEmail: "world@thevoices.com",
    createdAt: Timestamp.now(),
    likesCount: 0,
    viewsCount: 0,
    isDraft: false,
    violationCount: 0
  },
  {
    title: "The Long Walk to the Winner’s Circle",
    content: `
      <p>There is a specific kind of madness required to wait a lifetime for two minutes of action. In the world of high-stakes racing, that madness is often called a dream.</p>
      <p>At the 2026 Kentucky Derby, jockey Jose Ortiz finally touched the gold he had been chasing for his entire career. It was a victory that transcended the sport—a narrative of persistence in a world that usually favors the young and the lucky. Amidst the chaos of the NBA playoffs and the noise of the Miami Grand Prix, this was a quiet reminder that sometimes, the old-fashioned way of "waiting your turn" still works.</p>
      <p>In an age of instant gratification and viral sensations, stories like Ortiz’s resonate because they are rare. They remind a global audience—from the racing fans in Kentucky to the sports enthusiasts in Mumbai—that expertise is a slow-cooked meal, not a microwave snack.</p>
      <p>Sports are our last remaining arena for objective truth. You cannot "disrupt" a finish line or "hack" a victory. There is a deep, human comfort in seeing someone work for decades to achieve a goal that lasts only seconds. It grounds us in a world that often feels too fast to be real.</p>
      <blockquote>The fastest two minutes in sports are usually the result of the slowest twenty years of effort.</blockquote>
    `,
    category: "Sports",
    authorId: "editorial_engine",
    authorEmail: "sports@thevoices.com",
    createdAt: Timestamp.now(),
    likesCount: 0,
    viewsCount: 0,
    isDraft: false,
    violationCount: 0
  },
  {
    title: "Beyond the Tool: The Rise of the AI Coworker",
    content: `
      <p>We’ve spent the last three years learning how to talk to AI. Starting this month, we might find that the AI has started talking to itself—and getting the job done while we sleep.</p>
      <p>As we approach Google I/O 2026, the buzz has shifted away from "Chatbots" toward "Agentic Platforms." Systems like amazeeClaw and Anthropic's new security layers aren't just answering questions; they are performing multi-step tasks autonomously. We are moving from a world where AI is a hammer to a world where AI is the carpenter.</p>
      <p>For the global workforce, and particularly for India’s massive service and tech sectors, this is a fundamental shift. The "outsourcing" model is being disrupted by "autosourcing." The value of a human worker is moving away from <em>doing</em> the task to <em>curating</em> the outcome of several agents.</p>
      <p>This is the end of "Software as a Service" and the beginning of "Labor as a Service." When software can think, plan, and execute, the interface disappears. We won't "use" an app; we will "brief" an agent. The challenge will be maintaining our own agency in a world of autonomous actors.</p>
      <blockquote>We are no longer just building tools; we are building colleagues. It’s time we figured out the office rules.</blockquote>
    `,
    category: "Technology",
    authorId: "editorial_engine",
    authorEmail: "tech@thevoices.com",
    createdAt: Timestamp.now(),
    likesCount: 0,
    viewsCount: 0,
    isDraft: false,
    violationCount: 0
  }
];

const publishEditorial = async () => {
  console.log("🚀 THE VOICES: AI Editorial Engine is online.");
  console.log("Processing today's stories...");

  for (const article of editorialArticles) {
    try {
      await addDoc(collection(db, "posts"), article);
      console.log(`✅ Published: ${article.title}`);
    } catch (e) {
      console.error(`❌ Failed to publish ${article.title}:`, e);
    }
  }

  console.log("\n✨ Editorial cycle complete. 5 stories live.");
  process.exit(0);
};

publishEditorial();
