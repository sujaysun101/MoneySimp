import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const storage = new Storage({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!);

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

  await runMiddleware(req, res, upload.single('file'));
  const file = (req as any).file;
  const userId = (req as any).body.userId;

  if (!file || !userId) return res.status(400).json({ error: 'File and userId required' });

  const ext = file.originalname.split('.').pop();
  const fileName = `${userId}/${uuidv4()}.${ext}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });
  stream.on('error', () => res.status(500).json({ error: 'Upload failed' }));
  stream.on('finish', async () => {
    await fileUpload.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.status(200).json({ url });
  });
  stream.end(file.buffer);
}

export const config = { api: { bodyParser: false } };
