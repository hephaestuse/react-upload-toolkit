import { handleUpload } from '../../../lib/storage';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return handleUpload(request, true);
}
