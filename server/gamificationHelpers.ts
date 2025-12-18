import { getDb } from "./db";
import { profileBadges, userBadges, userPoints } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Award badge to user if they haven't earned it yet
 */
export async function awardBadgeIfEligible(userId: number, milestone: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find the badge for this milestone
  const [badge] = await db
    .select()
    .from(profileBadges)
    .where(eq(profileBadges.milestone, milestone))
    .limit(1);

  if (!badge) return false;

  // Check if user already has this badge
  const [existing] = await db
    .select()
    .from(userBadges)
    .where(and(
      eq(userBadges.userId, userId),
      eq(userBadges.badgeId, badge.id)
    ))
    .limit(1);

  if (existing) return false;

  // Award the badge
  await db.insert(userBadges).values({
    userId,
    badgeId: badge.id,
    viewed: false,
  });

  // Award points
  await addPoints(userId, badge.points);

  return true;
}

/**
 * Add points to user's total and update level
 */
export async function addPoints(userId: number, points: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get or create user points record
  const [existing] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .limit(1);

  if (existing) {
    const newTotal = existing.totalPoints + points;
    const newLevel = calculateLevel(newTotal);
    
    await db
      .update(userPoints)
      .set({
        totalPoints: newTotal,
        level: newLevel,
      })
      .where(eq(userPoints.userId, userId));
  } else {
    const newLevel = calculateLevel(points);
    
    await db.insert(userPoints).values({
      userId,
      totalPoints: points,
      level: newLevel,
    });
  }
}

/**
 * Calculate level from total points
 * Level 1: 0-99 points
 * Level 2: 100-299 points
 * Level 3: 300-599 points
 * Level 4: 600-999 points
 * Level 5: 1000+ points
 */
function calculateLevel(totalPoints: number): number {
  if (totalPoints >= 1000) return 5;
  if (totalPoints >= 600) return 4;
  if (totalPoints >= 300) return 3;
  if (totalPoints >= 100) return 2;
  return 1;
}

/**
 * Get user's badges and points
 */
export async function getUserGamificationData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user points
  const [points] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .limit(1);

  // Get user badges with badge details
  const badges = await db
    .select({
      id: userBadges.id,
      badgeId: userBadges.badgeId,
      earnedAt: userBadges.earnedAt,
      viewed: userBadges.viewed,
      name: profileBadges.name,
      description: profileBadges.description,
      icon: profileBadges.icon,
      color: profileBadges.color,
      milestone: profileBadges.milestone,
      points: profileBadges.points,
    })
    .from(userBadges)
    .leftJoin(profileBadges, eq(userBadges.badgeId, profileBadges.id))
    .where(eq(userBadges.userId, userId));

  return {
    points: points || { totalPoints: 0, level: 1 },
    badges,
  };
}

/**
 * Mark user badges as viewed
 */
export async function markBadgesAsViewed(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userBadges)
    .set({ viewed: true })
    .where(eq(userBadges.userId, userId));
}

/**
 * Check and award badges based on profile completion percentage
 */
export async function checkAndAwardBadges(userId: number, completionPercentage: number): Promise<string[]> {
  const awarded: string[] = [];

  // Check each milestone
  const milestones = [50, 75, 100];
  for (const milestone of milestones) {
    if (completionPercentage >= milestone) {
      const wasAwarded = await awardBadgeIfEligible(userId, milestone);
      if (wasAwarded) {
        const badgeName = milestone === 50 ? "Profile Starter" : 
                          milestone === 75 ? "Profile Pro" : "Profile Master";
        awarded.push(badgeName);
      }
    }
  }

  return awarded;
}
