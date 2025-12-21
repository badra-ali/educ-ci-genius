import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'academic' | 'attendance' | 'social' | 'special';
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  level: number;
  first_name: string;
  last_name: string;
  badge_count: number;
  rank: number;
}

export const useGamification = () => {
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Calculate XP needed for next level
  const getXPForLevel = (level: number) => (level - 1) * (level - 1) * 100;
  const getXPProgress = () => {
    if (!userXP) return { current: 0, needed: 100, percentage: 0 };
    const currentLevelXP = getXPForLevel(userXP.level);
    const nextLevelXP = getXPForLevel(userXP.level + 1);
    const xpInLevel = userXP.total_xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    return {
      current: xpInLevel,
      needed: xpNeeded,
      percentage: Math.min(100, (xpInLevel / xpNeeded) * 100)
    };
  };

  // Fetch all data
  const fetchGamificationData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch badges definitions
      const { data: badgesData } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });

      if (badgesData) {
        setBadges(badgesData as Badge[]);
      }

      // Fetch user XP
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (xpError && xpError.code !== 'PGRST116') {
        console.error('Error fetching XP:', xpError);
      }

      if (xpData) {
        setUserXP(xpData as UserXP);
      } else {
        // Initialize XP for new user
        const { data: newXP, error: insertError } = await supabase
          .from('user_xp')
          .insert({
            user_id: user.id,
            total_xp: 0,
            level: 1,
            streak_days: 0
          })
          .select()
          .single();

        if (!insertError && newXP) {
          setUserXP(newXP as UserXP);
        }
      }

      // Fetch earned badges
      const { data: earnedData } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          earned_at
        `)
        .eq('user_id', user.id);

      if (earnedData && badgesData) {
        const enrichedBadges = earnedData.map(ub => ({
          ...ub,
          badge: badgesData.find(b => b.id === ub.badge_id)
        }));
        setEarnedBadges(enrichedBadges as UserBadge[]);
      }

      // Fetch leaderboard
      const { data: leaderboardData } = await supabase
        .from('user_xp')
        .select('user_id, total_xp, level')
        .order('total_xp', { ascending: false })
        .limit(10);

      if (leaderboardData) {
        // Fetch profiles for leaderboard users
        const userIds = leaderboardData.map(l => l.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        // Fetch badge counts
        const { data: badgeCounts } = await supabase
          .from('user_badges')
          .select('user_id')
          .in('user_id', userIds);

        const badgeCountMap: Record<string, number> = {};
        badgeCounts?.forEach(bc => {
          badgeCountMap[bc.user_id] = (badgeCountMap[bc.user_id] || 0) + 1;
        });

        const enrichedLeaderboard = leaderboardData.map((entry, index) => {
          const profile = profilesData?.find(p => p.id === entry.user_id);
          return {
            ...entry,
            first_name: profile?.first_name || 'Utilisateur',
            last_name: profile?.last_name || '',
            badge_count: badgeCountMap[entry.user_id] || 0,
            rank: index + 1
          };
        });

        setLeaderboard(enrichedLeaderboard as LeaderboardEntry[]);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add XP
  const addXP = async (amount: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !userXP) return;

      const newTotalXP = userXP.total_xp + amount;
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newTotalXP / 100)) + 1);
      const leveledUp = newLevel > userXP.level;

      // Update XP
      const { error: updateError } = await supabase
        .from('user_xp')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log XP history
      await supabase
        .from('xp_history')
        .insert({
          user_id: user.id,
          xp_amount: amount,
          reason
        });

      setUserXP(prev => prev ? {
        ...prev,
        total_xp: newTotalXP,
        level: newLevel
      } : null);

      // Show toast
      toast({
        title: `+${amount} XP`,
        description: leveledUp 
          ? `🎉 Niveau ${newLevel} atteint !` 
          : reason,
      });

      return { leveledUp, newLevel };
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  // Award badge
  const awardBadge = async (badgeCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const badge = badges.find(b => b.code === badgeCode);
      if (!badge) return;

      // Check if already earned
      if (earnedBadges.some(eb => eb.badge_id === badge.id)) return;

      // Award badge
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badge.id
        });

      if (error) {
        if (error.code === '23505') return; // Already exists
        throw error;
      }

      // Add XP reward
      await addXP(badge.xp_reward, `Badge "${badge.name}" débloqué !`);

      setEarnedBadges(prev => [...prev, {
        id: crypto.randomUUID(),
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
        badge
      }]);

      toast({
        title: `${badge.icon} Badge débloqué !`,
        description: badge.name,
      });

      return badge;
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  // Update streak
  const updateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !userXP) return;

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = userXP.last_activity_date;

      if (lastActivity === today) return; // Already updated today

      let newStreak = 1;
      if (lastActivity) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActivity === yesterdayStr) {
          newStreak = userXP.streak_days + 1;
        }
      }

      await supabase
        .from('user_xp')
        .update({
          streak_days: newStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      setUserXP(prev => prev ? {
        ...prev,
        streak_days: newStreak,
        last_activity_date: today
      } : null);

      // Award streak badges
      if (newStreak >= 7) await awardBadge('week_streak');
      if (newStreak >= 30) await awardBadge('month_streak');

      // Daily login XP
      await addXP(10, 'Connexion quotidienne');

    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  // Update streak on mount
  useEffect(() => {
    if (userXP && badges.length > 0) {
      updateStreak();
    }
  }, [userXP?.id, badges.length]);

  return {
    userXP,
    badges,
    earnedBadges,
    leaderboard,
    isLoading,
    addXP,
    awardBadge,
    getXPProgress,
    refetch: fetchGamificationData
  };
};
