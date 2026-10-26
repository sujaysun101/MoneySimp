// src/app/community/post/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Eye,
  Clock,
  Users,
  Star,
  ExternalLink,
  Copy,
  Calendar,
  DollarSign,
  AlertCircle,
  Heart,
  Share2,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import ForumUtils from '@/lib/forumUtils';
import type { ForumPost, ForumComment } from '@/lib/types';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const categoryConfig = {
  saving_tips: { label: 'Saving Tips', color: 'bg-green-100 text-green-800' },
  deals: { label: 'Deals & Offers', color: 'bg-blue-100 text-blue-800' },
  budgeting: { label: 'Budgeting', color: 'bg-purple-100 text-purple-800' },
  debt_management: { label: 'Debt Management', color: 'bg-red-100 text-red-800' },
  investing: { label: 'Investing', color: 'bg-orange-100 text-orange-800' },
  real_estate: { label: 'Real Estate', color: 'bg-indigo-100 text-indigo-800' },
  travel_finance: { label: 'Travel Finance', color: 'bg-sky-100 text-sky-800' },
  student_finance: { label: 'Student Finance', color: 'bg-emerald-100 text-emerald-800' },
  insurance: { label: 'Insurance', color: 'bg-pink-100 text-pink-800' },
  career_finance: { label: 'Career & Finance', color: 'bg-yellow-100 text-yellow-800' },
  general: { label: 'General Discussion', color: 'bg-gray-100 text-gray-800' }
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const postId = params?.id as string;

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote' | null>>({});

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
      if (user) {
        loadUserVotes();
      }
    }
  }, [postId, user]);

  const loadPost = async () => {
    try {
      const postData = await ForumUtils.getPost(postId);
      if (postData) {
        setPost(postData);
      } else {
        router.push('/community');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      router.push('/community');
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await ForumUtils.getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotes = async () => {
    if (!user || !post) return;

    try {
      const votes: Record<string, 'upvote' | 'downvote' | null> = {};
      
      // Load post vote
      votes[postId] = await ForumUtils.getUserVote(user.uid, postId, 'post');
      
      // Load comment votes
      for (const comment of comments) {
        votes[comment.id] = await ForumUtils.getUserVote(user.uid, comment.id, 'comment');
        
        // Load reply votes
        for (const reply of comment.replies) {
          votes[reply.id] = await ForumUtils.getUserVote(user.uid, reply.id, 'comment');
        }
      }
      
      setUserVotes(votes);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const handleVote = async (targetId: string, targetType: 'post' | 'comment', voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to vote.",
        variant: "destructive"
      });
      return;
    }

    try {
      await ForumUtils.vote(user.uid, targetId, targetType, voteType);
      
      // Update local state
      if (targetType === 'post' && post) {
        const currentVote = userVotes[targetId];
        let upvoteChange = 0;
        let downvoteChange = 0;

        if (currentVote === voteType) {
          // Removing vote
          if (voteType === 'upvote') upvoteChange = -1;
          else downvoteChange = -1;
          setUserVotes(prev => ({ ...prev, [targetId]: null }));
        } else {
          // Adding or changing vote
          if (currentVote) {
            // Changing vote
            if (voteType === 'upvote') {
              upvoteChange = 1;
              downvoteChange = -1;
            } else {
              upvoteChange = -1;
              downvoteChange = 1;
            }
          } else {
            // Adding new vote
            if (voteType === 'upvote') upvoteChange = 1;
            else downvoteChange = 1;
          }
          setUserVotes(prev => ({ ...prev, [targetId]: voteType }));
        }

        setPost(prev => prev ? {
          ...prev,
          upvotes: prev.upvotes + upvoteChange,
          downvotes: prev.downvotes + downvoteChange,
          netScore: prev.netScore + (upvoteChange - downvoteChange)
        } : null);
      }

      // For comments, reload the comments to get updated scores
      await loadComments();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error voting",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    setCommentLoading(true);
    try {
      await ForumUtils.addComment(postId, user.uid, newComment.trim());
      setNewComment('');
      await loadComments();
      
      // Update post comment count
      if (post) {
        setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
      }

      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error adding comment",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReply = async (parentCommentId: string) => {
    if (!user || !replyContent.trim()) return;

    try {
      await ForumUtils.addComment(postId, user.uid, replyContent.trim(), parentCommentId);
      setReplyContent('');
      setReplyingTo(null);
      await loadComments();

      toast({
        title: "Reply added",
        description: "Your reply has been posted.",
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: "Error adding reply",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied.",
    });
  };

  const sharePost = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content,
          url: url,
        });
      } catch (error) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-4">The post you're looking for doesn't exist or has been removed.</p>
            <Link href="/community">
              <Button>Back to Community</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = categoryConfig[post.category as keyof typeof categoryConfig];
  const currentUserVote = userVotes[postId];

  const CommentComponent = ({ comment, isReply = false }: { comment: ForumComment; isReply?: boolean }) => {
    const commentVote = userVotes[comment.id];

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              {/* Voting */}
              <div className="flex flex-col items-center space-y-1 min-w-[40px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(comment.id, 'comment', 'upvote')}
                  className={`h-6 w-6 p-0 ${
                    commentVote === 'upvote' ? 'bg-green-100 text-green-600' : 'hover:bg-green-100'
                  }`}
                  disabled={!user}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <span className={`font-semibold text-xs ${
                  comment.netScore > 0 ? 'text-green-600' : 
                  comment.netScore < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comment.netScore}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(comment.id, 'comment', 'downvote')}
                  className={`h-6 w-6 p-0 ${
                    commentVote === 'downvote' ? 'bg-red-100 text-red-600' : 'hover:bg-red-100'
                  }`}
                  disabled={!user}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Comment Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <span className="font-medium">{comment.author?.displayName || 'Anonymous'}</span>
                  {comment.author?.reputation && comment.author.reputation > 100 && (
                    <Badge variant="outline" className="text-xs">
                      {comment.author.reputation} rep
                    </Badge>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.isEdited && (
                    <>
                      <span>•</span>
                      <span className="text-xs text-gray-500">edited</span>
                    </>
                  )}
                </div>

                <p className="text-gray-800 mb-3">{comment.content}</p>

                <div className="flex items-center gap-4 text-sm">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      disabled={!user}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => copyToClipboard(comment.content)}>
                        <Copy className="h-3 w-3 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Flag className="h-3 w-3 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim()}
                      >
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => (
              <CommentComponent key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/community">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>
      </Link>

      {/* Post */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Voting Section */}
            <div className="flex flex-col items-center space-y-2 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(postId, 'post', 'upvote')}
                className={`h-10 w-10 p-0 ${
                  currentUserVote === 'upvote' ? 'bg-green-100 text-green-600' : 'hover:bg-green-100'
                }`}
                disabled={!user}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <span className={`font-bold text-lg ${
                post.netScore > 0 ? 'text-green-600' : 
                post.netScore < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {post.netScore}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(postId, 'post', 'downvote')}
                className={`h-10 w-10 p-0 ${
                  currentUserVote === 'downvote' ? 'bg-red-100 text-red-600' : 'hover:bg-red-100'
                }`}
                disabled={!user}
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
            </div>

            {/* Post Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={categoryInfo.color}>
                  {categoryInfo.label}
                </Badge>
                {post.isPinned && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {post.dealInfo && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    💰 Deal
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

              {/* Deal Information */}
              {post.dealInfo && (
                <Card className="mb-6 bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Deal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Original Price</p>
                        <p className="font-semibold text-lg line-through text-red-600">
                          ${post.dealInfo.originalPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sale Price</p>
                        <p className="font-semibold text-lg text-green-600">
                          ${post.dealInfo.discountedPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Discount</p>
                        <p className="font-semibold text-lg text-green-600">
                          {post.dealInfo.discountPercentage}% OFF
                        </p>
                      </div>
                      {post.dealInfo.expiryDate && (
                        <div>
                          <p className="text-sm text-gray-600">Expires</p>
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.dealInfo.expiryDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {post.dealInfo.dealUrl && (
                        <a
                          href={post.dealInfo.dealUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Deal
                          </Button>
                        </a>
                      )}
                      {post.dealInfo.couponCode && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => post.dealInfo?.couponCode && copyToClipboard(post.dealInfo.couponCode)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Code: {post.dealInfo.couponCode}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="prose max-w-none mb-6">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
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
                  {post.isEdited && (
                    <span className="text-xs text-gray-500">edited</span>
                  )}
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

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={sharePost}>
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => copyToClipboard(post.content)}>
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Content
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Flag className="h-3 w-3 mr-2" />
                      Report Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </h2>

        {/* Add Comment */}
        {user ? (
          <Card>
            <CardContent className="p-4">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="mb-4"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {newComment.length}/1000 characters
                </p>
                <Button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-gray-600 mb-4">Sign in to join the discussion</p>
              <Link href={`/login?redirect=/community/post/${postId}`}>
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
              <p className="text-gray-600">Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {comments.map((comment) => (
              <CommentComponent key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
