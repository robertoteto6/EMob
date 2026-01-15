// YouTube Data API v3 Service for fetching player highlights
// API Key: AIzaSyCJS066qlp31BZzUmZWRH0_wrrcosjdwS0

const YOUTUBE_API_KEY = 'AIzaSyCJS066qlp31BZzUmZWRH0_wrrcosjdwS0';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailHigh: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  totalResults: number;
  nextPageToken?: string;
}

// Convert ISO 8601 duration to readable format
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Search for player highlight videos
export async function searchPlayerHighlights(
  playerName: string,
  gameName?: string,
  maxResults: number = 10
): Promise<YouTubeSearchResult> {
  try {
    // Build search query
    const searchTerms = [
      playerName,
      gameName || '',
      'esports highlights',
    ].filter(Boolean).join(' ');

    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: searchTerms,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      videoDuration: 'medium', // Filter for medium length videos (4-20 min)
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('YouTube API search error:', response.status);
      return { videos: [], totalResults: 0 };
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return { videos: [], totalResults: 0 };
    }

    // Get video IDs for additional details
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    
    // Fetch video details for duration and view counts
    const detailsParams = new URLSearchParams({
      part: 'contentDetails,statistics',
      id: videoIds,
      key: YOUTUBE_API_KEY,
    });

    const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`, {
      next: { revalidate: 3600 }
    });

    let videoDetails: Record<string, any> = {};
    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      videoDetails = detailsData.items?.reduce((acc: any, item: any) => {
        acc[item.id] = {
          duration: formatDuration(item.contentDetails?.duration || ''),
          viewCount: parseInt(item.statistics?.viewCount || '0'),
          likeCount: parseInt(item.statistics?.likeCount || '0'),
        };
        return acc;
      }, {}) || {};
    }

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      thumbnailHigh: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: videoDetails[item.id.videoId]?.duration,
      viewCount: videoDetails[item.id.videoId]?.viewCount,
      likeCount: videoDetails[item.id.videoId]?.likeCount,
    }));

    return {
      videos,
      totalResults: data.pageInfo?.totalResults || videos.length,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return { videos: [], totalResults: 0 };
  }
}

// Search for specific match highlights
export async function searchMatchHighlights(
  playerName: string,
  teamName: string,
  opponentName: string,
  tournamentName?: string,
  maxResults: number = 5
): Promise<YouTubeSearchResult> {
  try {
    const searchTerms = [
      playerName,
      teamName,
      'vs',
      opponentName,
      tournamentName || '',
      'highlights',
    ].filter(Boolean).join(' ');

    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: searchTerms,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return { videos: [], totalResults: 0 };
    }

    const data = await response.json();

    const videos: YouTubeVideo[] = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url,
      thumbnailHigh: item.snippet.thumbnails.high?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return {
      videos,
      totalResults: data.pageInfo?.totalResults || videos.length,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Error searching match highlights:', error);
    return { videos: [], totalResults: 0 };
  }
}

// Search for player interviews and content
export async function searchPlayerContent(
  playerName: string,
  contentType: 'interview' | 'stream' | 'analysis' = 'interview',
  maxResults: number = 5
): Promise<YouTubeSearchResult> {
  try {
    const contentTypeTerms = {
      interview: 'interview entrevista',
      stream: 'stream gameplay',
      analysis: 'analysis breakdown guide',
    };

    const searchTerms = [
      playerName,
      'esports',
      contentTypeTerms[contentType],
    ].join(' ');

    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: searchTerms,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'date',
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return { videos: [], totalResults: 0 };
    }

    const data = await response.json();

    const videos: YouTubeVideo[] = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url,
      thumbnailHigh: item.snippet.thumbnails.high?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return {
      videos,
      totalResults: data.pageInfo?.totalResults || videos.length,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Error searching player content:', error);
    return { videos: [], totalResults: 0 };
  }
}

// Get a specific video by ID
export async function getVideoById(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url,
      thumbnailHigh: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: formatDuration(item.contentDetails?.duration || ''),
      viewCount: parseInt(item.statistics?.viewCount || '0'),
      likeCount: parseInt(item.statistics?.likeCount || '0'),
    };
  } catch (error) {
    console.error('Error fetching video:', error);
    return null;
  }
}

// Convert YouTube videos to MediaItem format
export function convertYouTubeToMediaItems(videos: YouTubeVideo[], isHighlight: boolean = false) {
  return videos.map(video => ({
    id: `yt-${video.id}`,
    type: isHighlight ? 'highlight' as const : 'video' as const,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnail: video.thumbnailHigh || video.thumbnail,
    title: video.title,
    description: video.description?.substring(0, 200),
    date: video.publishedAt,
    source: 'youtube' as const,
    duration: video.duration,
    views: video.viewCount,
  }));
}
