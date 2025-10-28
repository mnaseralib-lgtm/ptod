
// app.js - New Attend App (supports QR scanning and reports)
// Using corsproxy to avoid CORS when hosted on GitHub Pages
const GOOGLE_SCRIPT_URL = "https://corsproxy.io/?https://script.google.com/macros/s/AKfycbzl9zgXeUQ2OY5nJD_Ficnil15j22IgbbmY8ZTqZwLWBhndQqhmnx0lpgPtVjLXtqIi/exec";

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const previewElemId = 'preview';
const actionType = document.getElementById('actionType');
const manualInput = document.getElementById('manualInput');
const submitManual = document.getElementById('submitManual');
const scannedCountEl = document.getElementById('scannedCount');
const lastMsg = document.getElementById('lastMsg');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const reportsLink = document.getElementById('reportsLink');
const reportsPage = document.getElementById('reportsPage');
const mainCard = document.getElementById('mainCard');
const reportType = document.getElementById('reportType');
const employeeBlock = document.getElementById('employeeBlock');
const dayBlock = document.getElementById('dayBlock');
const rangeBlock = document.getElementById('rangeBlock');
const getReport = document.getElementById('getReport');
const reportResult = document.getElementById('reportResult');
const downloadXLS = document.getElementById('downloadXLS');
const employeeIdInput = document.getElementById('employeeId');
const dayDate = document.getElementById('dayDate');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const homeLink = document.getElementById('homeLink');
const readmeLink = document.getElementById('readmeLink');
const readmePage = document.getElementById('readmePage');
const preview = document.getElementById(previewElemId);

let html5QrcodeScanner = null;
let scanning = false;
let scannedCount = 0;

function updateCounter(){ scannedCountEl.textContent = scannedCount; }
function showMsg(text, error=false){ lastMsg.textContent = text; lastMsg.style.color = error ? 'red' : 'green'; setTimeout(function(){ lastMsg.textContent = '' }, 5000); }

startBtn.addEventListener('click', function(){
  if (scanning) return;
  if (!Html5Qrcode) { showMsg('مكتبة المسح غير محمّلة', true); return; }
  html5QrcodeScanner = new Html5Qrcode(previewElemId);
  html5QrcodeScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    function(decodedText, decodedResult){
      // handle on success
      stopScanning();
      handleScanned(decodedText);
    },
    function(error){ /* ignore scan errors */ }
  ).then(function(){ scanning = true; startBtn.disabled = true; stopBtn.disabled = false; showMsg('📷 جاهز للمسح...'); })
  .catch(function(err){ showMsg('خطأ في الوصول للكاميرا', true); console.error(err); });
});

stopBtn.addEventListener('click', function(){ stopScanning(); });

function stopScanning(){
  if (html5QrcodeScanner && scanning){
    html5QrcodeScanner.stop().then(function(){ html5QrcodeScanner.clear(); scanning = false; startBtn.disabled = false; stopBtn.disabled = true; showMsg('تم إيقاف المسح'); }).catch(function(e){ console.error(e); });
  }
}

function isNumericString(str){ return /^\d{1,14}$/.test(str); }

submitManual.addEventListener('click', function(){
  var val = manualInput.value.trim();
  if (!isNumericString(val)){ showMsg('أدخل رقم موظف صالح (أرقام فقط حتى 14 رقم).', true); return; }
  handleScanned(val);
  manualInput.value = '';
});

async function handleScanned(employeeNumber){
  var action = actionType.value;
  var now = new Date();
  var timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  var formattedTime = now.toLocaleTimeString('en-US', timeOptions);
  var today = now.toISOString().slice(0,10);

  var payload = { employeeNumber: employeeNumber, action: action, date: today, time: formattedTime };

  scannedCount++;
  updateCounter();

  try{
    var res = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    var text = await res.text();
    try { var j = JSON.parse(text); } catch(e){ var j = null; }
    if (res.ok && j && j.status === 'ok') showMsg('تم الإرسال: ' + employeeNumber);
    else if (res.ok && j) showMsg('استجابة: ' + (j.message || JSON.stringify(j)));
    else showMsg('فشل الإرسال: ' + text, true);
  }catch(e){
    showMsg('خطأ في الإرسال: ' + e.message, true);
    console.error(e);
  }
}

// Sidebar and navigation
menuBtn.addEventListener('click', function(){ sidebar.classList.toggle('hidden'); });
reportsLink.addEventListener('click', function(e){ e.preventDefault(); reportsPage.classList.remove('hidden'); mainCard.classList.add('hidden'); sidebar.classList.add('hidden'); });
homeLink.addEventListener('click', function(e){ e.preventDefault(); reportsPage.classList.add('hidden'); mainCard.classList.remove('hidden'); });
readmeLink.addEventListener('click', function(e){ e.preventDefault(); readmePage.classList.remove('hidden'); mainCard.classList.add('hidden'); sidebar.classList.add('hidden'); });

reportType.addEventListener('change', function(){ var v = reportType.value; employeeBlock.classList.toggle('hidden', v!=='employee'); dayBlock.classList.toggle('hidden', v!=='day'); rangeBlock.classList.toggle('hidden', v!=='range'); });

getReport.addEventListener('click', async function(){
  var url = GOOGLE_SCRIPT_URL + '?action=report&type=' + reportType.value;
  if (reportType.value === 'employee'){ var id = employeeIdInput.value.trim(); if (!id) return showMsg('أدخل رقم الموظف.', true); url += '&employee=' + encodeURIComponent(id); }
  else if (reportType.value === 'day'){ if (!dayDate.value) return showMsg('اختر التاريخ.', true); url += '&date=' + dayDate.value; }
  else { if (!fromDate.value || !toDate.value) return showMsg('اختر المدى الزمنى.', true); url += '&from=' + fromDate.value + '&to=' + toDate.value; }

  try{
    var res = await fetch(url);
    var j = await res.json();
    if (j && j.status === 'ok'){ renderReportTable(j.columns, j.rows); downloadXLS.disabled = false; window._lastReport = {columns:j.columns, rows:j.rows}; }
    else showMsg('لم يتم العثور على بيانات', true);
  }catch(e){ showMsg('خطأ في جلب التقرير', true); console.error(e); }
});

function renderReportTable(columns, rows){
  var html = '<table><thead><tr>';
  columns.forEach(function(c){ html += '<th>' + c + '</th>'; });
  html += '</tr></thead><tbody>';
  rows.forEach(function(r){ html += '<tr>'; r.forEach(function(cell){ html += '<td>' + (cell===null?'':cell) + '</td>'; }); html += '</tr>'; });
  html += '</tbody></table>';
  reportResult.innerHTML = html;
}

downloadXLS.addEventListener('click', function(){
  var rep = window._lastReport;
  if (!rep) return;
  var cols = rep.columns;
  var rows = rep.rows;
  var csv = [cols.join(',')].concat(rows.map(function(r){ return r.map(function(c){ return '"' + (c===null?'':String(c).replace(/"/g,'""')) + '"'; }).join(','); })).join('\n');
  var blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'report.csv';
  a.click();
  URL.revokeObjectURL(url);
});
