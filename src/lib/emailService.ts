// src/lib/emailService.ts
"use client";

import type { MonthlySummary, ForumUser } from './types';

export class EmailService {
  static async sendMonthlySummary(user: ForumUser, summary: MonthlySummary): Promise<void> {
    // In a real implementation, this would integrate with a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    
    const emailContent = this.generateMonthlySummaryEmail(user, summary);
    
    // For now, we'll just log the email content
    console.log('Monthly Summary Email for:', user.displayName);
    console.log('Email Content:', emailContent);
    
    // Mock sending email
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Monthly summary email sent successfully');
        resolve();
      }, 1000);
    });
  }

  private static generateMonthlySummaryEmail(user: ForumUser, summary: MonthlySummary): string {
    const monthName = new Date(summary.year, parseInt(summary.month) - 1, 1).toLocaleString('default', { month: 'long' });
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your ${monthName} ${summary.year} Community Summary</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e5e7eb;
        }
        .header h1 {
            color: #1f2937;
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            color: #6b7280;
            margin: 0;
            font-size: 16px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 24px 0;
        }
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 4px;
        }
        .stat-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
        }
        .top-post {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .top-post h3 {
            color: #92400e;
            margin: 0 0 12px 0;
            font-size: 18px;
        }
        .top-post-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .achievements {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .achievements h3 {
            color: #0c4a6e;
            margin: 0 0 12px 0;
            font-size: 18px;
        }
        .achievement-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            margin: 4px 4px 4px 0;
        }
        .community-impact {
            background: #f0fdf4;
            border: 1px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .community-impact h3 {
            color: #15803d;
            margin: 0 0 12px 0;
            font-size: 18px;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 16px 0;
        }
        .unsubscribe {
            margin-top: 16px;
            font-size: 12px;
        }
        .unsubscribe a {
            color: #6b7280;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your ${monthName} ${summary.year} Community Summary</h1>
            <p>Hello ${user.displayName}, here's how you contributed to the MoneySimp community!</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${summary.totalPosts}</div>
                <div class="stat-label">Posts Shared</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.totalComments}</div>
                <div class="stat-label">Comments Made</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.totalUpvotesReceived}</div>
                <div class="stat-label">Upvotes Received</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">+${summary.reputationGained}</div>
                <div class="stat-label">Reputation Gained</div>
            </div>
        </div>

        ${summary.topPost ? `
        <div class="top-post">
            <h3>🏆 Your Top Post This Month</h3>
            <div class="top-post-title">"${summary.topPost.title}"</div>
            <p><strong>${summary.topPost.netScore}</strong> net upvotes • <strong>${summary.topPost.commentCount}</strong> comments</p>
        </div>
        ` : ''}

        ${summary.newAchievements.length > 0 ? `
        <div class="achievements">
            <h3>🎉 New Achievements Unlocked</h3>
            ${summary.newAchievements.map(achievement => `
                <span class="achievement-badge">${achievement}</span>
            `).join('')}
        </div>
        ` : ''}

        <div class="community-impact">
            <h3>💡 Your Community Impact</h3>
            <ul style="margin: 12px 0; padding-left: 20px;">
                <li><strong>${summary.savingsTipsShared}</strong> saving tips shared</li>
                <li><strong>${summary.dealsShared}</strong> deals posted</li>
                <li>Helped fellow community members save money and improve their finances</li>
                ${summary.communityRank > 0 ? `<li>You're ranked <strong>#${summary.communityRank}</strong> out of ${summary.totalCommunityMembers} active members</li>` : ''}
            </ul>
        </div>

        <div style="text-align: center;">
            <a href="https://moneysimp.com/community" class="cta-button">
                Continue Contributing to the Community
            </a>
        </div>

        <div class="footer">
            <p>Keep up the great work! Your contributions help thousands of people improve their financial lives.</p>
            <p>Thank you for being part of the MoneySimp community! 🚀</p>
            
            <div class="unsubscribe">
                <p>
                    Don't want to receive these monthly summaries? 
                    <a href="https://moneysimp.com/community/settings">Update your notification preferences</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Push notification service (would integrate with Firebase Cloud Messaging, OneSignal, etc.)
  static async sendPushNotification(
    userId: string, 
    title: string, 
    body: string, 
    actionUrl?: string
  ): Promise<void> {
    // Mock implementation
    console.log('Push Notification:', { userId, title, body, actionUrl });
    
    // In production, this would:
    // 1. Get user's device tokens from database
    // 2. Send push notification via FCM/OneSignal/etc.
    // 3. Handle delivery tracking and analytics
    
    return Promise.resolve();
  }

  // Generate weekly digest email
  static async sendWeeklyDigest(user: ForumUser, weeklyStats: any): Promise<void> {
    const emailContent = this.generateWeeklyDigestEmail(user, weeklyStats);
    console.log('Weekly Digest Email for:', user.displayName);
    console.log('Email Content:', emailContent);
    return Promise.resolve();
  }

  private static generateWeeklyDigestEmail(user: ForumUser, stats: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Your Weekly Community Digest</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #f9fafb; margin: 20px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Weekly Community Digest</h1>
        <p>Hello ${user.displayName}! Here's what happened in the community this week.</p>
    </div>
    
    <div class="content">
        <h2>🔥 Trending Topics</h2>
        <p>Saving tips and deals were the most popular topics this week!</p>
        
        <h2>💬 Your Activity</h2>
        <p>You contributed with ${stats.posts || 0} posts and ${stats.comments || 0} comments.</p>
        
        <h2>🌟 Community Highlights</h2>
        <p>The community shared incredible money-saving tips worth over $10,000 in potential savings!</p>
    </div>
</body>
</html>
    `;
  }
}
