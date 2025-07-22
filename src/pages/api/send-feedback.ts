import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, feedback } = req.body;
  if (!email || !feedback) {
    return res.status(400).json({ error: 'Email and feedback are required.' });
  }

  try {
    await resend.emails.send({
      from: 'MoneySimp Feedback <noreply@resend.dev>',
      to: 'sss9869@nyu.edu',
      subject: `MoneySimp Feedback from ${name || 'Anonymous'}`,
      text: `Name: ${name || 'Anonymous'}\nEmail: ${email}\n\nFeedback:\n${feedback}`,
      replyTo: email,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send feedback.' });
  }
}
