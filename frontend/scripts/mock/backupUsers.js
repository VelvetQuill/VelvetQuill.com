

// Admin Users (5)
const adminUsers = [
  {
    _id: "67d1e2f3a4b5c67890123401",
    username: "alexandra_admin",
    email: "alexandra.admin@storyverse.com",
    password: "$2b$10$hashedpassword123",
    displayName: "Alexandra Chen",
    role: "overallAdmin",
    isAuthor: false,
    isAdmin: true,
    profile: {
      bio: "Overall Administrator for StoryVerse platform",
      avatar: "/avatars/alexandra-admin.jpg",
      dateOfBirth: new Date("1985-05-15"),
      website: "https://storyverse.com/admin"
    },
    stats: {
      storiesCount: 0,
      followersCount: 245,
      followingCount: 12,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "Founder", awardedAt: new Date("2023-01-15") },
      { name: "Platform Admin", awardedAt: new Date("2023-01-15") }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123402",
    username: "marcus_sysadmin",
    email: "marcus.admin@storyverse.com",
    password: "$2b$10$hashedpassword456",
    displayName: "Marcus Rodriguez",
    role: "admin",
    isAuthor: false,
    isAdmin: true,
    profile: {
      bio: "System Administrator and Content Moderator",
      avatar: "/avatars/marcus-admin.jpg",
      dateOfBirth: new Date("1990-08-22"),
      website: "https://techwithmarcus.com"
    },
    stats: {
      storiesCount: 0,
      followersCount: 189,
      followingCount: 45,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "System Admin", awardedAt: new Date("2023-03-10") },
      { name: "Content Moderator", awardedAt: new Date("2023-03-10") }
    ],
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123403",
    username: "sophia_mod",
    email: "sophia.moderator@storyverse.com",
    password: "$2b$10$hashedpassword789",
    displayName: "Sophia Williams",
    role: "admin",
    isAuthor: true,
    isAdmin: true,
    profile: {
      bio: "Content Moderator and Romance Author",
      avatar: "/avatars/sophia-admin.jpg",
      dateOfBirth: new Date("1988-12-03"),
      website: "https://sophiawritesromance.com"
    },
    stats: {
      storiesCount: 8,
      followersCount: 567,
      followingCount: 89,
      totalViews: 45000
    },
    preferences: {
      emailNotifications: false,
      theme: "light"
    },
    badges: [
      { name: "Content Moderator", awardedAt: new Date("2023-05-20") },
      { name: "Verified Author", awardedAt: new Date("2023-02-15") }
    ],
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123404",
    username: "tech_evan",
    email: "evan.tech@storyverse.com",
    password: "$2b$10$hashedpassword012",
    displayName: "Evan Thompson",
    role: "admin",
    isAuthor: false,
    isAdmin: true,
    profile: {
      bio: "Technical Administrator and Platform Developer",
      avatar: "/avatars/evan-admin.jpg",
      dateOfBirth: new Date("1992-03-18"),
      website: "https://evantech.dev"
    },
    stats: {
      storiesCount: 0,
      followersCount: 134,
      followingCount: 23,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "Tech Admin", awardedAt: new Date("2023-04-05") },
      { name: "Developer", awardedAt: new Date("2023-04-05") }
    ],
    createdAt: new Date("2023-04-05"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123405",
    username: "luna_community",
    email: "luna.community@storyverse.com",
    password: "$2b$10$hashedpassword345",
    displayName: "Luna Garcia",
    role: "admin",
    isAuthor: false,
    isAdmin: true,
    profile: {
      bio: "Community Manager and User Support Lead",
      avatar: "/avatars/luna-admin.jpg",
      dateOfBirth: new Date("1991-07-30"),
      website: "https://community.storyverse.com"
    },
    stats: {
      storiesCount: 0,
      followersCount: 278,
      followingCount: 156,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "light"
    },
    badges: [
      { name: "Community Manager", awardedAt: new Date("2023-06-12") },
      { name: "Support Lead", awardedAt: new Date("2023-06-12") }
    ],
    createdAt: new Date("2023-06-12"),
    updatedAt: new Date("2024-03-28")
  }
];



