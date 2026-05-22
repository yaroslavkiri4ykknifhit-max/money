import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/google';
import { verifyAuth } from '@/lib/auth';
import { getCache, setCache } from '@/lib/cache';

export async function GET() {
  const user = await verifyAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cacheKey = `lessons_all`;
    let lessons = getCache<any[]>(cacheKey);

    if (!lessons) {
      const doc = await getDoc();
      const sheet = doc.sheetsByTitle['Lessons'];
      
      if (!sheet) {
        return NextResponse.json({ error: 'Lessons sheet not found' }, { status: 500 });
      }

      const rows = await sheet.getRows();
      lessons = rows.map(row => ({
        id: row.get('ID'),
        moduleId: row.get('ID модуля'),
        title: row.get('название'),
        content: row.get('текст контента'),
        videoUrl: row.get('ссылка на видео'),
      }));

      setCache(cacheKey, lessons);
    }

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Lessons error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
