/*
  # Sample Data for Sales and Inventory Management System

  Adds realistic Arabic sample data for testing:
  
  1. Categories: General store categories
  2. Products: Common products with Iraqi Dinar pricing
  3. Customers: Sample customer records
  
  Prices are in Iraqi Dinars (no decimals)
*/

-- Sample Categories
INSERT INTO categories (name, description) VALUES
  ('أغذية ومشروبات', 'منتجات غذائية ومشروبات متنوعة'),
  ('منظفات', 'مواد تنظيف وتعقيم'),
  ('ألبان وأجبان', 'منتجات الألبان والأجبان'),
  ('خضروات وفواكه', 'خضروات وفواكه طازجة'),
  ('مشروبات غازية', 'مشروبات غازية وعصائر'),
  ('حلويات وشوكولاتة', 'حلويات وشوكولاتة متنوعة'),
  ('مواد تموينية', 'مواد تموينية وأرز وسكر'),
  ('معلبات', 'معلبات وأطعمة محفوظة')
ON CONFLICT DO NOTHING;

-- Sample Products (prices in Iraqi Dinars)
INSERT INTO products (name, barcode, description, category_id, purchase_price, selling_price, quantity, low_stock_threshold, image_url) VALUES
  -- أغذية ومشروبات
  ('ماء بترول 1.5 لتر', '6281001000001', 'ماء معدني بترول حجم 1.5 لتر', (SELECT id FROM categories WHERE name = 'أغذية ومشروبات'), 250, 500, 100, 20, 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?w=200'),
  ('شاي لبتون أصلي 100غ', '6281001000002', 'شاي أسود لبتون وزن 100 غرام', (SELECT id FROM categories WHERE name = 'أغذية ومشروبات'), 2500, 3500, 50, 10, 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?w=200'),
  ('قهوة نسكافيه 200غ', '6281001000003', 'قهوة سريعة الذوبان نسكافيه', (SELECT id FROM categories WHERE name = 'أغذية ومشروبات'), 5000, 7500, 40, 10, 'https://images.pexels.com/photos/312411/pexels-photo-312411.jpeg?w=200'),
  
  -- منظفات
  ('صابون لوكس 125غ', '6281001000004', 'صابون استحمام لوكس وزن 125 غرام', (SELECT id FROM categories WHERE name = 'منظفات'), 500, 1000, 80, 15, 'https://images.pexels.com/photos/4210787/pexels-photo-4210787.jpeg?w=200'),
  ('مسحوق غسيل تايد 1 كغ', '6281001000005', 'مسحوق غسيل أتوماتيك تايد', (SELECT id FROM categories WHERE name = 'منظفات'), 5000, 8000, 30, 10, 'https://images.pexels.com/photos/4210787/pexels-photo-4210787.jpeg?w=200'),
  ('ديتول سائل 750 مل', '6281001000006', 'سائل تعقيم وتنظيف ديتول', (SELECT id FROM categories WHERE name = 'منظفات'), 2000, 3500, 45, 10, 'https://images.pexels.com/photos/4210787/pexels-photo-4210787.jpeg?w=200'),
  
  -- ألبان وأجبان
  ('حليب بازرعان 1 لتر', '6281001000007', 'حليب طازج بازرعان', (SELECT id FROM categories WHERE name = 'ألبان وأجبان'), 1000, 2000, 60, 20, 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?w=200'),
  ('جبنة بيك ساير 250غ', '6281001000008', 'جبنة بيضاء بيك ساير', (SELECT id FROM categories WHERE name = 'ألبان وأجبان'), 1500, 2500, 50, 10, 'https://images.pexels.com/photos/776254/pexels-photo-776254.jpeg?w=200'),
  ('لبن رايبي 500 مل', '6281001000009', 'لبن رايبي طازج', (SELECT id FROM categories WHERE name = 'ألبان وأجبان'), 800, 1500, 70, 15, 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?w=200'),
  
  -- مشروبات غازية
  ('بيبسي 330 مل', '6281001000010', 'مشروب غازي بيبسي علب', (SELECT id FROM categories WHERE name = 'مشروبات غازية'), 250, 500, 120, 30, 'https://images.pexels.com/photos/5052875/pexels-photo-5052875.jpeg?w=200'),
  ('كوكا كولا 330 مل', '6281001000011', 'مشروب غازي كوكا كولا علب', (SELECT id FROM categories WHERE name = 'مشروبات غازية'), 250, 500, 100, 25, 'https://images.pexels.com/photos/5052875/pexels-photo-5052875.jpeg?w=200'),
  ('عصير برتقال 1 لتر', '6281001000012', 'عصير برتقال طبيعي', (SELECT id FROM categories WHERE name = 'مشروبات غازية'), 2000, 3500, 40, 10, 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?w=200'),
  
  -- حلويات وشوكولاتة
  ('شوكولاتة جلاكسي 45غ', '6281001000013', 'شوكولاتة جلاكسي بالحليب', (SELECT id FROM categories WHERE name = 'حلويات وشوكولاتة'), 500, 1000, 80, 20, 'https://images.pexels.com/photos/6582729/pexels-photo-6582729.jpeg?w=200'),
  ('شوكولاتة مارس 45غ', '6281001000014', 'شوكولاتة مارس', (SELECT id FROM categories WHERE name = 'حلويات وشوكولاتة'), 500, 1000, 75, 15, 'https://images.pexels.com/photos/6582729/pexels-photo-6582729.jpeg?w=200'),
  ('بسكويت أولكر 150غ', '6281001000015', 'بسكويت شوكلت أولكر', (SELECT id FROM categories WHERE name = 'حلويات وشوكولاتة'), 1000, 2000, 50, 10, 'https://images.pexels.com/photos/6582729/pexels-photo-6582729.jpeg?w=200'),
  
  -- مواد تموينية
  ('رز بسمتي 1 كغ', '6281001000016', 'أرز بسمتي هندية وزن 1 كيلو', (SELECT id FROM categories WHERE name = 'مواد تموينية'), 3000, 5000, 60, 15, 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?w=200'),
  ('سكر 1 كغ', '6281001000017', 'سكر أبيض ناعم وزن 1 كيلو', (SELECT id FROM categories WHERE name = 'مواد تموينية'), 1500, 2500, 100, 20, 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?w=200'),
  ('زيت قلي 1 لتر', '6281001000018', 'زيت نباتي للقلي', (SELECT id FROM categories WHERE name = 'مواد تموينية'), 3000, 5000, 50, 10, 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?w=200'),
  
  -- معلبات
  ('حليب نستله مكثف 395غ', '6281001000019', 'حليب محلى مركز نستله', (SELECT id FROM categories WHERE name = 'معلبات'), 2000, 3500, 40, 10, 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?w=200'),
  ('تونة بسرطان 160غ', '6281001000020', 'تونة بسرطان بزيت', (SELECT id FROM categories WHERE name = 'معلبات'), 2500, 4000, 35, 10, 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?w=200')
ON CONFLICT (barcode) DO NOTHING;

-- Sample Customers
INSERT INTO customers (name, phone, address, debt_balance, notes) VALUES
  ('أحمد محمد علي', '07701234561', 'بغداد - الكرادة - شارع السعدون', 50000, 'عميل دائم ومحترم'),
  ('فاطمة حسن جاسم', '07701234562', 'بغداد - المنصور - حي 14 تموز', 0, 'تدفع دائماً نقداً'),
  ('محمود عبدالله خالد', '07701234563', 'بغداد - الشعلة - قرب الجسر', 125000, 'لديه ديون متراكمة'),
  ('زينب علي حسين', '07701234564', 'بغداد - الدورة - حي المروج', 0, ''),
  ('علاء كريم محمد', '07701234565', 'بغداد - الأعظمية - شارع الملك فيصل', 75000, 'موعد دفع آخر الشهر'),
  ('نورا سعيد أحمد', '07701234566', 'بغداد - الرصافة - سوق الشورجة', 0, 'صاحبة محل'),
  ('حيدر جاسم حميد', '07701234567', 'بغداد - الكاظمية - قرب المرقد', 200000, 'يحتاج متابعة'),
  ('سارة عمران يوسف', '07701234568', 'بغداد - العattabia - شارع الرشيد', 25000, 'عميلة جديدة'),
  ('علي حسين عباس', '07701234569', 'بغداد - الحرية - حي الوحدة', 0, 'تاجر جملة'),
  ('هدى إبراهيم سالم', '07701234570', 'بغداد - زيونة - شارع الفارس', 45000, '')
ON CONFLICT DO NOTHING;