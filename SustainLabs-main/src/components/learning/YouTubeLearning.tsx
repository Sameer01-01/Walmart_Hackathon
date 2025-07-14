import React, { useState, useEffect, useRef } from 'react';
import { Play, ExternalLink, ThumbsUp, Eye, Calendar, Search, RefreshCw, X, Maximize, Minimize } from 'lucide-react';

// Types for YouTube API responses
interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
}

// API key for YouTube Data API v3
const API_KEY = 'AIzaSyCj_AxKAAYgCeN22OTreUwZsuTy83GKA08';

// Categories/topics for sustainability and educational videos
const TOPICS = [
  'sustainability',
  'renewable energy',
  'climate change',
  'green technology',
  'environmental conservation',
  'sustainable development',
  'carbon footprint',
  'eco-friendly',
  'clean energy',
  'circular economy'
];

const YouTubeLearning: React.FC = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string>('sustainability');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  
  // New state for video player
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  // Function to fetch videos from YouTube API
  const fetchVideos = async (query: string, pageToken: string | null = null) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build the search URL
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${query}+sustainability+education&type=video&key=${API_KEY}`;
      
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      // Fetch videos
      const response = await fetch(url);
      const data: YouTubeSearchResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.items || 'Failed to fetch videos');
      }
      
      // Get video IDs for fetching statistics
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      
      // Fetch video statistics
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${API_KEY}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();
      
      // Merge video details with their statistics
      const videosWithStats = data.items.map(video => {
        const videoStats = statsData.items.find(
          (item: any) => item.id === video.id.videoId
        );
        return {
          ...video,
          statistics: videoStats ? videoStats.statistics : null
        };
      });
      
      setVideos(videosWithStats);
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching YouTube videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount or when active topic changes
  useEffect(() => {
    fetchVideos(activeTopic);
  }, [activeTopic]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format view count with abbreviations (e.g., 1.5M, 320K)
  const formatViewCount = (count: string) => {
    const num = parseInt(count, 10);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Toggle fullscreen mode for the video player
  const toggleFullscreen = () => {
    if (!videoPlayerRef.current) return;
    
    if (!isFullscreen) {
      if (videoPlayerRef.current.requestFullscreen) {
        videoPlayerRef.current.requestFullscreen();
      } else if ((videoPlayerRef.current as any).webkitRequestFullscreen) {
        (videoPlayerRef.current as any).webkitRequestFullscreen();
      } else if ((videoPlayerRef.current as any).msRequestFullscreen) {
        (videoPlayerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Clean up by closing video player when component unmounts
  useEffect(() => {
    return () => {
      setSelectedVideo(null);
    };
  }, []);

  return (
    <div className="bg-base-200 rounded-lg p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Play className="h-5 w-5 text-red-500" />
            Sustainability Learning Videos
          </h2>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative w-full md:w-auto">
            <div className="flex">
              <input
                type="text"
                placeholder="Search sustainability videos..."
                className="input input-bordered w-full md:w-64 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary ml-2"
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>

        {/* Topic filters */}
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              className={`btn btn-sm ${
                activeTopic === topic ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => setActiveTopic(topic)}
              disabled={loading}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center my-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Videos grid */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {videos.map((video) => (
              <div
                key={video.id.videoId}
                className="card bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <figure className="relative">
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="btn btn-primary btn-circle"
                    >
                      <Play className="h-6 w-6" />
                    </button>
                  </div>
                </figure>
                <div className="card-body p-4">
                  <h3 className="card-title text-sm font-semibold line-clamp-2">
                    {video.snippet.title}
                  </h3>
                  <p className="text-xs opacity-80 line-clamp-2">
                    {video.snippet.description}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-xs opacity-70">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(video.snippet.publishedAt)}</span>
                    </div>
                    {video.statistics && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{formatViewCount(video.statistics.viewCount)}</span>
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          <span>{formatViewCount(video.statistics.likeCount || '0')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card-actions justify-end mt-3">
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="btn btn-xs btn-primary w-full"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Watch Video
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No videos message */}
        {!loading && videos.length === 0 && !error && (
          <div className="text-center my-8">
            <p className="text-lg">No videos found. Try a different search term.</p>
          </div>
        )}

        {/* Load more button */}
        {nextPageToken && (
          <div className="flex justify-center mt-6">
            <button
              className="btn btn-outline"
              onClick={() => fetchVideos(activeTopic, nextPageToken)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More Videos'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:p-8">
          <div 
            ref={videoPlayerRef}
            className={`relative bg-black rounded-lg overflow-hidden max-w-5xl w-full ${isFullscreen ? 'h-full' : 'max-h-[80vh]'}`}
          >
            <div className="absolute top-2 right-2 z-10 flex space-x-2">
              <button 
                onClick={toggleFullscreen}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="aspect-video w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1&rel=0`}
                title={selectedVideo.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            
            {!isFullscreen && (
              <div className="p-4 bg-gray-900">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedVideo.snippet.title}
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  {selectedVideo.snippet.description}
                </p>
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <div>
                    {selectedVideo.snippet.channelTitle}
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedVideo.statistics && (
                      <>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{formatViewCount(selectedVideo.statistics.viewCount)}</span>
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span>{formatViewCount(selectedVideo.statistics.likeCount || '0')}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(selectedVideo.snippet.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeLearning; 