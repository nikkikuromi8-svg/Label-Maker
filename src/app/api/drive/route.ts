import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedClient, getAuthUrl } from '@/lib/googleAuth';
import { google } from 'googleapis';

const FOLDER_ID = '1bhyh-SMqsf4XQUqKvMZgAZX62JnCRqdO';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const fileId = searchParams.get('fileId');

    const auth = getAuthorizedClient();

    if (!auth || searchParams.get('reauth')) {
      return NextResponse.json({ authUrl: getAuthUrl() });
    }
    const mimeType = searchParams.get('mimeType');

    const drive = google.drive({ version: 'v3', auth });

    if (fileId) {
      if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        const response = await drive.files.export(
          { fileId, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { responseType: 'arraybuffer' }
        );
        const buffer = Buffer.from(response.data as ArrayBuffer);
        return new NextResponse(buffer, {
          headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        });
      }

      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      const buffer = Buffer.from(response.data as ArrayBuffer);
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      });
    }

    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and (mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.spreadsheet') and trashed=false`,
      fields: 'files(id, name, modifiedTime, mimeType)',
      orderBy: 'modifiedTime desc',
    });

    return NextResponse.json({ files: res.data.files });

  } catch (err: any) {
    console.error('[Drive API Error]', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error', code: err?.code, status: err?.status },
      { status: 500 }
    );
  }
}
