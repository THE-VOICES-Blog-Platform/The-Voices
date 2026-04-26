// Content moderation keyword filter
// This runs client-side BEFORE any post/comment is submitted to Firestore.

const BANNED_KEYWORDS = [
  // Nudity / Sexual
  'nude', 'nudity', 'naked', 'nsfw', 'porn', 'pornography', 'xxx', 'sex tape',
  'onlyfans', 'erotic', 'genitals', 'explicit',
  // Violence / Hate
  'kys', 'kill yourself', 'suicide method', 'bomb making', 'terrorist',
  'genocide', 'rape', 'molest',
  // Slurs (abbreviated to avoid storing them in plaintext)
  'n1gger', 'f4ggot', 'ch1nk', 'sp1c',
];

export interface ModerationResult {
  isClean: boolean;
  violations: string[];
  warningMessage: string;
}

export const moderateContent = (text: string): ModerationResult => {
  // Strip HTML tags from TipTap output before checking
  const plainText = text.replace(/<[^>]+>/g, ' ').toLowerCase();

  const violations: string[] = [];

  for (const keyword of BANNED_KEYWORDS) {
    if (plainText.includes(keyword.toLowerCase())) {
      violations.push(keyword);
    }
  }

  if (violations.length > 0) {
    return {
      isClean: false,
      violations,
      warningMessage: `Your submission was blocked because it contains content that violates our community standards. Please review and revise your content before resubmitting.`,
    };
  }

  return { isClean: true, violations: [], warningMessage: '' };
};

export const ADMIN_UID = 'aU3lNVq9wsY8YGyoUlNs2iRvDBq2';
