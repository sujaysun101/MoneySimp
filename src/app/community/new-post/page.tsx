// src/app/community/new-post/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Lightbulb,
  DollarSign,
  Target,
  CreditCard,
  TrendingUp,
  Home,
  Plane,
  GraduationCap,
  Heart,
  Briefcase,
  MessageSquare,
  AlertCircle,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import ForumUtils from '@/lib/forumUtils';
import type { ForumCategory, DealInfo } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const categoryConfig = {
  saving_tips: { label: 'Saving Tips', icon: Lightbulb, color: 'bg-green-100 text-green-800', description: 'Share money-saving strategies and tips' },
  deals: { label: 'Deals & Offers', icon: DollarSign, color: 'bg-blue-100 text-blue-800', description: 'Post great deals and limited-time offers' },
  budgeting: { label: 'Budgeting', icon: Target, color: 'bg-purple-100 text-purple-800', description: 'Budgeting strategies and tools' },
  debt_management: { label: 'Debt Management', icon: CreditCard, color: 'bg-red-100 text-red-800', description: 'Tips for managing and reducing debt' },
  investing: { label: 'Investing', icon: TrendingUp, color: 'bg-orange-100 text-orange-800', description: 'Investment advice and strategies' },
  real_estate: { label: 'Real Estate', icon: Home, color: 'bg-indigo-100 text-indigo-800', description: 'Real estate and property discussions' },
  travel_finance: { label: 'Travel Finance', icon: Plane, color: 'bg-sky-100 text-sky-800', description: 'Travel budgeting and financial tips' },
  student_finance: { label: 'Student Finance', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-800', description: 'Student loans, grants, and education finance' },
  insurance: { label: 'Insurance', icon: Heart, color: 'bg-pink-100 text-pink-800', description: 'Insurance advice and comparisons' },
  career_finance: { label: 'Career & Finance', icon: Briefcase, color: 'bg-yellow-100 text-yellow-800', description: 'Career development and salary negotiations' },
  general: { label: 'General Discussion', icon: MessageSquare, color: 'bg-gray-100 text-gray-800', description: 'General financial discussions' }
};

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: (searchParams?.get('category') as ForumCategory) || 'general',
    tags: [] as string[],
    isDeal: false,
    dealInfo: {
      originalPrice: '',
      discountedPrice: '',
      discountPercentage: 0,
      expiryDate: '',
      dealUrl: '',
      couponCode: ''
    } as DealInfo
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/community/new-post');
    }
  }, [user, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDealInfoChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dealInfo: {
        ...prev.dealInfo,
        [field]: value
      }
    }));

    // Calculate discount percentage if prices are provided
    if (field === 'originalPrice' || field === 'discountedPrice') {
      const original = field === 'originalPrice' ? parseFloat(value) : parseFloat(formData.dealInfo.originalPrice);
      const discounted = field === 'discountedPrice' ? parseFloat(value) : parseFloat(formData.dealInfo.discountedPrice);
      
      if (original && discounted && original > discounted) {
        const percentage = Math.round(((original - discounted) / original) * 100);
        setFormData(prev => ({
          ...prev,
          dealInfo: {
            ...prev.dealInfo,
            discountPercentage: percentage
          }
        }));
      }
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }

    if (formData.isDeal) {
      if (!formData.dealInfo.originalPrice) {
        newErrors.originalPrice = 'Original price is required for deals';
      }
      if (!formData.dealInfo.discountedPrice) {
        newErrors.discountedPrice = 'Discounted price is required for deals';
      }
      if (formData.dealInfo.originalPrice && formData.dealInfo.discountedPrice) {
        const original = parseFloat(formData.dealInfo.originalPrice);
        const discounted = parseFloat(formData.dealInfo.discountedPrice);
        if (discounted >= original) {
          newErrors.discountedPrice = 'Discounted price must be less than original price';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;

    setLoading(true);
    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        dealInfo: formData.isDeal ? formData.dealInfo : undefined,
        isPinned: false,
        authorId: user.uid,
        isFeatured: false,
        isVerified: false
      };

      const postId = await ForumUtils.createPost(user.uid, postData);
      
      toast({
        title: "Post created successfully!",
        description: "Your post has been shared with the community.",
      });

      router.push(`/community/post/${postId}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">You need to sign in to create a post.</p>
            <Link href="/login?redirect=/community/new-post">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCategory = categoryConfig[formData.category as keyof typeof categoryConfig];
  const SelectedIcon = selectedCategory.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/community">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
        <p className="text-gray-600">Share your financial wisdom with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <Card>
          <CardHeader>
            <Label className="text-base font-semibold">Category</Label>
          </CardHeader>
          <CardContent>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value as ForumCategory)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <SelectedIcon className="h-4 w-4" />
                    {selectedCategory.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-gray-500">{config.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-2">{selectedCategory.description}</p>
          </CardContent>
        </Card>

        {/* Deal Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">This is a deal or offer</Label>
                <p className="text-sm text-gray-600">Enable deal-specific fields</p>
              </div>
              <Switch
                checked={formData.isDeal}
                onCheckedChange={(checked) => handleInputChange('isDeal', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Title */}
        <Card>
          <CardHeader>
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
          </CardHeader>
          <CardContent>
            <Input
              id="title"
              placeholder="Write a clear, descriptive title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              {formData.title.length}/100 characters
            </p>
          </CardContent>
        </Card>

        {/* Deal Information */}
        {formData.isDeal && (
          <Card>
            <CardHeader>
              <Label className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Deal Information
              </Label>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="originalPrice">Original Price ($) <span className="text-red-500">*</span></Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    value={formData.dealInfo.originalPrice}
                    onChange={(e) => handleDealInfoChange('originalPrice', e.target.value)}
                    className={errors.originalPrice ? 'border-red-500' : ''}
                  />
                  {errors.originalPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="discountedPrice">Sale Price ($) <span className="text-red-500">*</span></Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    step="0.01"
                    placeholder="79.99"
                    value={formData.dealInfo.discountedPrice}
                    onChange={(e) => handleDealInfoChange('discountedPrice', e.target.value)}
                    className={errors.discountedPrice ? 'border-red-500' : ''}
                  />
                  {errors.discountedPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.discountedPrice}</p>
                  )}
                </div>
              </div>

              {formData.dealInfo.discountPercentage > 0 && (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                    {formData.dealInfo.discountPercentage}% OFF
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dealUrl">Deal URL</Label>
                  <Input
                    id="dealUrl"
                    type="url"
                    placeholder="https://example.com/deal"
                    value={formData.dealInfo.dealUrl}
                    onChange={(e) => handleDealInfoChange('dealUrl', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="couponCode">Coupon Code</Label>
                  <Input
                    id="couponCode"
                    placeholder="SAVE20"
                    value={formData.dealInfo.couponCode}
                    onChange={(e) => handleDealInfoChange('couponCode', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expiryDate">Deal Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.dealInfo.expiryDate}
                  onChange={(e) => handleDealInfoChange('expiryDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card>
          <CardHeader>
            <Label htmlFor="content" className="text-base font-semibold">
              Content <span className="text-red-500">*</span>
            </Label>
          </CardHeader>
          <CardContent>
            <Textarea
              id="content"
              placeholder="Share your financial tip, deal details, or start a discussion..."
              rows={8}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              {formData.content.length}/2000 characters
            </p>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <Label className="text-base font-semibold">Tags</Label>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a tag (e.g., budget, savings, credit)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} disabled={formData.tags.length >= 5}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                      title={`Remove tag: ${tag}`}
                      aria-label={`Remove tag: ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-600">
              Add up to 5 tags to help others find your post ({formData.tags.length}/5)
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creating Post...' : 'Create Post'}
          </Button>
          <Link href="/community">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
