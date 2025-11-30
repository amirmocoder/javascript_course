const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const jalaali = require('jalaali-js');

const LIST_URL = 'https://www.digikala.com/product-list/plp_355753040/?sort=7&camCode=1457';
const BASE_URL = 'https://www.digikala.com';
const MAX_PRODUCTS = 50;

// تبدیل تاریخ میلادی به شمسی با فرمت YYYY-MM-DD (مثل 1404-09-09)
function getJalaliToday() {
  const now = new Date();
  const { jy, jm, jd } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const pad = (n) => (n < 10 ? '0' + n : String(n));
  return `${jy}-${pad(jm)}-${pad(jd)}`;
}

// گرفتن لینک محصولات از صفحه لیست
async function getProductLinks() {
  const res = await axios.get(LIST_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(res.data);
  const linksSet = new Set();

  // همه لینک‌هایی که به /product/... اشاره می‌کنند
  $('a[href^="/product/"]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // معمولا لینک‌های محصول شامل dkp- هستند
    if (href.includes('/product/dkp-')) {
      // حذف کوئری‌های اضافی انتهای URL
      const cleanPath = href.split('?')[0];
      linksSet.add(cleanPath);
    }
  });

  const links = Array.from(linksSet).slice(0, MAX_PRODUCTS);
  return links.map((path) => BASE_URL + path);
}

// استخراج اطلاعات یک محصول
async function scrapeProduct(url) {
  const res = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(res.data);

  // --- نام محصول ---
  let name =
    $('h1[data-testid="product-title"]').text().trim() ||
    $('h1.c-product__title').text().trim() ||
    $('h1').first().text().trim();

  // --- تصویر محصول ---
  let image = '';

  // حالت‌های مختلف احتمالی
  const imgSelectors = [
    'img[data-testid="product-primary-image"]',
    'img[alt][src*="dkstatics-public"]',
    '.c-product__gallery img',
  ];

  for (const sel of imgSelectors) {
    const img = $(sel).first();
    if (img && img.attr('src')) {
      image = img.attr('src');
      break;
    }
  }

  // --- قیمت محصول (به صورت عدد) ---
  let price = null;

  // اول از meta[itemprop="price"] (اگر باشد)
  const priceMeta = $('meta[itemprop="price"]').attr('content');
  if (priceMeta) {
    price = parseInt(priceMeta.replace(/[^\d]/g, ''), 10);
  }

  if (!price || Number.isNaN(price)) {
    // جستجو در المان‌های دیگر
    const priceCandidates = [
      '[data-testid="price-final"]',
      '.c-product__seller-price-pure',
      '.js-price-value',
      '.c-product__seller-price-pure span',
    ];

    for (const sel of priceCandidates) {
      const text = $(sel).first().text().trim().replace(/[^\d]/g, '');
      if (text) {
        const p = parseInt(text, 10);
        if (!Number.isNaN(p)) {
          price = p;
          break;
        }
      }
    }
  }

  if (!price || Number.isNaN(price)) {
    price = 0;
  }

  // --- توضیحات / مشخصات محصول ---
  let description = '';

  const descSelectors = [
    '[data-testid="product-specs"]',
    'section[data-testid="product-specifications"]',
    '.c-params__list', // لیست مشخصات
    '.c-content-expert__summary', // خلاصه
  ];

  for (const sel of descSelectors) {
    if ($(sel).length) {
      description = $(sel).text().replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
      if (description) break;
    }
  }

  // اگر توضیحات خالی بود، متای description را استفاده کن
  if (!description) {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) description = metaDesc.trim();
  }

  // تاریخ به شمسی
  const updatedAt = getJalaliToday();

  return {
    name,
    image,
    price,
    description,
    updatedAt,
  };
}

// تابع اصلی
async function main() {
  try {
    console.log('دریافت لینک محصولات از لیست...');
    const productLinks = await getProductLinks();
    console.log(`تعداد لینک پیدا شده: ${productLinks.length}`);

    const products = [];

    for (let i = 0; i < productLinks.length; i++) {
      const url = productLinks[i];
      console.log(`در حال اسکرپ محصول ${i + 1} از ${productLinks.length}:\n${url}`);

      try {
        const productData = await scrapeProduct(url);
        products.push(productData);
      } catch (err) {
        console.error(`خطا در اسکرپ این محصول: ${url}`);
        console.error(err.message);
      }
    }

    fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf-8');
    console.log('✅ فایل products.json با موفقیت ساخته شد.');
  } catch (err) {
    console.error('🔥 خطای کلی:', err.message);
  }
}

main();