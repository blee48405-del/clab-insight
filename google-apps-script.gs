/**
 * CLAB 챗봇 → Google Sheets 연동 스크립트
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * [설치 방법]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Google Sheets 새 스프레드시트 생성
 *    - 시트 이름을 "문의내역" 으로 변경 (또는 아래 SHEET_NAME 수정)
 *
 * 2. 상단 메뉴 → 확장 프로그램 → Apps Script 클릭
 *
 * 3. 이 파일 전체 내용을 붙여넣기 (기존 코드 대체)
 *
 * 4. SPREADSHEET_ID 를 스프레드시트 URL에서 복사해 넣기
 *    URL 예: https://docs.google.com/spreadsheets/d/【여기가 ID】/edit
 *
 * 5. 배포 → 새 배포 → 웹 앱 선택
 *    - 설명: CLAB 챗봇 v1
 *    - 실행 계정: 나 (자신의 Google 계정)
 *    - 액세스 권한: 모든 사용자 (익명 포함)
 *    → 배포 클릭 → 권한 승인 → 웹 앱 URL 복사
 *
 * 6. 복사한 URL을 chatbot.js 파일의 APPS_SCRIPT_URL 에 붙여넣기
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ▼ 스프레드시트 ID (URL에서 복사)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

// ▼ 데이터를 저장할 시트 이름
const SHEET_NAME = '문의내역';

/**
 * POST 요청 처리 — 챗봇에서 보낸 데이터를 스프레드시트에 기록
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet(ss, SHEET_NAME);

    // 헤더가 없으면 첫 행에 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['타임스탬프', '이름', '메시지', '페이지 URL', '수신 시각']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#FF5C35').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    const receivedAt = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    sheet.appendRow([
      data.timestamp  || receivedAt,
      data.name       || '익명',
      data.message    || '',
      data.page       || '',
      receivedAt,
    ]);

    // 열 너비 자동 조정 (최초 1회만 적용됨)
    if (sheet.getLastRow() === 2) {
      sheet.autoResizeColumns(1, 5);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('doPost 오류:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET 요청 처리 — 배포 URL 동작 확인용
 */
function doGet() {
  return ContentService
    .createTextOutput('CLAB 챗봇 API가 정상 동작 중입니다.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 시트가 없으면 새로 생성하는 헬퍼
 */
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * (선택) 새 문의가 접수되면 이메일 알림 발송
 * 사용하려면 아래 주석을 해제하고 NOTIFY_EMAIL 주소를 입력하세요.
 */
/*
const NOTIFY_EMAIL = 'your@email.com';

function sendNotification(name, message) {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '[CLAB] 새 문의가 접수되었습니다',
    body: `이름: ${name}\n\n내용:\n${message}\n\n— CLAB 챗봇 알림`,
  });
}
*/
