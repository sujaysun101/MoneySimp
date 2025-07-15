import { NextApiRequest, NextApiResponse } from 'next';
import { SpeechClient, protos } from '@google-cloud/speech';
import multer from 'multer';

const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await runMiddleware(req, res, upload.single('audio'));
  const audioFile = (req as any).file;
  if (!audioFile) return res.status(400).json({ error: 'Audio file required' });

  const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
    audio: { content: audioFile.buffer.toString('base64') },
    config: {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    },
  };

  const [response] = await speechClient.recognize(request);
  const transcription = response.results?.map(r => r.alternatives?.[0]?.transcript).join('\n');
  res.status(200).json({ text: transcription || '' });
}

export const config = { api: { bodyParser: false } };
