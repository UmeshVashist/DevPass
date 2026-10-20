import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getSheetRows,
  appendSheetRow,
  updateSheetRow,
  deleteSheetRow,
} from '@/lib/googleSheets';

function resolveCreatedAt(id, createdAtStr) {
  if (createdAtStr) {
    const t = new Date(createdAtStr).getTime();
    if (!isNaN(t)) return new Date(t).toISOString();
  }
  if (id && id.startsWith('pass_')) {
    const parts = id.split('_');
    if (parts[1] && parts[1].length > 9) {
      const timePart = parts[1].substring(9);
      const t = parseInt(timePart, 36);
      if (!isNaN(t) && t > 1700000000000 && t <= Date.now() + 60000) {
        return new Date(t).toISOString();
      }
    }
  }
  return null;
}

/**
 * GET: Fetch all passwords for the logged-in user.
 * Returns records with newest added first (latest in first position).
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allRows = await getSheetRows();
    if (allRows.length <= 1) {
      return NextResponse.json([]); // Only headers or empty sheet
    }

    // Skip header row (index 0) and filter by userId
    const userPasswords = allRows
      .slice(1)
      .filter((row) => row[0] === userId)
      .map((row) => ({
        userId: row[0],
        id: row[1],
        title: row[2] || '',
        url: row[3] || '',
        username: row[4] || '',
        password: row[5] || '',
        isFavorite: row[6] === 'true',
        createdAt: resolveCreatedAt(row[1], row[7]) || '',
      }));

    // Reverse first so naturally appended sheet rows are in newest-first order
    const reversed = userPasswords.reverse();

    // Sort descending by timestamp so latest added always occupies first position
    reversed.sort((a, b) => {
      // Keep verifier record at the bottom/neutral
      if (a.title === '__MASTER_VERIFIER__') return 1;
      if (b.title === '__MASTER_VERIFIER__') return -1;

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (timeA && timeB) return timeB - timeA;
      if (timeB && !timeA) return 1;
      if (timeA && !timeB) return -1;
      return 0;
    });

    return NextResponse.json(reversed);
  } catch (error) {
    console.error('API GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch passwords' }, { status: 500 });
  }
}

/**
 * POST: Add a new password record.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, url, username, password, isFavorite, createdAt } = body;

    // Validate required fields
    if (!id || !title || !url || !username || !password) {
      return NextResponse.json({ error: 'All fields are mandatory.' }, { status: 400 });
    }

    const timestamp = createdAt || new Date().toISOString();

    const rowData = [
      userId,
      id,
      title,
      url,
      username,
      password,
      String(isFavorite === true),
      timestamp,
    ];

    await appendSheetRow(rowData);
    return NextResponse.json({ success: true, createdAt: timestamp });
  } catch (error) {
    console.error('API POST failed:', error);
    return NextResponse.json({ error: 'Failed to add password' }, { status: 500 });
  }
}

/**
 * PUT: Update an existing password record.
 */
export async function PUT(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, url, username, password, isFavorite, createdAt } = body;

    if (!id || !title || !url || !username || !password) {
      return NextResponse.json({ error: 'All fields are mandatory.' }, { status: 400 });
    }

    const rowData = [
      userId,
      id,
      title,
      url,
      username,
      password,
      String(isFavorite === true),
      createdAt || '',
    ];

    await updateSheetRow(id, userId, rowData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API PUT failed:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a password record.
 */
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    await deleteSheetRow(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE failed:', error);
    return NextResponse.json({ error: 'Failed to delete password' }, { status: 500 });
  }
}
