export const TAX_THRESHOLD = 95750;
export const VAT_THRESHOLD = 1000000;
export const PROVISIONAL_TAX_THRESHOLD = 30000;

export const TAX_BRACKETS = [
  { min: 0, max: 95750, rate: 0, base: 0 },
  { min: 95751, max: 237100, rate: 0.18, base: 0 },
  { min: 237101, max: 370500, rate: 0.26, base: 25443 },
  { min: 370501, max: 512800, rate: 0.31, base: 60127 },
  { min: 512801, max: 673000, rate: 0.36, base: 104240 },
  { min: 673001, max: 857900, rate: 0.39, base: 161952 },
  { min: 857901, max: 1817000, rate: 0.41, base: 234074 },
  { min: 1817001, max: Infinity, rate: 0.45, base: 627283 }
];

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

export const SA_BANKS = [
  'ABSA',
  'African Bank',
  'Capitec',
  'Discovery Bank',
  'FNB',
  'Investec',
  'Nedbank',
  'Standard Bank',
  'TymeBank'
];

// Creator Economy - Digital Creators / Influencers
export const CREATOR_TYPES = [
  { value: 'social_media_influencer', label: 'Social Media Influencer', category: 'creator' },
  { value: 'content_creator', label: 'Content Creator / YouTuber', category: 'creator' },
  { value: 'podcaster', label: 'Podcaster', category: 'creator' },
  { value: 'writer_blogger', label: 'Writer / Blogger', category: 'creator' },
  { value: 'newsletter_author', label: 'Newsletter Author (Substack, Medium)', category: 'creator' },
  { value: 'streamer_gamer', label: 'Streamer / Gamer', category: 'creator' },
  { value: 'educator_coach', label: 'Online Educator / Coach', category: 'creator' },
  { value: 'course_creator', label: 'Course Creator', category: 'creator' },
  { value: 'artist', label: 'Digital Artist', category: 'creator' },
  { value: 'musician', label: 'Musician / Producer', category: 'creator' },
  { value: 'designer_creative', label: 'Designer (Behance, Patreon)', category: 'creator' },
];

// Gig Economy - Freelancers / Micro-Service Providers
export const GIG_TYPES = [
  { value: 'graphic_designer', label: 'Graphic Designer', category: 'gig' },
  { value: 'videographer', label: 'Videographer', category: 'gig' },
  { value: 'photographer', label: 'Photographer', category: 'gig' },
  { value: 'video_editor', label: 'Video Editor', category: 'gig' },
  { value: 'developer', label: 'Developer / Programmer', category: 'gig' },
  { value: 'digital_marketer', label: 'Digital Marketer', category: 'gig' },
  { value: 'copywriter', label: 'Copywriter', category: 'gig' },
  { value: 'ux_designer', label: 'UX/UI Designer', category: 'gig' },
  { value: 'uber_driver', label: 'Uber Driver', category: 'gig' },
  { value: 'bolt_driver', label: 'Bolt Driver', category: 'gig' },
  { value: 'delivery_rider', label: 'Delivery Rider (Mr D, Uber Eats)', category: 'gig' },
  { value: 'task_worker', label: 'TaskRabbit / SweepSouth Worker', category: 'gig' },
  { value: 'hairstylist', label: 'Hairstylist / Barber', category: 'gig' },
  { value: 'makeup_artist', label: 'Makeup Artist', category: 'gig' },
  { value: 'tailor', label: 'Tailor / Seamstress', category: 'gig' },
  { value: 'virtual_assistant', label: 'Virtual Assistant', category: 'gig' },
  { value: 'online_seller', label: 'Online Seller (Takealot, etc.)', category: 'gig' },
  { value: 'consultant', label: 'Consultant / Advisor', category: 'gig' },
];

// Combined list for backward compatibility
export const USER_TYPES = [
  ...CREATOR_TYPES.map(t => t.label),
  ...GIG_TYPES.map(t => t.label),
  'Other'
];

// All work types for onboarding
export const ALL_WORK_TYPES = [...CREATOR_TYPES, ...GIG_TYPES];

export const SA_PLATFORMS = [
  // Social Media
  { value: 'instagram', label: 'Instagram', category: 'social' },
  { value: 'tiktok', label: 'TikTok', category: 'social' },
  { value: 'youtube', label: 'YouTube', category: 'social' },
  { value: 'facebook', label: 'Facebook', category: 'social' },
  { value: 'twitter', label: 'Twitter/X', category: 'social' },
  { value: 'linkedin', label: 'LinkedIn', category: 'social' },
  { value: 'twitch', label: 'Twitch', category: 'social' },
  { value: 'kick', label: 'Kick', category: 'social' },

  // Content Platforms
  { value: 'substack', label: 'Substack', category: 'content' },
  { value: 'medium', label: 'Medium', category: 'content' },
  { value: 'patreon', label: 'Patreon', category: 'content' },
  { value: 'behance', label: 'Behance', category: 'content' },
  { value: 'soundcloud', label: 'SoundCloud', category: 'content' },

  // Gig Platforms
  { value: 'uber', label: 'Uber', category: 'gig' },
  { value: 'bolt', label: 'Bolt', category: 'gig' },
  { value: 'mr_d', label: 'Mr D Food', category: 'gig' },
  { value: 'uber_eats', label: 'Uber Eats', category: 'gig' },
  { value: 'takealot', label: 'Takealot', category: 'gig' },
  { value: 'upwork', label: 'Upwork', category: 'gig' },
  { value: 'fiverr', label: 'Fiverr', category: 'gig' },
  { value: 'freelancer', label: 'Freelancer.com', category: 'gig' },
  { value: 'sweepsouth', label: 'SweepSouth', category: 'gig' },

  // Direct
  { value: 'direct_client', label: 'Direct Clients', category: 'direct' },
  { value: 'other', label: 'Other', category: 'other' }
];

export const FOLLOWER_RANGES = [
  { value: '0-1000', label: 'Under 1,000 (Nano)', min: 0, max: 1000 },
  { value: '1000-10000', label: '1K - 10K (Micro)', min: 1000, max: 10000 },
  { value: '10000-100000', label: '10K - 100K (Mid-tier)', min: 10000, max: 100000 },
  { value: '100000-1000000', label: '100K - 1M (Macro)', min: 100000, max: 1000000 },
  { value: '1000000+', label: '1M+ (Mega)', min: 1000000, max: Infinity },
  { value: 'not_applicable', label: 'Not Applicable', min: 0, max: 0 }
];

export const EXPENSE_CATEGORIES = [
  'Home Office (Max 50%)',
  'Data & Airtime',
  'Equipment & Software',
  'Travel (Log Book Required)',
  'Marketing & Advertising',
  'Professional Services',
  'Bank Charges',
  'Training & Development',
  'Insurance',
  'Repairs & Maintenance',
  'Other Deductible'
];

export const INCOME_CATEGORIES = [
  { value: 'eft', label: 'EFT Payment' },
  { value: 'cash', label: 'Cash Payment' },
  { value: 'barter', label: 'Barter/In-Kind' },
  { value: 'sponsorship', label: 'Sponsorship' }
];
