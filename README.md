
New Attend App - PWA (Arabic)

الملفات داخل الحزمة:
- index.html : واجهة التطبيق (مسح QR، إدخال يدوي، عداد)
- app.js : منطق التطبيق (مضمّن رابط Google Script عبر corsproxy.io)
- styles.css : أنماط RTL متجاوبة
- manifest.json و service-worker.js : لجعل التطبيق PWA
- google_apps_script.gs : كود Apps Script للصق في محرر Apps Script داخل Google Sheets
- README.md : تعليمات الربط والنشر

خطوات سريعة لتشغيل:
1) أنشئ Google Sheet واحد وأضف ورقتين: "QRData" و "Database".
2) افتح Extensions → Apps Script في الشيت، أنشئ مشروعًا جديدًا، والصق محتوى google_apps_script.gs، ثم انشر كـ Web App:
   - Execute as: Me
   - Who has access: Anyone (even anonymous)
   انسخ رابط /exec وضعه إذا رغبت في app.js (لكن هذا المشروع يستخدم رابطك المضمّن مع corsproxy.io).
3) ارفع المحتويات إلى مستودع GitHub (branch gh-pages أو إعداد Pages من main) ثم فعّل GitHub Pages.
4) افتح موقعك — التطبيق جاهز للعمل من GitHub Pages.
