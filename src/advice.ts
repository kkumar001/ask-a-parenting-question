export type AdviceCategory = 'sleep' | 'feeding' | 'health' | 'development' | 'general'

export type AgeRange = 'newborn' | 'infant' | 'toddler' | 'preschooler'

export const AGE_OPTIONS: { value: AgeRange; label: string; hint: string }[] = [
  { value: 'newborn', label: 'Newborn', hint: '0–3 months' },
  { value: 'infant', label: 'Infant', hint: '3–12 months' },
  { value: 'toddler', label: 'Toddler', hint: '1–3 years' },
  { value: 'preschooler', label: 'Preschooler', hint: '3–5 years' },
]

export const AGE_LABELS: Record<AgeRange, string> = {
  newborn: 'newborn',
  infant: 'infant',
  toddler: 'toddler',
  preschooler: 'preschooler',
}

const categoryKeywords: Record<Exclude<AdviceCategory, 'general'>, string[]> = {
  sleep: [
    'sleep',
    'nap',
    'napping',
    'bedtime',
    'night',
    'wake',
    'waking',
    'insomnia',
    'rest',
    'tired',
    'exhausted',
    'overnight',
  ],
  feeding: [
    'feed',
    'feeding',
    'eat',
    'eating',
    'breast',
    'breastfeed',
    'nursing',
    'formula',
    'bottle',
    'milk',
    'solid',
    'solids',
    'hungry',
    'appetite',
    'wean',
    'weaning',
    'picky',
    'food',
    'snack',
  ],
  health: [
    'fever',
    'sick',
    'cough',
    'cold',
    'rash',
    'vomit',
    'vomiting',
    'diarrhea',
    'pain',
    'ear',
    'temperature',
    'illness',
    'symptom',
    'medicine',
    'hurt',
    'injury',
    'breathing',
    'allergy',
    'infection',
  ],
  development: [
    'develop',
    'development',
    'milestone',
    'crawl',
    'walk',
    'talk',
    'speech',
    'language',
    'sit',
    'motor',
    'social',
    'play',
    'learn',
    'delay',
    'grow',
    'growth',
    'behavior',
    'tantrum',
    'emotion',
  ],
}

export function detectCategory(question: string): AdviceCategory {
  const lower = question.toLowerCase()
  let best: AdviceCategory = 'general'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(categoryKeywords) as [
    Exclude<AdviceCategory, 'general'>,
    string[],
  ][]) {
    const score = keywords.reduce(
      (count, word) => count + (lower.includes(word) ? 1 : 0),
      0,
    )
    if (score > bestScore) {
      bestScore = score
      best = category
    }
  }

  return best
}

const openingsByAge: Record<AgeRange, string[]> = {
  newborn: [
    "Those early weeks can feel endless and precious at once — thank you for looking after your newborn so carefully.",
    "Newborn life is a crash course in reading tiny cues. You're asking exactly the right kind of question.",
    "It's completely normal to feel unsure with a brand-new baby. You're not alone in this.",
  ],
  infant: [
    "Infancy moves fast, and it's wise of you to check in about what's typical right now.",
    "Thank you for reaching out — caring for an infant means constantly adapting, and you're doing that thoughtfully.",
    "Many parents of infants share this exact worry. Let's talk it through gently.",
  ],
  toddler: [
    "Toddlerhood is full of big feelings in small bodies — your question makes so much sense.",
    "I hear you. Toddlers can keep us guessing, and asking for guidance is a real strength.",
    "What a thoughtful question. So many toddler parents wonder about this too.",
  ],
  preschooler: [
    "Preschool years bring new independence and new questions — thanks for pausing to ask.",
    "You're tuning in to your preschooler with real care. That matters a lot.",
    "It's completely normal to rethink routines and expectations at this age. You're doing great by asking.",
  ],
}

