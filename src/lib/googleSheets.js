import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const sheetId = process.env.GOOGLE_SHEET_ID;

/**
 * Initializes and returns the authenticated Google JWT client.
 */
function getAuthClient() {
  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error('Google Sheets credentials are not configured. Please check your .env.local file.');
  }

  // Format private key to correctly handle newline characters
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * Resolves the sheet name and sheet ID dynamically.
 * Falls back to the first sheet tab if "Sheet1" is not found.
 */
// Global in-memory cache variables for performance optimization
let cachedSheetDetails = null;
let cachedRows = null;
let cachedRowsTimestamp = 0;
let headersChecked = false;
const CACHE_TTL = 60000; // 60 seconds (1 minute) cache validity for faster load times

/**
 * Invalidates the rows cache to force a fresh pull on the next read.
 */
function invalidateCache() {
  cachedRows = null;
  cachedRowsTimestamp = 0;
}

/**
 * Resolves the sheet name and sheet ID dynamically.
 * Caches the resolved sheet metadata in memory to avoid repetitive API calls.
 */
export async function resolveSheetDetails(sheets) {
  if (cachedSheetDetails) return cachedSheetDetails;

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheetsList = metadata.data.sheets || [];
  if (sheetsList.length === 0) {
    throw new Error('No sheets found in the Google Spreadsheet.');
  }

  // Look for "Sheet1" or fall back to the first tab
  const sheet = sheetsList.find(s => s.properties.title === 'Sheet1') || sheetsList[0];
  cachedSheetDetails = {
    name: sheet.properties.title,
    id: sheet.properties.sheetId,
  };
  return cachedSheetDetails;
}

/**
 * Fetches all rows from the Google Sheet.
 * Utilizes in-memory caching and optimized defaults to boost load speed.
 */
export async function getSheetRows() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  const now = Date.now();
  if (cachedRows && (now - cachedRowsTimestamp < CACHE_TTL)) {
    return cachedRows;
  }
  
  try {
    // Default to "Sheet1" or cached sheet name to save an API request to resolveSheetDetails
    let sheetName = cachedSheetDetails ? cachedSheetDetails.name : 'Sheet1';
    const range = `${sheetName}!A:G`;
    
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
      cachedRows = response.data.values || [];
      cachedRowsTimestamp = now;
      if (!cachedSheetDetails) {
        cachedSheetDetails = { name: 'Sheet1', id: 0 };
      }
      return cachedRows;
    } catch (innerError) {
      // Fallback: Resolve dynamically if Sheet1 does not exist
      console.warn('Sheet1 not found, resolving metadata dynamically...');
      const sheetDetails = await resolveSheetDetails(sheets);
      const fallbackRange = `${sheetDetails.name}!A:G`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: fallbackRange,
      });
      cachedRows = response.data.values || [];
      cachedRowsTimestamp = now;
      return cachedRows;
    }
  } catch (error) {
    console.error('Error fetching sheet rows:', error);
    return [];
  }
}

/**
 * Appends a new row to the Google Sheet.
 * Columns: userId, id, title, url, username, password, isFavorite
 */
export async function appendSheetRow(rowData) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const sheetDetails = await resolveSheetDetails(sheets);

    // Only fetch rows to verify headers once per server lifecycle
    if (!headersChecked) {
      const currentRows = await getSheetRows();
      if (currentRows.length === 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: `${sheetDetails.name}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['userId', 'id', 'title', 'url', 'username', 'password', 'isFavorite']],
          },
        });
      }
      headersChecked = true;
    }

    const range = `${sheetDetails.name}!A:G`;
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });
    
    // Invalidate the cache to ensure new password is shown immediately
    invalidateCache();
    return response.data;
  } catch (error) {
    console.error('Error appending sheet row:', error);
    throw error;
  }
}

/**
 * Updates an existing row in the Google Sheet.
 */
export async function updateSheetRow(recordId, userId, rowData) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const sheetDetails = await resolveSheetDetails(sheets);
    const rows = await getSheetRows();
    if (rows.length === 0) {
      throw new Error('Sheet is empty');
    }

    // Find row index (0-indexed in values list, corresponding to sheet row index)
    const rowIndex = rows.findIndex((row) => row[1] === recordId && row[0] === userId);
    if (rowIndex === -1) {
      throw new Error('Record not found or you are not authorized to edit it.');
    }

    const googleRowIndex = rowIndex + 1; // Google Sheets is 1-indexed

    const range = `${sheetDetails.name}!A${googleRowIndex}:G${googleRowIndex}`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache();
    return response.data;
  } catch (error) {
    console.error('Error updating sheet row:', error);
    throw error;
  }
}

/**
 * Deletes a row from the Google Sheet.
 */
export async function deleteSheetRow(recordId, userId) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const sheetDetails = await resolveSheetDetails(sheets);
    const rows = await getSheetRows();
    if (rows.length === 0) {
      throw new Error('Sheet is empty');
    }

    const rowIndex = rows.findIndex((row) => row[1] === recordId && row[0] === userId);
    if (rowIndex === -1) {
      throw new Error('Record not found or you are not authorized to delete it.');
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetDetails.id,
                dimension: 'ROWS',
                startIndex: rowIndex, // inclusive, 0-indexed
                endIndex: rowIndex + 1, // exclusive, 0-indexed
              },
            },
          },
        ],
      },
    });

    invalidateCache();
    return { success: true };
  } catch (error) {
    console.error('Error deleting sheet row:', error);
    throw error;
  }
}

/**
 * Manually clears the rows cache.
 */
export function clearCache() {
  invalidateCache();
}
