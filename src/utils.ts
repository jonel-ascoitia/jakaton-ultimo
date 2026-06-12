import { Channel, Snapshot, Video, BusinessMetrics } from "./types";

/**
 * Calculates raw interaction count for a video (likes + comments).
 * The public YouTube Data API v3 does not expose shares or saves.
 */
export function calculateInteractions(video: Video): number {
  return video.likes + video.comments;
}

/**
 * Calculates engagement rate for a single video.
 * Tasa de engagement (%) = (likes + comentarios) / vistas * 100
 * Handles 0 views safely as specified.
 */
export function calculateVideoEngagement(video: Video): number | null {
  if (video.views === 0) {
    return null;
  }
  const interactions = calculateInteractions(video);
  return (interactions / video.views) * 100;
}

/**
 * Calculates average engagement for a channel.
 * defined as the mean of the engagement rates of its videos.
 */
export function calculateChannelAverageEngagement(channelId: string, videos: Video[]): number {
  const channelVideos = videos.filter((v) => v.channelId === channelId);
  if (channelVideos.length === 0) return 0;

  let sumRate = 0;
  let validCount = 0;

  channelVideos.forEach((v) => {
    const rate = calculateVideoEngagement(v);
    if (rate !== null) {
      sumRate += rate;
      validCount++;
    }
  });

  return validCount > 0 ? sumRate / validCount : 0;
}

/**
 * Computes business metrics from the live dashboard state.
 */
