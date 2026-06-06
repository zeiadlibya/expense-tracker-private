# محفظتي - تطبيق المصروفات الشخصي

تطبيق عربي شخصي لإدارة الدخل والمصروفات، بواجهة هاتف حديثة، وتحليلات فورية، وحفظ اختياري في Google Sheets.

## الملفات التي ترفعها إلى GitHub

- `index.html`
- `style.css`
- `app.js`
- `google-apps-script.gs`

يمكن ترك `expense-tracker.html` كنسخة قديمة احتياطية، لكن النسخة المحسنة الآن هي `index.html`.

## تجهيز Google Sheets

1. افتح ملف Google Sheets الخاص بك.
2. اجعل عندك ورقتين بالأسماء التالية بالضبط:
   - `transactions`
   - `splits`
3. من القائمة اختر `Extensions` ثم `Apps Script`.
4. احذف الكود القديم والصق محتوى `google-apps-script.gs`.
5. اضغط حفظ.
6. اختر `Deploy` ثم `New deployment`.
7. اختر النوع `Web app`.
8. اجعل `Execute as` = `Me`.
9. اجعل `Who has access` = `Anyone`.
10. اضغط `Deploy` وانسخ رابط Web App الذي ينتهي بـ `/exec`.

## ربط التطبيق بالشيت

1. افتح `index.html`.
2. افتح الإعدادات من زر الترس.
3. الصق رابط Google Web App في خانة `رابط Google Sheets Web App`.
4. اضغط `حفظ الرابط`.
5. اضغط `تحميل من Google Sheets` إذا أردت استرجاع البيانات الموجودة في الشيت.

بعد حفظ الرابط، أي إضافة أو حذف داخل التطبيق سيتم حفظها محلياً وإرسال نسخة إلى Google Sheets.

## ماذا تحفظ كل ورقة؟

- `transactions`: كل عمليات الدخل والمصروفات، وتشمل النوع، القيمة، التصنيف، طريقة الدفع، التاريخ، والوصف.
- `splits`: ذاكرة تقسيم الدخل. تحتوي على إجمالي التوفير/المصروفات/الطوارئ، وأيضاً تقسيم كل عملية دخل حسب رقم العملية.

## رفع المشروع على GitHub كـ Private

من GitHub:

1. أنشئ Repository جديد.
2. اختر `Private`.
3. ارفع الملفات: `index.html`, `style.css`, `app.js`, `google-apps-script.gs`, `README.md`.
4. اضغط `Commit changes`.