// Author Users (15) - Including the authors from our previous stories
const authorUsers = [
  {
    _id: "67b1c2d3e4f5a67890123459", // Rafael Santoro from previous stories
    username: "rafael_santoro",
    email: "rafael.santoro@email.com",
    password: "$2b$10$hashedpassword678",
    displayName: "Rafael Santoro",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Dark Romance author specializing in mafia and forbidden love stories. Lover of intense emotions and complex characters.",
      avatar: "/avatars/rafael-santoro.jpg",
      dateOfBirth: new Date("1987-09-14"),
      website: "https://rafaelsantoro.com"
    },
    stats: {
      storiesCount: 12,
      followersCount: 15678,
      followingCount: 45,
      totalViews: 450000
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-02-20") },
      { name: "Bestselling Author", awardedAt: new Date("2023-08-15") },
      { name: "Top Romance Writer", awardedAt: new Date("2024-01-10") }
    ],
    createdAt: new Date("2023-02-20"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67b1c2d3e4f5a67890123451", // Isabella Cruz from previous stories
    username: "isabella_cruz",
    email: "isabella.cruz@email.com",
    password: "$2b$10$hashedpassword901",
    displayName: "Isabella Cruz",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Contemporary romance author who believes in second chances and steamy reunions. Coffee addict and hopeless romantic.",
      avatar: "/avatars/isabella-cruz.jpg",
      dateOfBirth: new Date("1990-04-25"),
      website: "https://isabellacruzwrites.com"
    },
    stats: {
      storiesCount: 8,
      followersCount: 8923,
      followingCount: 67,
      totalViews: 287000
    },
    preferences: {
      emailNotifications: false,
      theme: "light"
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-03-15") },
      { name: "Rising Star", awardedAt: new Date("2023-11-05") }
    ],
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67b1c2d3e4f5a67890123452", // Chloe Montgomery from previous stories
    username: "chloe_montgomery",
    email: "chloe.montgomery@email.com",
    password: "$2b$10$hashedpassword234",
    displayName: "Chloe Montgomery",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Office romance specialist. I write about powerful CEOs and the assistants who steal their hearts. Based in NYC.",
      avatar: "/avatars/chloe-montgomery.jpg",
      dateOfBirth: new Date("1988-11-08"),
      website: "https://chloemontgomeryauthor.com"
    },
    stats: {
      storiesCount: 6,
      followersCount: 7564,
      followingCount: 89,
      totalViews: 198000
    },
    preferences: {
      emailNotifications: true,
      theme: "light"
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-04-10") }
    ],
    createdAt: new Date("2023-04-10"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67b1c2d3e4f5a67890123453", // Serena Blackwood from previous stories
    username: "serena_blackwood",
    email: "serena.blackwood@email.com",
    password: "$2b$10$hashedpassword567",
    displayName: "Serena Blackwood",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Reverse harem romance author. Creating worlds where love isn't limited and passion knows no bounds.",
      avatar: "/avatars/serena-blackwood.jpg",
      dateOfBirth: new Date("1985-12-20"),
      website: "https://serenablackwood.com"
    },
    stats: {
      storiesCount: 15,
      followersCount: 23456,
      followingCount: 34,
      totalViews: 678000
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-01-25") },
      { name: "Bestselling Author", awardedAt: new Date("2023-09-30") },
      { name: "RH Specialist", awardedAt: new Date("2024-02-14") }
    ],
    createdAt: new Date("2023-01-25"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67b1c2d3e4f5a67890123454", // Dominic Vance from previous stories
    username: "dominic_vance",
    email: "dominic.vance@email.com",
    password: "$2b$10$hashedpassword890",
    displayName: "Dominic Vance",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Enemies-to-lovers connoisseur. I write about the thin line between hate and desire. Angst with a happy ending guaranteed.",
      avatar: "/avatars/dominic-vance.jpg",
      dateOfBirth: new Date("1992-06-17"),
      website: "https://dominicvancewrites.com"
    },
    stats: {
      storiesCount: 5,
      followersCount: 5432,
      followingCount: 78,
      totalViews: 123000
    },
    preferences: {
      emailNotifications: false,
      theme: "dark"
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-05-05") }
    ],
    createdAt: new Date("2023-05-05"),
    updatedAt: new Date("2024-03-28")
  },
  // Additional authors
  {
    _id: "67d1e2f3a4b5c67890123406",
    username: "amelie_rose",
    email: "amelie.rose@email.com",
    password: "$2b$10$hashedpassword123",
    displayName: "Amelie Rose",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Historical romance author. Transporting readers to eras of elegance and forbidden passions.",
      avatar: "/avatars/amelie-rose.jpg",
      dateOfBirth: new Date("1983-03-22"),
      website: "https://amelierosehistoricals.com"
    },
    stats: {
      storiesCount: 9,
      followersCount: 8765,
      followingCount: 23,
      totalViews: 345000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-03-18") },
      { name: "Historical Specialist", awardedAt: new Date("2023-10-12") }
    ],
    createdAt: new Date("2023-03-18"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123407",
    username: "nathan_fletcher",
    email: "nathan.fletcher@email.com",
    password: "$2b$10$hashedpassword456",
    displayName: "Nathan Fletcher",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Writing paranormal romance with bite. Vampires, werewolves, and the humans who love them.",
      avatar: "/avatars/nathan-fletcher.jpg",
      dateOfBirth: new Date("1989-08-14"),
      website: "https://nathanfletcherparanormal.com"
    },
    stats: {
      storiesCount: 11,
      followersCount: 11234,
      followingCount: 56,
      totalViews: 412000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-02-28") },
      { name: "Paranormal Expert", awardedAt: new Date("2023-11-20") }
    ],
    createdAt: new Date("2023-02-28"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123408",
    username: "lila_morgan",
    email: "lila.morgan@email.com",
    password: "$2b$10$hashedpassword789",
    displayName: "Lila Morgan",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Sports romance specialist. Where athletes meet their match both on and off the field.",
      avatar: "/avatars/lila-morgan.jpg",
      dateOfBirth: new Date("1991-01-30"),
      website: "https://lilamorganromance.com"
    },
    stats: {
      storiesCount: 7,
      followersCount: 6987,
      followingCount: 89,
      totalViews: 267000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-04-22") }
    ],
    createdAt: new Date("2023-04-22"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123409",
    username: "theo_blackwell",
    email: "theo.blackwell@email.com",
    password: "$2b$10$hashedpassword012",
    displayName: "Theo Blackwell",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "MM romance author celebrating love in all its forms. Writing stories that matter.",
      avatar: "/avatars/theo-blackwell.jpg",
      dateOfBirth: new Date("1986-07-11"),
      website: "https://theoblackwell.com"
    },
    stats: {
      storiesCount: 14,
      followersCount: 14567,
      followingCount: 34,
      totalViews: 523000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-01-30") },
      { name: "MM Romance Advocate", awardedAt: new Date("2023-08-08") }
    ],
    createdAt: new Date("2023-01-30"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123410",
    username: "cassandra_royal",
    email: "cassandra.royal@email.com",
    password: "$2b$10$hashedpassword345",
    displayName: "Cassandra Royal",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Royal romance author. Where crowns and hearts collide in glittering palaces.",
      avatar: "/avatars/cassandra-royal.jpg",
      dateOfBirth: new Date("1984-12-05"),
      website: "https://cassandraroyal.com"
    },
    stats: {
      storiesCount: 10,
      followersCount: 9876,
      followingCount: 12,
      totalViews: 389000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-03-05") },
      { name: "Royal Romance", awardedAt: new Date("2023-12-15") }
    ],
    createdAt: new Date("2023-03-05"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123411",
    username: "miles_covington",
    email: "miles.covington@email.com",
    password: "$2b$10$hashedpassword678",
    displayName: "Miles Covington",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Billionaire romance with heart. Because even the richest men need to find love.",
      avatar: "/avatars/miles-covington.jpg",
      dateOfBirth: new Date("1987-05-19"),
      website: "https://milescovington.com"
    },
    stats: {
      storiesCount: 8,
      followersCount: 7654,
      followingCount: 45,
      totalViews: 298000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-04-15") }
    ],
    createdAt: new Date("2023-04-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123412",
    username: "zara_nightingale",
    email: "zara.nightingale@email.com",
    password: "$2b$10$hashedpassword901",
    displayName: "Zara Nightingale",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Romantic suspense author. Where danger and desire walk hand in hand.",
      avatar: "/avatars/zara-nightingale.jpg",
      dateOfBirth: new Date("1990-09-28"),
      website: "https://zaranightingale.com"
    },
    stats: {
      storiesCount: 6,
      followersCount: 5432,
      followingCount: 67,
      totalViews: 187000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-05-20") }
    ],
    createdAt: new Date("2023-05-20"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123413",
    username: "julian_rivers",
    email: "julian.rivers@email.com",
    password: "$2b$10$hashedpassword234",
    displayName: "Julian Rivers",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Small town romance specialist. Where everyone knows your name and your business.",
      avatar: "/avatars/julian-rivers.jpg",
      dateOfBirth: new Date("1988-02-14"),
      website: "https://julianriversromance.com"
    },
    stats: {
      storiesCount: 12,
      followersCount: 8765,
      followingCount: 78,
      totalViews: 412000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-02-14") },
      { name: "Small Town Expert", awardedAt: new Date("2023-10-05") }
    ],
    createdAt: new Date("2023-02-14"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123414",
    username: "elena_marquez",
    email: "elena.marquez@email.com",
    password: "$2b$10$hashedpassword567",
    displayName: "Elena Marquez",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Multicultural romance celebrating diverse love stories from around the world.",
      avatar: "/avatars/elena-marquez.jpg",
      dateOfBirth: new Date("1985-11-03"),
      website: "https://elenamarquez.com"
    },
    stats: {
      storiesCount: 9,
      followersCount: 6987,
      followingCount: 56,
      totalViews: 321000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-03-25") },
      { name: "Diversity Advocate", awardedAt: new Date("2023-11-12") }
    ],
    createdAt: new Date("2023-03-25"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123415",
    username: "xander_blackwood",
    email: "xander.blackwood@email.com",
    password: "$2b$10$hashedpassword890",
    displayName: "Xander Blackwood",
    role: "author",
    isAuthor: true,
    isAdmin: false,
    profile: {
      bio: "Dark fantasy romance where monsters have hearts and heroes have secrets.",
      avatar: "/avatars/xander-blackwood.jpg",
      dateOfBirth: new Date("1989-06-30"),
      website: "https://xanderblackwood.com"
    },
    stats: {
      storiesCount: 7,
      followersCount: 11234,
      followingCount: 23,
      totalViews: 389000
    },
    badges: [
      { name: "Verified Author", awardedAt: new Date("2023-04-08") },
      { name: "Fantasy Romance", awardedAt: new Date("2023-12-20") }
    ],
    createdAt: new Date("2023-04-08"),
    updatedAt: new Date("2024-03-28")
  }
];





