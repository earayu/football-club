export function generateClubJsonLd(club: {
  name: string;
  slug: string;
  description?: string | null;
  badge_url?: string | null;
  founded_date?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: club.name,
    url: `https://footballclub.app/en/club/${club.slug}`,
    description: club.description || undefined,
    logo: club.badge_url || undefined,
    foundingDate: club.founded_date || undefined,
    sport: "Football",
  };
}
