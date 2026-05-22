import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/google';
import { verifyAuth } from '@/lib/auth';
import { getCache, setCache } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

    // Since we fetch all rows at once, we cache them all, and then filter by ID.
    // This minimizes Google Sheets API calls if users visit multiple lessons.
    const lesson = lessons?.find((l: any) => l.id === id || String(l.id) === String(id));

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Lessons error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
