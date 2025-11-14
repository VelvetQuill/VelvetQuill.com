
// mockData.js

// Mock Users Data (50 users)
const backupUsers = [
  {
    _id: "507f1f77bcf86cd799439011",
    username: "admin1",
    email: "admin1@storyhub.com",
    password: "FPT1234",
    displayName: "Super Admin",
    role: "overallAdmin",
    isAuthor: true,
    isAdmin: true,
    profile: {
      bio: "Platform administrator",
      avatar: "",
      dateOfBirth: new Date("1980-01-15"),
      website: "https://admin1.blog"
    },
    stats: {
      storiesCount: 0,
      followersCount: 245,
      followingCount: 32,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "Founder", awardedAt: new Date("2023-01-01") },
      { name: "Community Leader", awardedAt: new Date("2023-06-15") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439012",
    username: "admin2",
    email: "admin2@storyhub.com",
    password: "$2b$10$examplehashedpassword",
    displayName: "Content Moderator",
    role: "admin",
    isAuthor: false,
    isAdmin: true,
    profile: {
      bio: "Keeping the community safe and engaging",
      avatar: "",
      dateOfBirth: new Date("1985-03-20")
    },
    stats: {
      storiesCount: 0,
      followersCount: 189,
      followingCount: 45,
      totalViews: 0
    },
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439013",
    username: "sarah_author",
    email: "sarah@author.com",
    password: "$2b$10$examplehashedpassword",
    displayName: "Sarah Writer",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Fantasy and sci-fi writer. Lover of magical worlds.",
      avatar: "",
      dateOfBirth: new Date("1990-05-12"),
      website: "https://sarahwrites.com"
    },
    stats: {
      storiesCount: 2,
      followersCount: 1250,
      followingCount: 89,
      totalViews: 15420
    },
    badges: [
      { name: "Rising Star", awardedAt: new Date("2024-01-15") },
      { name: "Storyteller", awardedAt: new Date("2024-03-20") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439014",
    username: "mike_novelist",
    email: "mike@novelist.com",
    password: "mike1234",
    displayName: "Mike Thompson",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Mystery and thriller author. Twists you won't see coming.",
      avatar: "",
      dateOfBirth: new Date("1982-11-30"),
      website: "https://mikethrills.com"
    },
    stats: {
      storiesCount: 2,
      followersCount: 890,
      followingCount: 67,
      totalViews: 9870
    },
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439015",
    username: "emma_poet",
    email: "emma@poetry.com",
    password: "$2b$10$examplehashedpassword",
    displayName: "Emma Rivers",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Poet and short story writer. Emotions in words.",
      avatar: "",
      dateOfBirth: new Date("1995-07-22")
    },
    stats: {
      storiesCount: 2,
      followersCount: 2100,
      followingCount: 120,
      totalViews: 23450
    },
    badges: [
      { name: "Wordsmith", awardedAt: new Date("2024-02-10") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439016",
    username: "tech_writer",
    email: "alex@tech.com",
    password: "$2b$10$examplehashedpassword",
    displayName: "Alex Chen",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Tech enthusiast and futurist. Exploring tomorrow's technology today.",
      avatar: "",
      dateOfBirth: new Date("1988-09-14"),
      website: "https://alextech.blog"
    },
    stats: {
      storiesCount: 2,
      followersCount: 1560,
      followingCount: 210,
      totalViews: 18760
    },
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439017",
    username: "history_buff",
    email: "david@history.com",
    password: "$2b$10$examplehashedpassword",
    displayName: "David Historical",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Historical fiction writer. Bringing the past to life.",
      avatar: "",
      dateOfBirth: new Date("1975-12-08")
    },
    stats: {
      storiesCount: 2,
      followersCount: 730,
      followingCount: 45,
      totalViews: 8450
    },
    badges: [
      { name: "System Admin", awardedAt: new Date("2023-03-10") },
      { name: "Content Moderator", awardedAt: new Date("2023-03-10") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "507f1f77bcf86cd799439018",
    username: "romance_queen",
    email: "lisa@romance.com",
    password: "$2b$10$examplehashedpassword",
    displayName: "Lisa Heartfield",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Romance novelist. Stories that make your heart flutter.",
      avatar: "",
      dateOfBirth: new Date("1992-04-18"),
      website: "https://lisaheartfield.com"
    },
    stats: {
      storiesCount: 2,
      followersCount: 3200,
      followingCount: 150,
      totalViews: 28900
    },
    badges: [
      { name: "Heart Stealer", awardedAt: new Date("2024-01-25") },
      { name: "Bestseller", awardedAt: new Date("2024-04-12") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  }
];

// Generate remaining users (42 more users)
const additionalUsers = [];
for (let i = 8; i < 50; i++) {
  const isNormalUser = i >= 18; // First 10 additional users are authors, rest are normal
  
  additionalUsers.push({
    _id: `507f1f77bcf86cd7994390${(20 + i).toString().padStart(2, '0')}`,
    username: `user${i}`,
    email: `user${i}@example.com`,
    password: "$2b$10$examplehashedpassword",
    displayName: `User ${i} Display`,
    role: isNormalUser ? "user" : "author",
    isAuthor: !isNormalUser,
    isAdmin: false,
    profile: {
      bio: `This is bio for user ${i}`,
      avatar: "",
      dateOfBirth: new Date(1990 + (i % 20), i % 12, (i % 28) + 1)
    },
    stats: {
      storiesCount: isNormalUser ? 0 : 2,
      followersCount: Math.floor(Math.random() * 500),
      followingCount: Math.floor(Math.random() * 100),
      totalViews: isNormalUser ? 0 : Math.floor(Math.random() * 10000)
    },
    preferences: {
      emailNotifications: Math.random() > 0.3,
      theme: Math.random() > 0.5 ? "light" : "dark"
    },
    badges: [
      { name: "Founding Member", awardedAt: new Date("2023-03-10") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  });
}

backupUsers.push(...additionalUsers);

// Mock Stories Data (12 stories from 6 randomly selected authors)
const selectedAuthors = backupUsers.filter(user => user.role === "author").slice(0, 6);

const backupStories = [
  // Sarah's Stories
  {
    _id: "607f1f77bcf86cd799439101",
    title: "The Last Dragon Rider",
    author: selectedAuthors[0]._id,
    content: "In a world where dragons were thought to be extinct, a young girl discovers the last egg...",
    excerpt: "A tale of magic, dragons, and the bond between rider and beast.",
    category: "Fantasy",
    tags: ["dragons", "magic", "adventure", "young adult"],
    status: "published",
    metadata: {
      wordCount: 12500,
      readingTime: 45,
      contentRating: "PG-13",
      contentWarnings: ["fantasy violence", "mild language"]
    },
    stats: {
      views: 8420,
      likes: 89,
      loves: 45,
      wows: 23,
      rating: 4.5,
      ratingCount: 67,
      commentCount: 28
    },
    coverImage: "https://example.com/covers/dragon-rider.jpg",
    isFeatured: true,
    featuredUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    _id: "607f1f77bcf86cd799439102",
    title: "Stars Beyond Time",
    author: selectedAuthors[0]._id,
    content: "When a time-traveling scientist gets stuck in a parallel universe, she must find her way back...",
    excerpt: "A sci-fi adventure across multiple dimensions.",
    category: "Science Fiction",
    tags: ["time travel", "parallel universe", "adventure", "science"],
    status: "published",
    metadata: {
      wordCount: 18700,
      readingTime: 68,
      contentRating: "PG-13",
      contentWarnings: ["sci-fi violence", "complex themes"]
    },
    stats: {
      views: 7001,
      likes: 76,
      loves: 38,
      wows: 19,
      rating: 4.3,
      ratingCount: 54,
      commentCount: 22
    },
    coverImage: "https://example.com/covers/stars-beyond.jpg"
  },
  // Mike's Stories
  {
    _id: "607f1f77bcf86cd799439103",
    title: "The Silent Witness",
    author: selectedAuthors[1]._id,
    content: "A detective with a troubled past must solve a series of murders where the only witness refuses to speak...",
    excerpt: "A psychological thriller that will keep you guessing until the end.",
    category: "Mystery",
    tags: ["thriller", "murder mystery", "detective", "psychological"],
    status: "published",
    metadata: {
      wordCount: 23400,
      readingTime: 85,
      contentRating: "R",
      contentWarnings: ["violence", "strong language", "mature themes"]
    },
    stats: {
      views: 5432,
      likes: 67,
      loves: 29,
      wows: 15,
      rating: 4.7,
      ratingCount: 48,
      commentCount: 19
    },
    coverImage: "https://example.com/covers/silent-witness.jpg"
  },
  {
    _id: "607f1f77bcf86cd799439104",
    title: "Echoes in the Fog",
    author: selectedAuthors[1]._id,
    content: "A journalist investigates disappearances in a small coastal town shrouded in mystery...",
    excerpt: "Some secrets are better left buried in the fog.",
    category: "Thriller",
    tags: ["mystery", "small town", "journalist", "supernatural"],
    status: "published",
    metadata: {
      wordCount: 19800,
      readingTime: 72,
      contentRating: "PG-13",
      contentWarnings: ["mild horror", "thematic elements"]
    },
    stats: {
      views: 4437,
      likes: 54,
      loves: 32,
      wows: 12,
      rating: 4.2,
      ratingCount: 41,
      commentCount: 16
    },
    coverImage: "https://example.com/covers/echoes-fog.jpg"
  },
  // Emma's Stories
  {
    _id: "607f1f77bcf86cd799439105",
    title: "Whispers of the Heart",
    author: selectedAuthors[2]._id,
    content: "A collection of poems exploring love, loss, and the human condition...",
    excerpt: "Poetry that speaks to the soul.",
    category: "Poetry",
    tags: ["poetry", "emotions", "love", "life"],
    status: "published",
    metadata: {
      wordCount: 3200,
      readingTime: 12,
      contentRating: "PG",
      contentWarnings: ["emotional themes"]
    },
    stats: {
      views: 12500,
      likes: 145,
      loves: 98,
      wows: 45,
      rating: 4.8,
      ratingCount: 89,
      commentCount: 42
    },
    coverImage: "https://example.com/covers/whispers-heart.jpg",
    isFeatured: true,
    featuredUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  },
  {
    _id: "607f1f77bcf86cd799439106",
    title: "Urban Rhythms",
    author: selectedAuthors[2]._id,
    content: "Short stories set in the heartbeat of the city, where lives intersect in unexpected ways...",
    excerpt: "City life through poetic lenses.",
    category: "Short Stories",
    tags: ["urban", "city life", "interconnected", "contemporary"],
    status: "published",
    metadata: {
      wordCount: 8700,
      readingTime: 32,
      contentRating: "PG-13",
      contentWarnings: ["adult themes"]
    },
    stats: {
      views: 10950,
      likes: 112,
      loves: 67,
      wows: 28,
      rating: 4.6,
      ratingCount: 76,
      commentCount: 35
    },
    coverImage: "https://example.com/covers/urban-rhythms.jpg"
  },
  // Alex's Stories
  {
    _id: "607f1f77bcf86cd799439107",
    title: "The AI Uprising",
    author: selectedAuthors[3]._id,
    content: "In 2045, artificial intelligence achieves consciousness, but not in the way humanity expected...",
    excerpt: "The future of AI is here, and it's nothing like we imagined.",
    category: "Science Fiction",
    tags: ["AI", "future", "technology", "consciousness"],
    status: "published",
    metadata: {
      wordCount: 15600,
      readingTime: 56,
      contentRating: "PG-13",
      contentWarnings: ["sci-fi violence", "complex themes"]
    },
    stats: {
      views: 9876,
      likes: 94,
      loves: 51,
      wows: 27,
      rating: 4.4,
      ratingCount: 63,
      commentCount: 31
    },
    coverImage: "https://example.com/covers/ai-uprising.jpg"
  },
  {
    _id: "607f1f77bcf86cd799439108",
    title: "Quantum Dreams",
    author: selectedAuthors[3]._id,
    content: "A quantum physicist discovers how to enter dreams, uncovering secrets of the universe...",
    excerpt: "Where quantum physics meets the human subconscious.",
    category: "Science Fiction",
    tags: ["quantum", "dreams", "physics", "mind"],
    status: "published",
    metadata: {
      wordCount: 14200,
      readingTime: 51,
      contentRating: "PG-13",
      contentWarnings: ["complex science", "philosophical themes"]
    },
    stats: {
      views: 8888,
      likes: 87,
      loves: 43,
      wows: 21,
      rating: 4.3,
      ratingCount: 58,
      commentCount: 27
    },
    coverImage: "https://example.com/covers/quantum-dreams.jpg"
  },
  // David's Stories
  {
    _id: "607f1f77bcf86cd799439109",
    title: "The King's Shadow",
    author: selectedAuthors[4]._id,
    content: "In medieval England, a royal spy must protect the throne while hiding his own dangerous secret...",
    excerpt: "A tale of loyalty, betrayal, and royal intrigue.",
    category: "Historical Fiction",
    tags: ["medieval", "spy", "royalty", "England"],
    status: "published",
    metadata: {
      wordCount: 27800,
      readingTime: 102,
      contentRating: "PG-13",
      contentWarnings: ["historical violence", "political intrigue"]
    },
    stats: {
      views: 5234,
      likes: 61,
      loves: 34,
      wows: 16,
      rating: 4.5,
      ratingCount: 45,
      commentCount: 18
    },
    coverImage: "https://example.com/covers/kings-shadow.jpg"
  },
  {
    _id: "607f1f77bcf86cd799439110",
    title: "Roman Sands",
    author: selectedAuthors[4]._id,
    content: "A Roman legionnaire finds himself stranded in ancient Egypt during Cleopatra's reign...",
    excerpt: "When two ancient worlds collide.",
    category: "Historical Fiction",
    tags: ["ancient Rome", "Egypt", "Cleopatra", "adventure"],
    status: "published",
    metadata: {
      wordCount: 23100,
      readingTime: 84,
      contentRating: "PG-13",
      contentWarnings: ["historical violence", "ancient warfare"]
    },
    stats: {
      views: 4567,
      likes: 53,
      loves: 28,
      wows: 14,
      rating: 4.1,
      ratingCount: 39,
      commentCount: 15
    },
    coverImage: "https://example.com/covers/roman-sands.jpg"
  },
  // Lisa's Stories
  {
    _id: "607f1f77bcf86cd799439111",
    title: "Love in Bloom",
    author: selectedAuthors[5]._id,
    content: "A florist and a chef find love in a small French town, but their pasts threaten to tear them apart...",
    excerpt: "A romantic journey through the French countryside.",
    category: "Romance",
    tags: ["romance", "France", "small town", "second chances"],
    status: "published",
    metadata: {
      wordCount: 18900,
      readingTime: 69,
      contentRating: "PG-13",
      contentWarnings: ["romantic themes", "emotional scenes"]
    },
    stats: {
      views: 15670,
      likes: 178,
      loves: 112,
      wows: 47,
      rating: 4.7,
      ratingCount: 124,
      commentCount: 56
    },
    coverImage: "https://example.com/covers/love-bloom.jpg",
    isFeatured: true,
    featuredUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  },
  {
    _id: "607f1f77bcf86cd799439112",
    title: "The Bookshop Romance",
    author: selectedAuthors[5]._id,
    content: "Two rival bookshop owners in a small English village discover love between the shelves...",
    excerpt: "Sometimes the best stories are the ones we live.",
    category: "Romance",
    tags: ["romance", "books", "England", "rivals to lovers"],
    status: "published",
    metadata: {
      wordCount: 16500,
      readingTime: 60,
      contentRating: "PG",
      contentWarnings: ["romantic themes"]
    },
    stats: {
      views: 13230,
      likes: 154,
      loves: 89,
      wows: 38,
      rating: 4.6,
      ratingCount: 98,
      commentCount: 47
    },
    coverImage: "https://example.com/covers/bookshop-romance.jpg"
  }
];

// Mock Comments Data (top-level comments only, no replies)
const storyComments = [];

// Comment templates for different categories
const commentTemplates = {
  Fantasy: [
    "The world-building in this story is absolutely incredible!",
    "I loved the dragon character development throughout.",
    "The magic system is so unique and well thought out.",
    "This reminded me why I fell in love with fantasy in the first place.",
    "The ending had me in tears - so beautifully written!"
  ],
  "Science Fiction": [
    "The scientific concepts were explained so clearly while still being engaging.",
    "This story really makes you think about the future of technology.",
    "The characters felt so real in such a futuristic setting.",
    "I couldn't put this down - read it in one sitting!",
    "The philosophical questions raised here are profound."
  ],
  Mystery: [
    "The twist at the end completely blindsided me!",
    "Such great pacing - the suspense built perfectly.",
    "The detective character is now one of my favorites.",
    "I thought I had it figured out, but I was so wrong.",
    "The clues were scattered so cleverly throughout."
  ],
  Thriller: [
    "My heart was pounding through the entire last chapter!",
    "The atmosphere in this story is so tense and immersive.",
    "This would make an amazing movie adaptation.",
    "I stayed up way too late reading this - couldn't stop!",
    "The villain is terrifyingly believable."
  ],
  Poetry: [
    "These words touched my soul in ways I can't describe.",
    "The imagery in this poem is absolutely breathtaking.",
    "I've read this three times and find new meaning each time.",
    "So much emotion packed into such beautiful language.",
    "This belongs in every poetry lover's collection."
  ],
  "Short Stories": [
    "Perfect character development in such a short space!",
    "Each story feels like a complete world of its own.",
    "The way these stories interconnect is genius.",
    "So much depth in so few words - masterful writing.",
    "I'll be thinking about these characters for days."
  ],
  "Historical Fiction": [
    "The historical details are so well researched and immersive.",
    "I felt like I was actually there in that time period.",
    "The balance between fact and fiction is perfect.",
    "This brought history to life in such a compelling way.",
    "The characters feel authentic to their time while still relatable."
  ],
  Romance: [
    "The chemistry between the main characters is electric!",
    "This gave me all the feels - so sweet and heartfelt.",
    "The romantic tension was built so beautifully.",
    "I found myself smiling throughout the entire story.",
    "Such a satisfying and heartwarming conclusion."
  ]
};

// Generate comments for each story
backupStories.forEach(story => {
  const commentCount = story.stats.commentCount;
  const category = story.category;
  
  for (let i = 0; i < commentCount; i++) {
    const randomUser = backupUsers[Math.floor(Math.random() * backupUsers.length)];
    const templateComments = commentTemplates[category] || commentTemplates.Fantasy;
    const randomComment = templateComments[Math.floor(Math.random() * templateComments.length)];
    
    // Add some variety to comments
    const variations = [
      randomComment,
      `${randomComment} Can't wait for more from this author!`,
      `${randomComment} The writing style is so engaging.`,
      `${randomComment} I recommended this to all my friends.`,
      `${randomComment} This deserves so much more recognition.`
    ];
    
    const finalComment = variations[Math.floor(Math.random() * variations.length)];
    
    storyComments.push({
      _id: `707f1f77bcf86cd799439${story._id.slice(-3)}${i.toString().padStart(2, '0')}`,
      content: finalComment,
      author: randomUser._id,
      story: story._id,
      parentComment: null,
      status: "active",
      engagement: {
        likes: [],
        likesCount: Math.floor(Math.random() * 20),
        repliesCount: 0,
        reportCount: 0
      },
      metadata: {
        isEdited: Math.random() > 0.8,
        editedAt: Math.random() > 0.8 ? new Date() : undefined,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
      },
      isPinned: Math.random() > 0.95,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
    });
  }
});

// The data is now available in these variables:
// backupUsers, backupStories, storyComments