export function computeBusinessMetrics(
  channels: Channel[],
  snapshots: Snapshot[],
  videos: Video[],
  stagnationThreshold: number
): BusinessMetrics {
  const result: BusinessMetrics = {
    fastestGrowingChannel: null,
    mostSuccessfulVideo: null,
    contentPerformance: {
      shorts: { count: 0, avgEngagement: 0 },
      longs: { count: 0, avgEngagement: 0 },
      winner: "Sin Datos"
    },
    stagnationList: [],
    trends: []
  };

  if (channels.length === 0) return result;

  // 1. Channel Growth Calculations & Fastest Growing & Stagnation
  let bestGrowthRate = -Infinity;
  
  channels.forEach((channel) => {
    // Get chronological snapshots for this channel
    const chanSnaps = snapshots
      .filter((s) => s.channelId === channel.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (chanSnaps.length >= 2) {
      const snapInicio = chanSnaps[0];
      const snapFin = chanSnaps[chanSnaps.length - 1];

      const startSubs = snapInicio.subscribers;
      const endSubs = snapFin.subscribers;
      const netGrowth = endSubs - startSubs;
      
      // Prevent division by zero if starting subscribers is 0
      const growthRate = startSubs > 0 ? (netGrowth / startSubs) * 100 : 0;

      // Track fastest growing (highest rate)
      if (growthRate > bestGrowthRate) {
        bestGrowthRate = growthRate;
        result.fastestGrowingChannel = {
          channel,
          growthRate,
          netGrowth,
          startSubs,
          endSubs
        };
      }

      // Check for stagnation (growth rate is less than or equal to threshold)
      const isStagnant = growthRate <= stagnationThreshold;
      result.stagnationList.push({
        channel,
        growthRate,
        isStagnant,
        threshold: stagnationThreshold
      });

      // 2. Trend assessment (compare first half vs second half of the series)
      const midPoint = Math.floor(chanSnaps.length / 2);
      const firstHalf = chanSnaps.slice(0, midPoint);
      const secondHalf = chanSnaps.slice(midPoint);

      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstHalfAvg = firstHalf.reduce((acc, s) => acc + s.subscribers, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((acc, s) => acc + s.subscribers, 0) / secondHalf.length;

        let trendType: 'Creciente' | 'Plana' | 'Decreciente' = 'Plana';
        // Give a tiny tolerance of 0.1% to distinguish a truly flat trend
        const upperThreshold = firstHalfAvg * 1.001;
        const lowerThreshold = firstHalfAvg * 0.999;

        if (secondHalfAvg > upperThreshold) {
          trendType = 'Creciente';
        } else if (secondHalfAvg < lowerThreshold) {
          trendType = 'Decreciente';
        } else {
          trendType = 'Plana';
        }

        result.trends.push({
          channel,
          trendType,
          firstHalfAvg,
          secondHalfAvg
        });
      } else {
        result.trends.push({
          channel,
          trendType: 'Plana',
          firstHalfAvg: startSubs,
          secondHalfAvg: endSubs
        });
      }

    } else if (chanSnaps.length === 1) {
      // Inadequate history state
      result.stagnationList.push({
        channel,
        growthRate: 0,
        isStagnant: false,
        threshold: stagnationThreshold
      });
      result.trends.push({
        channel,
        trendType: 'Plana',
        firstHalfAvg: chanSnaps[0].subscribers,
        secondHalfAvg: chanSnaps[0].subscribers
      });
      
      if (bestGrowthRate === -Infinity) {
        bestGrowthRate = 0;
        result.fastestGrowingChannel = {
          channel,
          growthRate: 0,
          netGrowth: 0,
          startSubs: chanSnaps[0].subscribers,
          endSubs: chanSnaps[0].subscribers
        };
      }
    }
  });

  // 3. Most Successful Video Calculation
  // Ordered by raw interactions (likes + comments); tie breaker is engagement rate
  let winnerVid: Video | null = null;
  let winnerChannel: Channel | null = null;
  let maxInteractions = -Infinity;
  let bestVidEngagement = -Infinity;

  videos.forEach((video) => {
    const channel = channels.find((c) => c.id === video.channelId);
    if (!channel) return;

    const interactions = calculateInteractions(video);
    const engagement = calculateVideoEngagement(video) || 0;

    if (interactions > maxInteractions) {
      maxInteractions = interactions;
      bestVidEngagement = engagement;
      winnerVid = video;
      winnerChannel = channel;
    } else if (interactions === maxInteractions) {
      // Tie breaker by engagement rate
      if (engagement > bestVidEngagement) {
        bestVidEngagement = engagement;
        winnerVid = video;
        winnerChannel = channel;
      }
    }
  });

  if (winnerVid && winnerChannel) {
    result.mostSuccessfulVideo = {
      video: winnerVid,
      channel: winnerChannel,
      interactions: maxInteractions,
      engagementRate: bestVidEngagement
    };
  }

  // 4. Content Performance (Shorts vs Long Videos)
  let shortsSumEngagement = 0;
  let shortsCount = 0;
  let longsSumEngagement = 0;
  let longsCount = 0;

  videos.forEach((video) => {
    const isShort = video.durationSec <= 60;
    const engagement = calculateVideoEngagement(video);
    if (engagement === null) return;

    if (isShort) {
      shortsSumEngagement += engagement;
      shortsCount++;
    } else {
      longsSumEngagement += engagement;
      longsCount++;
    }
  });

  const avgShortsEngagement = shortsCount > 0 ? shortsSumEngagement / shortsCount : 0;
  const avgLongsEngagement = longsCount > 0 ? longsSumEngagement / longsCount : 0;

  let winnerType: 'Shorts' | 'Videos Largos' | 'Empate' | 'Sin Datos' = 'Sin Datos';
  if (shortsCount > 0 || longsCount > 0) {
    if (Math.abs(avgShortsEngagement - avgLongsEngagement) < 0.01) {
      winnerType = "Empate";
    } else if (avgShortsEngagement > avgLongsEngagement) {
      winnerType = "Shorts";
    } else {
      winnerType = "Videos Largos";
    }
  }

  result.contentPerformance = {
    shorts: { count: shortsCount, avgEngagement: avgShortsEngagement },
    longs: { count: longsCount, avgEngagement: avgLongsEngagement },
    winner: winnerType
  };

  return result;
}

export interface PlatformSummary {
  platform: 'youtube' | 'facebook' | 'instagram' | 'facebook_group';
  name: string;
  totalSubscribers: number;
  growthRate: number;
  totalViews: number;
  avgEngagement: number;
  postCount: number;
}

export function calculateVideoWeeklyViewsGained(video: Video, latestDateStr: string = "2026-06-10"): number {
  const pubDate = new Date(video.publishedAt);
  const latestDate = new Date(latestDateStr + "T00:00:00");
  const diffMs = latestDate.getTime() - pubDate.getTime();
  const diffDays = diffMs / (1000 * 3600 * 24);
  
  if (diffDays <= 7) {
    // Publicado en los últimos 7 días (o el mismo día con desfase horario), 100% ganadas en la semana
    return video.views;
  } else if (diffDays > 7 && diffDays <= 30) {
    // Reciente de este mes (7 a 30 días), estimamos un 15% - 25% ganado en la última semana
    return Math.round(video.views * (0.15 + (video.views % 10) * 0.01));
  } else {
    // Antigua, gana de forma orgánica pasiva (3% a 6% de acumulación semanal)
    return Math.round(video.views * (0.03 + (video.views % 6) * 0.005));
  }
}

export function getPlatformSummary(
  channels: Channel[],
  snapshots: Snapshot[],
  videos: Video[]
): PlatformSummary[] {
  const platforms: Array<'youtube' | 'facebook' | 'instagram' | 'facebook_group'> = [
    'youtube',
    'facebook',
    'instagram',
    'facebook_group'
  ];

  const names: Record<string, string> = {
    youtube: 'YouTube 🔴',
    facebook: 'Facebook Página 🔵',
    instagram: 'Instagram 📸',
    facebook_group: 'Facebook Grupos 👥'
  };

  return platforms.map((p) => {
    const platformChannels = channels.filter((c) => (c.platform || 'youtube') === p);
    
    let totalSubscribers = 0;
    let startSubs = 0;
    let endSubs = 0;
    let totalViews = 0;
    let sumEngagement = 0;
    let postCount = 0;

    platformChannels.forEach((chan) => {
      const chanSnaps = snapshots
        .filter((s) => s.channelId === chan.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (chanSnaps.length > 0) {
        const latestSnap = chanSnaps[chanSnaps.length - 1];
        totalSubscribers += latestSnap.subscribers;
        endSubs += latestSnap.subscribers;
        
        const firstSnap = chanSnaps[0];
        startSubs += firstSnap.subscribers;
        
        totalViews += latestSnap.totalViews;
      }

      // Videos/posts for channel
      const chanVids = videos.filter((v) => v.channelId === chan.id);
      postCount += chanVids.length;
      chanVids.forEach((v) => {
        const rate = calculateVideoEngagement(v);
        if (rate !== null) {
          sumEngagement += rate;
        }
      });
    });

    const netGrowth = endSubs - startSubs;
    const growthRate = startSubs > 0 ? (netGrowth / startSubs) * 100 : 0;
    const avgEngagement = postCount > 0 ? sumEngagement / postCount : 0;

    return {
      platform: p,
      name: names[p],
      totalSubscribers,
      growthRate,
      totalViews,
      avgEngagement,
      postCount
    };
  });
}
