import { CONFIG } from './config';

async function fetchRawSheet(sheetName: string): Promise<{ cols: string[]; rows: any[][] }> {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${sheetName}`);
  }
  const text = await response.text();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}') + 1;
  const jsonString = text.substring(jsonStart, jsonEnd);
  const json = JSON.parse(jsonString);
  
  const cols = json.table.cols.map((c: any) => (c.label || '').trim());
  const rows = json.table.rows.map((r: any) => {
    return r.c.map((cell: any) => cell ? cell.v : null);
  });
  
  return { cols, rows };
}

export async function fetchModules(): Promise<any[]> {
  const { cols, rows } = await fetchRawSheet('Modules');
  return rows.map(row => {
    const id = row[cols.indexOf('ID')] ?? row[0];
    const title = row[cols.indexOf('название модуля')] ?? row[1];
    const status = row[cols.indexOf('статус')] ?? row[2];
    return { id, title, status };
  });
}

export async function fetchLessons(): Promise<any[]> {
  const { cols, rows } = await fetchRawSheet('Lessons');
  return rows.map(row => {
    const id = row[cols.indexOf('ID')] ?? row[0];
    const moduleId = row[cols.indexOf('ID модуля')] ?? row[1];
    const title = row[cols.indexOf('название')] ?? row[2];
    const content = row[cols.indexOf('текст контента')] ?? row[3];
    const videoUrl = row[cols.indexOf('ссылка на видео')] ?? row[4];
    return { id, moduleId, title, content, videoUrl };
  });
}

export async function fetchLessonById(lessonId: string): Promise<any | null> {
  const lessons = await fetchLessons();
  return lessons.find(l => String(l.id) === String(lessonId)) || null;
}

export async function verifyInviteCode(code: string): Promise<boolean> {
  try {
    const { cols, rows } = await fetchRawSheet('Invites');
    const codeIdx = cols.indexOf('code') !== -1 ? cols.indexOf('code') : 0;
    const isUsedIdx = cols.indexOf('is_used') !== -1 ? cols.indexOf('is_used') : 1;
    
    const inviteRow = rows.find(row => row[codeIdx] && String(row[codeIdx]).trim() === String(code).trim());
    if (!inviteRow) return false;
    
    const isUsed = inviteRow[isUsedIdx];
    if (isUsed === 'TRUE' || isUsed === 'true' || isUsed === true) {
      return false; // Code is already used
    }
    return true;
  } catch (error) {
    console.error('Verify invite error:', error);
    return false;
  }
}
