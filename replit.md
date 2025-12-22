# منصة الزملاء - تطبيق الأسئلة والأجوبة

## الحالة الحالية

### الميزات المنجزة ✅

#### 1. **معالجة الصور الذكية**
- تثبيت مكتبة `sharp` للمعالجة من جانب الخادم
- إنشاء utility `imageProcessor.ts` للعميل والخادم
- تحويل الصور تلقائياً إلى WebP مع ضغط 80%
- إعادة تحجيم الصور إلى 1200x800 بحد أقصى
- **لا توجد قيود على حجم الملف** - جميع الصور تُعالج تلقائياً

#### 2. **نظام الوسوم (Tags)**
- جدول `tags` في قاعدة البيانات
- جدول `question_tags` لربط الأسئلة بالوسوم
- API endpoint: `GET /api/tags` - لسرد جميع الوسوم
- دعم إضافة وسوم عند إنشاء أسئلة جديدة
- البحث والفلترة حسب الوسوم

#### 3. **نظام المفضلة (Favorites)**
- جدول `favorites` في قاعدة البيانات
- API endpoints:
  - `POST /api/favorites/:questionId` - إضافة للمفضلة
  - `DELETE /api/favorites/:questionId` - حذف من المفضلة
  - `GET /api/favorites/check/:questionId` - فحص إذا كانت مفضلة
  - `GET /api/my-favorites` - الحصول على قائمة المفضلة

#### 4. **نظام التعليقات (Comments)**
- جدول `comments` في قاعدة البيانات
- API endpoints:
  - `GET /api/comments/:questionId` - الحصول على تعليقات السؤال
  - `POST /api/comments/:questionId` - إضافة تعليق جديد
- دعم التعليقات على الأسئلة والإجابات

#### 5. **نظام الفلترة (Filtering)**
- فلترة الأسئلة حسب الموضوع (Subject)
- فلترة حسب الوسوم (Tags)
- فلترة حسب الشهرة/التاريخ

### الميزات المتبقية ❌

#### 1. **واجهات المستخدم للميزات الجديدة**
- واجهة لعرض وإضافة الوسوم
- واجهة لزر المفضلة وعرض المفضلة
- واجهة لعرض وإضافة التعليقات
- فلاتر في الصفحة الرئيسية

#### 2. **نظام التنبيهات (Notifications)**
- يحتاج جدول `notifications`
- يحتاج WebSocket updates
- يحتاج واجهة مستخدم

## جداول قاعدة البيانات

```sql
-- الجداول الجديدة المضافة:
- tags: تخزين الوسوم
- question_tags: علاقة متعدد-لمتعدد بين الأسئلة والوسوم
- favorites: تخزين المفضلة
- comments: تخزين التعليقات
```

## API Endpoints الجديدة

```javascript
// Tags
GET /api/tags - الحصول على جميع الوسوم

// Favorites
POST /api/favorites/:questionId
DELETE /api/favorites/:questionId
GET /api/favorites/check/:questionId
GET /api/my-favorites

// Comments
GET /api/comments/:questionId?answerId=X
POST /api/comments/:questionId

// Filtering (مدعوم في getQuestions)
GET /api/questions?subject=X&tags=X&sortBy=newest|popular
```

## الملفات المعدلة

- `shared/schema.ts` - إضافة schemas للجداول الجديدة
- `server/storage.ts` - إضافة methods للتخزين والاسترجاع
- `server/routes.ts` - إضافة API endpoints
- `server/utils/imageProcessor.ts` - إنشاء معالج الصور
- `client/src/utils/imageProcessor.ts` - إنشاء معالج الصور للعميل
- `client/src/pages/home.tsx` - تحديث لاستخدام معالج الصور

## الخطوات التالية (للـ Turn القادم)

1. **إنشاء واجهات المستخدم الكاملة:**
   - مكون لعرض وإضافة الوسوم
   - زر المفضلة مع حالة التفاعل
   - مكون التعليقات
   - فلاتر متقدمة

2. **نظام التنبيهات:**
   - جدول notifications
   - WebSocket connections
   - واجهة تنبيهات

3. **تحسينات الأداء:**
   - تخزين مؤقت للوسوم
   - pagination للتعليقات
   - infinite scroll

## الملاحظات التقنية

- معالج الصور يدعم **أي حجم صورة** - يتم تحويلها تلقائياً
- استخدام PostgreSQL مع Drizzle ORM
- جميع البيانات مخزنة بآمان في قاعدة البيانات
- التعليقات تدعم ربط مع الإجابات المحددة

## تحسينات عرض الصور ✨

### قائمة الأسئلة (Home Page)
- الصور تظهر **صغيرة 64x64px** على جانب بطاقة السؤال
- تخطيط RTL مناسب مع الصورة على الجانب الأيمن
- صورة صغيرة مع border وتأثير hover سلس

### صفحة السؤال (Question Detail)
- الصورة تظهر **كاملة العرض وواضحة** في الأعلى
- نسبة العرض: 16:9 
- حجم: 384px (h-96) بحد أقصى
- الصورة متكاملة مع تصميم البطاقة

## تاريخ آخر تحديث
December 22, 2025 - 3:40 PM
