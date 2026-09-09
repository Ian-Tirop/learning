// Optional per-post poll + quiz shown on the article page, keyed by slug.
// Posts without an entry here simply render without a poll/quiz section.
export const postExtras = {
  'why-i-cant-stop-recommending-chainquest-ke': {
    poll: {
      question: "Would you join a free weekly builder community like ChainQuest Ke's WhatsApp group?",
      options: ["Yes, I'd join today", 'Maybe, depends on the topics', 'I prefer learning solo'],
    },
    quiz: {
      question: "What detail in ChainQuest's stack convinced the author this was a real production team?",
      options: ['Solidity', 'PostGIS', 'Next.js', 'Web3.js'],
      correctIndex: 1,
      explanation:
        "PostGIS sitting next to PostgreSQL and React isn't something you fake in a portfolio — it signals real, shipped spatial data work.",
    },
  },
  'design-systems-are-a-product-not-a-deliverable': {
    poll: {
      question: 'How does your team currently treat its design system?',
      options: ['Like a maintained product', 'Like a one-time deliverable', "We don't have one yet"],
    },
    quiz: {
      question: 'According to the post, what turns adoption into the obviously easier path?',
      options: [
        'Mandating it in code review',
        "Designing the system's own onboarding experience",
        'Adding more components',
        'Rewriting it every quarter',
      ],
      correctIndex: 1,
      explanation:
        'A searchable library, a changelog, and a clear owner per component make the shared button faster to grab than building a new one — adoption follows naturally.',
    },
  },
  'the-line-height-bug-that-humbled-me': {
    poll: {
      question: 'Has a CSS bug ever turned out to be caused by something several components away?',
      options: ['Yes, all the time', 'Once or twice', 'Never (yet)'],
    },
    quiz: {
      question: 'Why did the gradient heading look clipped while a solid-color version rendered fine?',
      options: [
        'The gradient had the wrong keyframes',
        "background-clip: text only paints within the element's box, sized by an inherited pixel line-height",
        'The font failed to load',
        "The browser didn't support gradients",
      ],
      correctIndex: 1,
      explanation:
        'Solid-color glyphs can overflow their line box invisibly; a background-clipped gradient can only paint inside that box, so anything beyond it stayed uncolored.',
    },
  },
  'dark-mode-is-not-a-color-swap': {
    poll: {
      question: 'Which part of dark mode is hardest to get right?',
      options: [
        'Avoiding a flash of the wrong theme',
        'Retuning shadows and elevation',
        'Adjusting accent color saturation',
      ],
    },
    quiz: {
      question: "What's the fix for a flash of the wrong theme on page load?",
      options: [
        'A CSS media query alone',
        'A synchronous script in the head that runs before paint',
        'Loading the theme after React mounts',
        'Disabling dark mode on first visit',
      ],
      correctIndex: 1,
      explanation:
        'A tiny synchronous script in the document head reads the stored preference (or falls back to the OS setting) and stamps it on the root element immediately — no flash.',
    },
  },
  'the-200ms-that-make-an-interface-feel-alive': {
    poll: {
      question: "What duration feels 'right' to you for a modal or panel transition?",
      options: ['Under 150ms', '150–300ms', 'Over 300ms'],
    },
    quiz: {
      question: 'Which easing typically suits an element entering the screen?',
      options: ['Linear', 'Ease-in', 'Ease-out', 'Always ease-in-out'],
      correctIndex: 2,
      explanation:
        'Ease-out (fast start, gentle stop) reads as something arriving, which is why it suits entrances — ease-in suits exits.',
    },
  },
  'learning-in-public-notes-from-a-side-project': {
    poll: {
      question: "Do you keep a personal 'junk drawer' side project?",
      options: ['Yes, and I use it often', "I've started one but rarely open it", 'No, not yet'],
    },
    quiz: {
      question: 'Where does the real value of a junk-drawer project come from, according to the post?',
      options: [
        'The finished artifacts it produces',
        'The reps — doing routine things until they get boring',
        'Showing it off publicly',
        'Following a strict roadmap',
      ],
      correctIndex: 1,
      explanation:
        "Most of what lives in a junk-drawer project never ships anywhere — the value is in repetition until the sharp edges become familiar.",
    },
  },
  'why-i-still-sketch-on-paper-before-figma': {
    poll: {
      question: 'Do you sketch on paper before opening a design tool?',
      options: ['Always', 'Sometimes', 'Never'],
    },
    quiz: {
      question: 'Why does the author sketch on paper before opening Figma?',
      options: [
        'Paper is faster to export',
        "High fidelity quietly commits to decisions before they're meant to be made",
        "Figma doesn't support sketching",
        "It's a team requirement",
      ],
      correctIndex: 1,
      explanation:
        "The more finished something looks, the harder it is to treat as disposable — paper keeps focus on hierarchy and flow instead of pixels.",
    },
  },
  'five-small-habits': {
    poll: {
      question: 'Which habit do you most need to build?',
      options: [
        'Reading the whole error message',
        'Reproducing bugs before fixing them',
        'Deleting before adding',
        'Keeping a junk-drawer project',
      ],
    },
    quiz: {
      question: 'What does the post suggest doing instead of writing a comment that explains what code does?',
      options: [
        'Nothing, comments are always good',
        'Rename something so the code explains itself',
        'Delete the code',
        'Add more comments for safety',
      ],
      correctIndex: 1,
      explanation:
        "Comments should explain the why that isn't visible in the code — if you're explaining what it does, that's a sign to rename something instead.",
    },
  },
  'everything-i-learned-rebuilding-this-blogs-backend': {
    poll: {
      question: "Have you ever hit a hosting platform's hidden limit (a function cap, a cron frequency, a build-time ceiling) while building something?",
      options: ['Yes, more than once', 'Once, and it taught me something', 'Not yet'],
    },
    quiz: {
      question: "What did Vercel's Hobby plan cap that forced consolidating separate endpoints into single dispatch files?",
      options: ['Database rows', 'Serverless functions', 'Environment variables', 'Deploy minutes'],
      correctIndex: 1,
      explanation:
        'The Hobby plan caps a project at twelve serverless functions — hitting that twice is what pushed related actions (login, follow-toggle, following, and more) into one dynamic [action].js dispatch file per resource instead of one file each.',
    },
  },
  'designing-the-boring-states-loading-empty-and-error': {
    poll: {
      question: 'Which of these three states do you think gets the least design attention on most teams?',
      options: ['Loading states', 'Empty states', 'Error states'],
    },
    quiz: {
      question: 'According to the post, why do skeleton screens tend to feel faster than spinners at the same load time?',
      options: [
        'They use less CPU to render',
        'They imply a shape the brain can anchor an expectation to',
        "They're animated at a higher frame rate",
        'They hide the network request entirely',
      ],
      correctIndex: 1,
      explanation:
        'A spinner only communicates duration. A skeleton communicates shape — roughly where the title and image will land — giving the brain something to anchor to instead of just watching a shape spin in a void.',
    },
  },
}

export function getPostExtras(slug) {
  return postExtras[slug]
}