const closingsByAge: Record<AgeRange, string[]> = {
  newborn: [
    "With a newborn, when something feels off — especially fever, poor feeding, or unusual sleepiness — call your pediatrician sooner rather than later. You know your baby best.",
    "Rest when you can, lean on your support people, and trust that small, steady care is exactly what your newborn needs.",
  ],
  infant: [
    "Keep tracking wet diapers, alertness, and overall growth. If worry lingers, a check-in with your pediatrician can bring real peace of mind.",
    "You're reading your infant's cues — that attentiveness is a gift. Reach out to a clinician anytime something doesn't sit right.",
  ],
  toddler: [
    "Consistency and calm connection go further than perfect routines. If concerns grow, your pediatrician or an early-childhood specialist can help you sort next steps.",
    "Every toddler is unique. Take what fits your family, leave the rest, and don't hesitate to ask a professional when you need a second opinion.",
  ],
  preschooler: [
    "At this age, clear expectations plus warmth usually work best. Bring lingering worries to a well visit — early support is always worth it.",
    "Trust your instincts. You know your preschooler best, and a clinician is a partner when you need one.",
  ],
}

type TipPair = [string, string, string]

const adviceByAgeAndCategory: Record<
  AgeRange,
  Record<AdviceCategory, TipPair>
> = {
  newborn: {
    sleep: [
      "Newborns often sleep in short stretches totaling 14–17 hours a day, with no reliable day/night pattern yet. Contact naps and nighttime feeds are expected — not a failure of \"sleep training.\"",
      "Safe sleep is non-negotiable: back to sleep, firm flat surface, bare crib or bassinet, and room-sharing without bed-sharing when possible. Swaddling (hips free) can soothe some newborns until they show signs of rolling.",
      "Daytime light and gentle nighttime dimness help little circadian rhythms start to form. Follow sleepy cues rather than a strict schedule this early.",
    ],
    feeding: [
      "Breastfed newborns often feed 8–12 times in 24 hours; formula-fed babies may go a bit longer between bottles. Frequent feeding protects supply and comfort alike.",
      "Watch wet diapers, soft stools (pattern depends on milk type), and alert periods more than the clock. Cluster feeding in the evenings is common and usually temporary.",
      "If latch is painful, weight gain stalls, or your baby seems listless at feeds, reach out to a lactation consultant or pediatrician promptly.",
    ],
    health: [
      "Newborns can get sick quickly. A rectal temperature of 100.4°F (38°C) or higher in a baby under 3 months usually means call the doctor right away — don't wait to \"watch it.\"",
      "Also seek care for fewer wet diapers, yellowing of the skin or eyes that worsens, difficulty breathing, or a baby who is hard to wake or unusually floppy.",
      "Keep the environment calm, skin-to-skin when helpful, and follow your clinician's guidance on any medicine — dosing for newborns is highly specific.",
    ],
    development: [
      "In these first months, \"milestones\" look like brief eye contact, startling to sound, and gradually longer awake windows. Tracking faces and voices is meaningful work for a newborn brain.",
      "Tummy time in short, supervised bursts while awake helps neck strength. Talk, sing, and hold — your voice is their favorite curriculum.",
      "If your newborn doesn't respond to loud sounds, has very low muscle tone, or you're worried about feeding and alertness together, mention it at the next visit or call sooner.",
    ],
    general: [
      "Newborn care is mostly feeding, soothing, and recovering — for them and for you. There is no prize for doing it alone.",
      "Day-to-day rhythms will shift weekly. Lean on simple cues: hungry, tired, uncomfortable, needing connection.",
      "Your protectiveness is appropriate. Seeking guidance early is wise parenting, not overreacting.",
    ],
  },
  infant: {
    sleep: [
      "Many infants begin consolidating longer night stretches between 4–6 months, though night wakings still spike with teething, illness, and developmental leaps.",
      "A simple wind-down — feed, dim lights, quiet song, same sleep space — helps more than a rigid clock. Keep the sleep surface firm and free of soft bedding.",
      "If you're exploring sleep coaching, wait until your pediatrician says weight gain and overall health support it, and choose a gentle approach that fits your values.",
    ],
    feeding: [
      "Around 6 months, many infants show readiness for solids (sitting with support, interest in food, loss of tongue-thrust). Milk remains the main nutrition source through the first year.",
      "Offer iron-rich first foods and introduce common allergens one at a time when your clinician recommends it. Follow your baby's pace — gagging while learning is different from choking.",
      "Appetite dips during teething or colds are common. Steady wet diapers and growth on their curve matter more than cleaning every bowl.",
    ],
    health: [
      "For infants, note fever, breathing effort, hydration (wet diapers), and how playful they are when the fever eases. Those details help a clinician triage over the phone.",
      "Colds are frequent once social exposure increases. Supportive care — fluids, nasal saline, upright cuddles — is often enough, but trust your gut if they seem \"not themselves.\"",
      "Never give honey under age 1, and always confirm medicine dosing by weight with a pharmacist or pediatrician.",
    ],
    development: [
      "Infants typically progress from rolling to sitting, then crawling or scooting, with lots of variation. Babbling and social smiles are exciting language foundations.",
      "Floor play, mirrored faces, and narrating your day fuel motor and social growth. Babyproof as mobility suddenly accelerates.",
      "Bring up concerns about no babbling, little eye contact, or loss of skills — early evaluation is supportive, not alarming.",
    ],
    general: [
      "Infancy is a season of leaps and regressions. What worked last month may need a tweak this week — that's normal.",
      "Protect a few anchors: connection, safe sleep, responsive feeding, and your own rest whenever possible.",
      "You're learning your unique baby. Curiosity and kindness toward yourself count as much as any tip.",
    ],
  },
  toddler: {
    sleep: [
      "Toddlers often need about 11–14 hours of sleep in 24 hours, including one nap for many. A predictable bedtime routine beats a perfect bedtime clock.",
      "Limit screens before bed, keep the room cool and dark, and offer a brief check-in script if they call out — calm, boring, and consistent.",
      "Night wakings can return with separation anxiety or imagination. Reassure, then guide them back to their sleep space without starting a midnight party.",
    ],
    feeding: [
      "Toddler appetites swing wildly. Offer structured meals and snacks, include a familiar food, and let them decide how much to eat from what's served.",
      "Picky phases are extremely common. Keep offering variety without pressure or short-order cooking every night — repeated gentle exposure works slowly but well.",
      "Sit together when you can, model eating, and keep mealtimes low-drama. Growth charts and energy for play are better guides than empty plates.",
    ],
    health: [
      "Toddlers collect germs as they explore. Focus on hydration, rest, and comfort; call for high or lasting fever, labored breathing, unusual lethargy, or pain that won't settle.",
      "Ear tugging with fever, rashes you're unsure about, or vomiting that prevents keeping fluids down deserve a clinician's input.",
      "Keep fever-reducer dosing by weight, and ask before combining medicines. Your gut feeling that something is \"off\" is valid information.",
    ],
    development: [
      "Walking, climbing, and first word combinations usually blossom in this window — on wide timelines. Parallel play and big feelings are both developmentally on brand.",
      "Name emotions, offer simple choices, and use play to practice new skills. Tantrums often mean \"I have a feeling bigger than my words.\"",
      "If speech is hard to understand, motor skills seem stuck, or social engagement fades, raise it early — support can make a meaningful difference.",
    ],
    general: [
      "Toddlers test limits to learn safety and connection. Warm boundaries plus repair after hard moments teach more than perfection ever could.",
      "Simplify the day when everyone is stretched: outdoor time, snacks, and earlier bedtime are underrated tools.",
      "You're allowed to find this stage both delightful and exhausting. Asking for help is part of good care.",
    ],
  },
  preschooler: {
    sleep: [
      "Most preschoolers thrive on roughly 10–13 hours of sleep, often without a nap. A consistent lights-out and morning wake time steady moods and learning.",
      "Fears and \"one more story\" negotiations are common. Use a short, predictable routine and a calm plan for nighttime visits back to bed.",
      "Watch for snoring, restless sleep, or daytime sleepiness — those can be worth mentioning to a pediatrician.",
    ],
    feeding: [
      "Preschoolers benefit from regular meals and snacks with some choice within boundaries (\"apple or banana?\"). Involve them in simple prep to build interest.",
      "Avoid labeling foods as \"good\" or \"bad\"; talk about energy, growing bodies, and how different foods help us feel. Keep pressure low at the table.",
      "If growth slows sharply, mealtimes are battlegrounds every day, or you're worried about disordered patterns, ask your clinician for tailored support.",
    ],
    health: [
      "Preschoolers can often tell you what hurts — listen, then still watch hydration, activity level, and breathing. School or daycare germs are frequent visitors.",
      "Return-to-play or daycare rules after illness vary; when unsure, call the office. Persistent cough, asthma-like symptoms, or recurring ear infections deserve follow-up.",
      "Teach simple handwashing and nose-blowing as life skills, not perfection tests. Keep emergency contacts and allergy plans up to date if relevant.",
    ],
    development: [
      "Language blooms into stories and questions; pretend play and friendships take center stage. Emotional regulation is still under construction — coaching beats shaming.",
      "Read together, play outdoors, and leave room for unstructured imagination. Practice turn-taking and naming feelings in everyday moments.",
      "Concerns about speech clarity, attention that seems extreme for their age, or social withdrawal are good topics for a developmental check-in.",
    ],
    general: [
      "Preschoolers crave both independence and your safe harbor. Offer responsibilities they can succeed at, then celebrate effort.",
      "Routines around mornings, meals, and bedtime reduce friction more than long lectures. Connection before correction still works wonders.",
      "You're building lifelong habits of trust. Gentle guidance now is an investment, not a performance.",
    ],
  },
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function pickTwo<T>(items: readonly T[]): [T, T] {
  const first = Math.floor(Math.random() * items.length)
  let second = Math.floor(Math.random() * (items.length - 1))
  if (second >= first) second += 1
  return [items[first], items[second]]
}

export function generateAdvice(question: string, age: AgeRange): string {
  const category = detectCategory(question)
  const topicLabel: Record<AdviceCategory, string> = {
    sleep: 'sleep',
    feeding: 'feeding',
    health: 'health',
    development: 'development',
    general: 'day-to-day care',
  }

  const tips = adviceByAgeAndCategory[age][category]
  const [tipA, tipB] = pickTwo(tips)
  const ageWord = AGE_LABELS[age]

  return [
    pick(openingsByAge[age]),
    '',
    `Thinking about your ${ageWord} and ${topicLabel[category]}, here's guidance tailored to this stage:`,
    '',
    tipA,
    '',
    tipB,
    '',
    pick(closingsByAge[age]),
  ].join('\n')
}

export const SUGGESTED_QUESTIONS: Record<AgeRange, string[]> = {
  newborn: [
    'How often should my newborn be feeding?',
    'Is short newborn sleep normal?',
    'When should I call about a newborn fever?',
    'How much tummy time does a newborn need?',
    'Why does my newborn cluster feed at night?',
  ],
  infant: [
    'My infant wakes every few hours — what can I try?',
    'How do I know if my baby is ready for solids?',
    'When should I worry about an infant fever?',
    "Is it okay if my 9-month-old isn't crawling?",
    'How do I ease teething discomfort?',
  ],
  toddler: [
    'My toddler fights bedtime every night — tips?',
    'How do I handle picky eating calmly?',
    'When should I worry about a toddler fever?',
    'Are frequent tantrums normal at this age?',
    'How much nap time does a toddler need?',
  ],
  preschooler: [
    'My preschooler keeps getting out of bed — help?',
    'How can I encourage healthier eating?',
    'When should I keep my preschooler home sick?',
    'How do I help with big emotions before school?',
    'What bedtime routine works for preschoolers?',
  ],
}
