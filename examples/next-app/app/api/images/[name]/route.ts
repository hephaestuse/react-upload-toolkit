import { serveImage } from '../../../../lib/storage';
export const runtime = 'nodejs';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  return serveImage((await params).name);
}
