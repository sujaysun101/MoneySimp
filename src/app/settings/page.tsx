"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectItem, SelectContent } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/components/SettingsContext';
import { FeedbackForm } from '@/components/shared/FeedbackForm';

const getDefaultTheme = () => {
	const hour = new Date().getHours();
	if (hour >= 9 && hour < 16) return 'light';
	return 'dark';
};

// Define available languages
const ALL_LANGUAGES = [
	{ code: 'en', label: 'English' },
	{ code: 'es', label: 'Spanish' },
	{ code: 'fr', label: 'French' },
	// Add more languages as needed
];

export default function SettingsPage() {
	const { settings, updateSetting } = useSettings();
	const theme = settings.theme;
	const language = settings.language;
	const router = useRouter();
	const [feedbackOpen, setFeedbackOpen] = React.useState(false);

	useEffect(() => {
		let appliedTheme = theme;
		if (theme === 'default') {
			appliedTheme = getDefaultTheme();
		}
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(appliedTheme);
	}, [theme]);

	return (
		<div className="max-w-xl mx-auto py-10 px-4">
			<h1 className="text-2xl font-bold mb-6">Settings</h1>
			<div className="mb-8">
				<h2 className="text-lg font-semibold mb-2">Theme</h2>
				<div className="flex gap-4">
					<Button
						variant={theme === 'light' ? 'default' : 'outline'}
						onClick={() => updateSetting('theme', 'light')}
					>
						Light
					</Button>
					<Button
						variant={theme === 'dark' ? 'default' : 'outline'}
						onClick={() => updateSetting('theme', 'dark')}
					>
						Dark
					</Button>
					<Button
						variant={theme === 'default' ? 'default' : 'outline'}
						onClick={() => updateSetting('theme', 'default')}
					>
						Default (Time-based)
					</Button>
				</div>
				<p className="text-sm text-muted-foreground mt-2">
					Default: Light mode from 9 AM to 4 PM, Dark mode otherwise.
				</p>
			</div>
			<div>
				<h2 className="text-lg font-semibold mb-2">Language</h2>
				<Select value={language} onValueChange={val => updateSetting('language', val)}>
					<SelectContent>
						{ALL_LANGUAGES.map((lang: { code: string; label: string }) => (
							<SelectItem key={lang.code} value={lang.code}>
								{lang.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-sm text-muted-foreground mt-2">
					The website will update to your selected language.
				</p>
			</div>
			<div className="mt-10">
				<h2 className="text-lg font-semibold mb-2">Feedback</h2>
				<Button onClick={() => setFeedbackOpen(true)} variant="outline">
					Send Feedback
				</Button>
				<FeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
				<div className="mt-6 p-4 bg-muted rounded">
					<h3 className="text-base font-bold mb-2">V 0.1.0</h3>
					<ul className="list-disc pl-6 text-sm text-muted-foreground">
						<li>Connect and manage all your financial accounts in one place</li>
						<li>Track your spending and set financial goals with smart insights</li>
						<li>Get personalized AI-powered tips to improve your finances</li>
						<li>Receive reminders for upcoming subscriptions and payments</li>
						<li>Customize your experience with theme and language settings</li>
						<li>Share feedback to help us improve MoneySimp</li>
						<li>Enjoy a modern, easy-to-use dashboard and navigation</li>
						<li>Chatbot assistant for instant help and financial guidance</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
