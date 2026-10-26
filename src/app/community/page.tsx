// src/app/community/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock,
  Trophy,
  Users,
  Lightbulb,
  DollarSign,
  Target,
  CreditCard,
  Home,
  Plane,
  GraduationCap,
  Heart,
  Briefcase,
  Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ForumUtils from '@/lib/forumUtils';
import type { ForumPost, ForumCategory } from '@/lib/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const categoryConfig = {
  saving_tips: { label: 'Saving Tips', icon: Lightbulb, color: 'bg-green-100 text-green-800' },
  deals: { label: 'Deals & Offers', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
  budgeting: { label: 'Budgeting', icon: Target, color: 'bg-purple-100 text-purple-800' },
  debt_management: { label: 'Debt Management', icon: CreditCard, color: 'bg-red-100 text-red-800' },
  investing: { label: 'Investing', icon: TrendingUp, color: 'bg-orange-100 text-orange-800' },
  real_estate: { label: 'Real Estate', icon: Home, color: 'bg-indigo-100 text-indigo-800' },
  travel_finance: { label: 'Travel Finance', icon: Plane, color: 'bg-sky-100 text-sky-800' },
  student_finance: { label: 'Student Finance', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-800' },
  insurance: { label: 'Insurance', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  career_finance: { label: 'Career & Finance', icon: Briefcase, color: 'bg-yellow-100 text-yellow-800' },
  general: { label: 'General Discussion', icon: MessageSquare, color: 'bg-gray-100 text-gray-800' }
};

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'controversial'>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPosts();
    loadTrendingPosts();
  }, [activeTab, selectedCategory, sortBy]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      let postsData: ForumPost[] = [];

      if (searchTerm) {
        postsData = await ForumUtils.searchPosts(
          searchTerm,
          selectedCategory === 'all' ? undefined : selectedCategory as ForumCategory
        );
      } else {
        postsData = await ForumUtils.getPosts(
          selectedCategory === 'all' ? undefined : selectedCategory as ForumCategory,
          sortBy,
          20
        );
      }

      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingPosts = async () => {
    try {
      const trending = await ForumUtils.getTrendingPosts('week');
      setTrendingPosts(trending);
    } catch (error) {
      console.error('Error loading trending posts:', error);
    }
  };

  const handleSearch = async () => {
    await loadPosts();
  };

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) return;
    
    try {
      await ForumUtils.vote(user.uid, postId, 'post', voteType);
      // Reload posts to reflect updated vote counts
      await loadPosts();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const PostCard = ({ post }: { post: ForumPost }) => {
    const categoryInfo = categoryConfig[post.category as keyof typeof categoryConfig];
    const CategoryIcon = categoryInfo.icon;

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Voting Section */}
            <div className="flex flex-col items-center space-y-1 min-w-[50px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(post.id, 'upvote')}
                className="h-8 w-8 p-0 hover:bg-green-100"
                disabled={!user}
              >
                <ArrowUp className="h-4 w-4 text-green-600" />
              </Button>
              <span className={`font-semibold text-sm ${
                post.netScore > 0 ? 'text-green-600' : 
                post.netScore < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {post.netScore}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(post.id, 'downvote')}
                className="h-8 w-8 p-0 hover:bg-red-100"
                disabled={!user}
              >
                <ArrowDown className="h-4 w-4 text-red-600" />
              </Button>
            </div>

            {/* Post Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={categoryInfo.color}>
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {categoryInfo.label}
                </Badge>
                {post.isPinned && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {/* Show a "Deal" badge for posts in the "deals" category */}
                {post.category === 'deals' && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    💰 Deal
                  </Badge>
                )}
              </div>

              <Link href={`/community/post/${post.id}`}>
                <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer">
                  {post.title}
                </h3>
              </Link>

              <p className="text-gray-600 mb-3 line-clamp-2">
                {post.content}
              </p>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {post.author?.displayName || 'Anonymous'}
                    {post.author?.reputation && post.author.reputation > 100 && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {post.author.reputation} rep
                      </Badge>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.commentCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.viewCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TrendingCard = ({ post }: { post: ForumPost }) => {
    const categoryInfo = categoryConfig[post.category as keyof typeof categoryConfig];
    const CategoryIcon = categoryInfo.icon;

    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
              <Trophy className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <Link href={`/community/post/${post.id}`}>
                <h4 className="font-medium text-sm mb-1 hover:text-blue-600 cursor-pointer line-clamp-2">
                  {post.title}
                </h4>
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Badge className={`${categoryInfo.color} text-xs`}>
                  <CategoryIcon className="h-2 w-2 mr-1" />
                  {categoryInfo.label}
                </Badge>
                <span>+{post.netScore}</span>
                <span>{post.commentCount} comments</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
              <p className="text-gray-600">Share financial tips, discover deals, and learn from the community</p>
            </div>
            <Link href="/community/new-post">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search posts, tips, deals..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ForumCategory | 'all')}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} variant="outline">
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="latest" 
                onClick={() => setSortBy('newest')}
              >
                Latest
              </TabsTrigger>
              <TabsTrigger 
                value="popular" 
                onClick={() => setSortBy('popular')}
              >
                Popular
              </TabsTrigger>
              <TabsTrigger 
                value="controversial" 
                onClick={() => setSortBy('controversial')}
              >
                Controversial
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-20 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm 
                        ? `No posts match your search for "${searchTerm}"`
                        : 'Be the first to start a discussion in this category!'
                      }
                    </p>
                    <Link href="/community/new-post">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Post
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Trending Posts */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Trending This Week
              </h3>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {trendingPosts.length === 0 ? (
                <p className="text-sm text-gray-600">No trending posts yet</p>
              ) : (
                <div>
                  {trendingPosts.slice(0, 5).map((post) => (
                    <TrendingCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Categories</h3>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCategory(key as ForumCategory);
                        setActiveTab('latest');
                        setSortBy('newest');
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                        selectedCategory === key ? 'bg-blue-50 border-blue-200 border' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Community Stats</h3>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Posts</span>
                  <span className="font-semibold">{posts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tips Shared</span>
                  <span className="font-semibold">567</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Deals Posted</span>
                  <span className="font-semibold">89</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                <Link href="/community/new-post?category=saving_tips">
                  <Button variant="outline" className="w-full justify-start">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Share a Tip
                  </Button>
                </Link>
                <Link href="/community/new-post?category=deals">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Post a Deal
                  </Button>
                </Link>
                <Link href="/community/leaderboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
