export interface Channel {
  id: string;
  title: string;
  customName: string;
  uploadsPlaylistId: string;
  platform?: 'youtube' | 'facebook' | 'instagram' | 'facebook_group';
  snippet?: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

export interface Snapshot {
  channelId: string;
  date: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
}

export interface Video {
  id: string;
  channelId: string;
  title: string;
  publishedAt: string;
  durationSec: number;
  views: number;
  likes: number;
  comments: number;
}

export interface DashboardState {
  config: {
    stagnationThreshold: number;
    youtubeApiKey: string;
    geminiApiKey: string;
  };
  channels: Channel[];
  snapshots: Snapshot[];
  videos: Video[];
}

export interface BusinessMetrics {
  fastestGrowingChannel: {
    channel: Channel;
    growthRate: number;
    netGrowth: number;
    startSubs: number;
    endSubs: number;
  } | null;
  mostSuccessfulVideo: {
    video: Video;
    channel: Channel;
    interactions: number;
    engagementRate: number;
  } | null;
  contentPerformance: {
    shorts: { count: number; avgEngagement: number };
    longs: { count: number; avgEngagement: number };
    winner: 'Shorts' | 'Videos Largos' | 'Empate' | 'Sin Datos';
  };
  stagnationList: Array<{
    channel: Channel;
    growthRate: number;
    isStagnant: boolean;
    threshold?: number;
  }>;
  trends: Array<{
    channel: Channel;
    trendType: 'Creciente' | 'Plana' | 'Decreciente';
    firstHalfAvg: number;
    secondHalfAvg: number;
  }>;
}
