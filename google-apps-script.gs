/**
 * CLAB 챗봇 → Google Sheets 연동 스크립트 v2
 * 컬럼: 시간 | 이름 | 문의유형 | 세부유형 | 연락처 | 문의내용 | 페이지URL
 */

const SPREADSHEET_ID = '1Cp2D7LJxyHzjHyPB0lKGUJXfCh2sD5NUnX8rWF1kkDQ';
const SHEET_NAME = '문의내역';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['시간', '이름', '문의유형', '세부유형', '연락처', '문의내용', '페이지URL']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#FF5C35').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(6, 300);
    }

    sheet.appendRow([
      data.timestamp   || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
      data.name        || '익명',
      data.category    || '',
      data.subCategory || '',
      data.contact     || '',
      data.message     || '',
      data.page        || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('ok');
}
