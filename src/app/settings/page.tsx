"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectItem, SelectContent } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/components/SettingsContext';

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
		</div>
	);
}
