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
    const cachedModules = getCache('modules');
    if (cachedModules) {
      return NextResponse.json({ modules: cachedModules });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Modules'];
    
    if (!sheet) {
      return NextResponse.json({ error: 'Modules sheet not found' }, { status: 500 });
    }

    const rows = await sheet.getRows();
    const modules = rows.map(row => ({
      id: row.get('ID'),
      title: row.get('название модуля'),
      status: row.get('статус')
    }));

    setCache('modules', modules);

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Modules error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