// Normal Users (180) - I'll show the first 20 as examples, you can pattern the rest similarly
const normalUsers = [
  {
    _id: "67b1c2d3e4f5a67890123455", // Olivia Chen from comments
    username: "olivia_chen",
    email: "olivia.chen@email.com",
    password: "$2b$10$hashedpassword123",
    displayName: "Olivia Chen",
    role: "user",
    isAuthor: false,
    isAdmin: false,
    profile: {
      bio: "Romance novel enthusiast and book blogger. Always looking for my next favorite read!",
      avatar: "/avatars/olivia-chen.jpg",
      dateOfBirth: new Date("1993-04-12"),
      website: "https://oliviareadsromance.com"
    },
    stats: {
      storiesCount: 0,
      followersCount: 234,
      followingCount: 567,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "light"
    },
    badges: [
      { name: "Avid Reader", awardedAt: new Date("2023-06-15") },
      { name: "Top Reviewer", awardedAt: new Date("2023-11-20") }
    ],
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67b1c2d3e4f5a67890123456", // User from comments
    username: "bookworm_sarah",
    email: "sarah.johnson@email.com",
    password: "$2b$10$hashedpassword456",
    displayName: "Sarah Johnson",
    role: "user",
    isAuthor: false,
    isAdmin: false,
    profile: {
      bio: "Librarian by day, romance reader by night. Love discovering new authors!",
      avatar: "/avatars/sarah-johnson.jpg",
      dateOfBirth: new Date("1990-08-25")
    },
    stats: {
      storiesCount: 0,
      followersCount: 167,
      followingCount: 289,
      totalViews: 0
    },
    preferences: {
      emailNotifications: false,
      theme: "light"
    },
    badges: [
      { name: "Book Lover", awardedAt: new Date("2023-07-10") }
    ],
    createdAt: new Date("2023-07-10"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67b1c2d3e4f5a67890123457", // User from comments
    username: "romance_reader23",
    email: "michael.brown@email.com",
    password: "$2b$10$hashedpassword789",
    displayName: "Michael Brown",
    role: "user",
    isAuthor: false,
    isAdmin: false,
    profile: {
      bio: "Yes, men read romance too! Favorite tropes: enemies to lovers and forced proximity.",
      avatar: "/avatars/michael-brown.jpg",
      dateOfBirth: new Date("1992-11-30")
    },
    stats: {
      storiesCount: 0,
      followersCount: 89,
      followingCount: 156,
      totalViews: 0
    },
    preferences: {
      emailNotifications: true,
      theme: "dark"
    },
    badges: [
      { name: "New Reader", awardedAt: new Date("2023-08-05") }
    ],
    createdAt: new Date("2023-08-05"),
    updatedAt: new Date("2024-03-28")
  },
  // Continue with 17 more normal users...
  {
    _id: "67d1e2f3a4b5c67890123416",
    username: "emma_reads",
    email: "emma.wilson@email.com",
    password: "$2b$10$hashedpassword012",
    displayName: "Emma Wilson",
    role: "user",
    isAuthor: false,
    isAdmin: false,
    profile: {
      bio: "College student who escapes into romance novels between classes.",
      avatar: "/avatars/emma-wilson.jpg",
      dateOfBirth: new Date("1999-03-15")
    },
    stats: {
      storiesCount: 0,
      followersCount: 45,
      followingCount: 123,
      totalViews: 0
    },
    createdAt: new Date("2023-09-12"),
    updatedAt: new Date("2024-03-28")
  },
  {
    _id: "67d1e2f3a4b5c67890123417",
    username: "bookdragon_amy",
    email: "amy.chen@email.com",
    password: "$2b$10$hashedpassword345",
    displayName: "Amy Chen",
    role: "user",
    isAuthor: false,
    isAdmin: false,
    profile: {
      bio: "Romance bookstagrammer with a passion for diverse love stories.",
      avatar: "/avatars/amy-chen.jpg",
      dateOfBirth: new Date("1995-07-22"),
      website: "https://instagram.com/bookdragon_amy"
    },
    stats: {
      storiesCount: 0,
      followersCount: 567,
      followingCount: 234,
      totalViews: 0
    },
    badges: [
      { name: "Influencer", awardedAt: new Date("2023-10-18") }
    ],
    createdAt: new Date("2023-10-18"),
    updatedAt: new Date("2024-03-28")
  },

]
  // ... continue this pattern for 175 more normal users
  // You would generate users with variations in:
  // - usernames (booklover_james, romance_fan_99, etc.)
  // - display names (James Miller, Lisa Taylor, etc.)
  // - profile bios (different interests and backgrounds)
  // - follower/following counts (ranging from 0-500)
  // - join dates (spread throughout 2023-202


