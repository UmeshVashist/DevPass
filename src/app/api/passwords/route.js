import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getSheetRows,
  appendSheetRow,
  updateSheetRow,
  deleteSheetRow,
} from '@/lib/googleSheets';

/**
 * GET: Fetch all passwords for the logged-in user.
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
      }));

    return NextResponse.json(userPasswords);
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
    const { id, title, url, username, password, isFavorite } = body;

    // Validate required fields
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
    ];

    await appendSheetRow(rowData);
    return NextResponse.json({ success: true });
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
    const { id, title, url, username, password, isFavorite } = body;

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
