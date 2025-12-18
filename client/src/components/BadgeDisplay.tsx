import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Trophy, Star, Zap } from "lucide-react";
import { useEffect } from "react";

export function BadgeDisplay() {
  const { data: gamificationData, refetch } = trpc.gamification.getGamificationData.useQuery();
  const markViewedMutation = trpc.gamification.markBadgesViewed.useMutation();

  // Mark badges as viewed when component mounts
  useEffect(() => {
    if (gamificationData?.badges.some(b => !b.viewed)) {
      markViewedMutation.mutate(undefined, {
        onSuccess: () => refetch(),
      });
    }
  }, [gamificationData]);

  if (!gamificationData) return null;

  const { points, badges } = gamificationData;
  const hasNewBadges = badges.some(b => !b.viewed);

  const getLevelIcon = (level: number) => {
    if (level >= 5) return Trophy;
    if (level >= 3) return Star;
    return Zap;
  };

  const LevelIcon = getLevelIcon(points.level);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Achievements
          {hasNewBadges && (
            <Badge variant="destructive" className="ml-auto">
              New!
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Earn badges and points by completing your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points and Level */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {points.totalPoints}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LevelIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {points.level}
              </p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Earned Badges ({badges.length})
          </p>
          {badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                    !badge.viewed
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950 animate-pulse'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {!badge.viewed && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full" />
                  )}
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {badge.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    +{badge.points} pts
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Complete your profile to earn badges!</p>
            </div>
          )}
        </div>

        {/* Next Badge */}
        {badges.length < 3 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Next Badge:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {badges.length === 0 && "🌱 Profile Starter - Complete 50% of your profile"}
              {badges.length === 1 && "⭐ Profile Pro - Complete 75% of your profile"}
              {badges.length === 2 && "🏆 Profile Master - Complete 100% of your profile"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
