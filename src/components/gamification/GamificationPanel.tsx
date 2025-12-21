import { useState } from 'react';
import { Trophy, Star, Flame, Medal, Crown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGamification, Badge as BadgeType, LeaderboardEntry } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  academic: 'Académique',
  attendance: 'Assiduité',
  social: 'Social',
  special: 'Spécial'
};

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  attendance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  social: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  special: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
};

export const GamificationPanel = () => {
  const {
    userXP,
    badges,
    earnedBadges,
    leaderboard,
    isLoading,
    getXPProgress
  } = useGamification();

  const xpProgress = getXPProgress();
  const earnedBadgeIds = earnedBadges.map(eb => eb.badge_id);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30 overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Niveau {userXP?.level || 1}</CardTitle>
                  <p className="text-sm text-muted-foreground">{userXP?.total_xp || 0} XP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userXP?.streak_days ? (
                  <Badge variant="secondary" className="gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {userXP.streak_days}j
                  </Badge>
                ) : null}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{xpProgress.current} XP</span>
                <span>{xpProgress.needed} XP</span>
              </div>
              <Progress value={xpProgress.percentage} className="h-2" />
              <div className="flex gap-1 mt-3">
                {earnedBadges.slice(0, 5).map((ub) => (
                  <span key={ub.id} className="text-lg" title={ub.badge?.name}>
                    {ub.badge?.icon}
                  </span>
                ))}
                {earnedBadges.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{earnedBadges.length - 5}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl">Votre Progression</span>
              <p className="text-sm font-normal text-muted-foreground">Niveau {userXP?.level || 1} • {userXP?.total_xp || 0} XP</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges" className="gap-2">
              <Star className="w-4 h-4" />
              Badges ({earnedBadges.length}/{badges.length})
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Crown className="w-4 h-4" />
              Classement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.keys(categoryLabels).map(category => {
                  const categoryBadges = badges.filter(b => b.category === category);
                  if (categoryBadges.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-xs", categoryColors[category])}>
                          {categoryLabels[category]}
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categoryBadges.map(badge => {
                          const isEarned = earnedBadgeIds.includes(badge.id);
                          return (
                            <div
                              key={badge.id}
                              className={cn(
                                "relative p-3 rounded-lg border-2 transition-all",
                                isEarned
                                  ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30"
                                  : "bg-muted/30 border-muted opacity-60 grayscale"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-2xl">{badge.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{badge.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-amber-500" />
                                    <span className="text-xs font-medium">{badge.xp_reward} XP</span>
                                  </div>
                                </div>
                              </div>
                              {isEarned && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === userXP?.user_id;
                  return (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg transition-colors",
                        isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        {index === 0 ? (
                          <span className="text-2xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-2xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium truncate", isCurrentUser && "text-primary")}>
                          {entry.first_name} {entry.last_name.charAt(0)}.
                          {isCurrentUser && <span className="text-xs ml-2">(vous)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Niveau {entry.level} • {entry.badge_count} badges
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.total_xp.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Aucun classement disponible</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
