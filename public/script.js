// script.js (v2026.0012_MATCH_GAS_ROW)
// ✅ 너의 Apps Script(doPost)가 요구하는 payload 구조: { row: [...] } 에 맞춰 전송
// ✅ CORS preflight 회피: Content-Type을 text/plain로 JSON 전송
// ✅ 테스트 루트 제공: ?test=1 (강제 성공/폼 오픈), ?record=20.268 (기록초 지정)
//
// 시트 컬럼 구조(8개):
// [시간, 이름, 전화번호, 언어, 기록초, 공유여부, 상담신청, 생년월일]

let startTime = null, timer = null, chances = 1;
let lastRecordSec = null;

const timeEl = document.getElementById('time');
const chanceEl = document.getElementById('chance');
const resultEl = document.getElementById('result');
const retryBox = document.getElementById('retryBox');
const formBox = document.getElementById('formBox');

const tickAudio = new Audio('clock-ticking.mp3');
tickAudio.loop = true;
const winAudio = new Audio('reveal.mp3');

const AD_URL = 'https://capable-kataifi-46f1ad.netlify.app/';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzqvExf3oVzLK578Rv_AUN3YTzlo90x6gl0VAS8J7exjbapf--4ODxQn_Ovxrr9rKfG/exec';

// 테스트 모드: ?test=1, 기록초 지정: ?record=20.268
const params = new URLSearchParams(location.search);
const TEST_MODE = params.get('test') === '1';
const TEST_RECORD = (() => {
  const r = params.get('record');
  const n = r ? Number(r) : NaN;
  return Number.isFinite(n) ? Number(n.toFixed(3)) : 20.262;
})();

function updateChance(){ chanceEl.textContent = chances; }
function resetUI(){
  retryBox.classList.add('hidden');
  formBox.classList.add('hidden');
  resultEl.textContent = '';
}

document.getElementById('startBtn').onclick = () => {
  if (chances <= 0) return;

  lastRecordSec = null;
  resetUI();

  startTime = performance.now();
  tickAudio.currentTime = 0;
  tickAudio.play();

  timer = setInterval(() => {
    const t = (performance.now() - startTime) / 1000;
    timeEl.textContent = t.toFixed(3);
  }, 10);
};

document.getElementById('stopBtn').onclick = () => {
  if (!timer) return;

  clearInterval(timer);
  timer = null;
  tickAudio.pause();

  const final = parseFloat(timeEl.textContent);
  chances--;
  updateChance();

  if (final >= 20.260 && final <= 20.269) {
    lastRecordSec = Number(final.toFixed(3));
    resultEl.textContent = '🎉 성공! (기록: ' + lastRecordSec.toFixed(3) + 's)';
    winAudio.play();
    formBox.classList.remove('hidden');
  } else {
    resultEl.textContent = '😢 실패! (기록: ' + final.toFixed(3) + 's)';
    retryBox.classList.remove('hidden');
  }
};

document.getElementById('shareBtn').onclick = async () => {
  const url = 'https://my-fortune.streamlit.app/';
  try {
    if (navigator.share) {
      await navigator.share({ title: '20.26 챌린지', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다!');
    }
    chances++;
    updateChance();
    retryBox.classList.add('hidden');
  } catch (e) {}
};

function adRetry(){
  window.open(AD_URL, '_blank');
  chances++;
  updateChance();
  retryBox.classList.add('hidden');
}
document.getElementById('adRetryBtn').onclick = adRetry;
document.getElementById('adBtn').onclick = adRetry;

// ✅ 테스트 모드: 페이지 로드시 폼 강제 오픈 + 기록초 세팅
if (TEST_MODE) {
  resultEl.textContent = '🧪 테스트 모드 ON (강제 성공/전송 테스트 가능)';
  lastRecordSec = TEST_RECORD;
  formBox.classList.remove('hidden');
  chances = 99;
  updateChance();
}

document.getElementById('submitBtn').onclick = async () => {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const agreed = document.getElementById('agree').checked;

  if (!agreed) { alert('동의 필요'); return; }
  if (!name) { alert('이름을 입력해주세요'); return; }
  if (!phone) { alert('전화번호를 입력해주세요'); return; }
  if (lastRecordSec === null) { alert('기록이 확인되지 않습니다.'); return; }

  // ✅ GAS가 요구하는 row 배열(8개)로 구성
  const row = [
    new Date().toISOString(),      // 시간(문자열로도 OK; 시트에서 자동 변환 가능)
    name,                          // 이름
    phone,                         // 전화번호
    'ko',                          // 언어
    Number(lastRecordSec).toFixed(3), // 기록초
    false,                         // 공유여부
    true,                          // 상담신청
    ''                             // 생년월일
  ];

  try {
    const payload = { row };

    // ✅ 핵심: text/plain + JSON (preflight 회피 + GAS JSON.parse 가능)
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (res && res.status && res.status >= 400) throw new Error('HTTP ' + res.status);

    alert('응모 완료!' + (TEST_MODE ? ' (테스트)' : ''));
  } catch (e) {
    alert('전송 실패!\n(' + (e && e.message ? e.message : 'unknown error') + ')');
  }
};
