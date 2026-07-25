import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSheetRows, resolveSheetDetails, clearCache } from '@/lib/googleSheets';
import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const sheetId = process.env.GOOGLE_SHEET_ID;

function getAuthClient() {
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * POST: Updates all password records for the logged-in user with a new master password encryption.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { records } = body; // Array of encrypted records (contains: id, title, url, username, password, isFavorite)

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    const authClient = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Fetch existing sheet rows
    const allRows = await getSheetRows();
    const headers = allRows.length > 0 ? allRows[0] : ['userId', 'id', 'title', 'url', 'username', 'password', 'isFavorite'];

    // 2. Filter out this user's records to keep other users' data intact
    const otherUsersRows = allRows.slice(1).filter((row) => row[0] !== userId);

    // 3. Format the new encrypted records for this user into sheet rows
    const newUserRows = records.map((r) => [
      userId,
      r.id,
      r.title,
      r.url,
      r.username,
      r.password,
      String(r.isFavorite === true),
    ]);

    // 4. Combine headers, other users' data, and the updated user data
    const updatedValues = [headers, ...otherUsersRows, ...newUserRows];

    // 5. Retrieve Sheet metadata to clear and update
    const sheetDetails = await resolveSheetDetails(sheets);

    // 6. Clear existing values to prevent leftover rows
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetDetails.name}!A:G`,
    });

    // 7. Write the complete set of rows
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetDetails.name}!A:G`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: updatedValues,
      },
    });

    // 8. Invalidate rows cache
    clearCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API change-master failed:', error);
    return NextResponse.json({ error: 'Failed to update Master Password.' }, { status: 500 });
  }
}
