/****************************************************
 *  پروژه: سیستم ساده فروشگاه داینامیک با JS خالص
 *  شامل: خواندن JSON، صفحه‌بندی، سبد خرید، تخفیف،
 *  ذخیره‌سازی رفتار کاربر با localStorage و کوکی‌ها،
 *  استفاده از Closure, Callbacks, Arrow Functions و…
 ****************************************************/


/* --------------------------------------------------
        🔷 متغیرهای عمومی مورد استفاده در کل پروژه
-------------------------------------------------- */

// برای پیام‌های بالای صفحه
var messageTimeout = null;

// شماره صفحه فعلی (برای صفحه‌بندی)
var currentPage = 1;

// تعداد محصولاتی که در هر صفحه نمایش داده می‌شود
var PRODUCTS_PER_PAGE = 6;

// لیست کامل محصولات که از فایل products.json لود می‌شود
var products = [];

// آیا تخفیف شانسی فعال شده؟
var discountEnabled = false;

// آرایه‌ی سبد خرید
var cartItems = [];



/* --------------------------------------------------
    🔷 تابع تبدیل اعداد به فرمت سه‌رقمی جداشده با کومّا
    (Function Expression = تابع به‌صورت مقدار یک متغیر)
-------------------------------------------------- */
var formatNumber = function (num) {
    // تبدیل ورودی به رشته
    var str = String(num);
    var result = "";
    var count = 0;
    var i;

    // از انتهای متن شروع می‌کنیم (برای جداکردن 3 تایی)
    for (i = str.length - 1; i >= 0; i--) {
        result = str.charAt(i) + result;
        count++;

        // هر 3 رقم یک کاما اضافه می‌کنیم (اگر رقم اول نباشد)
        if (count === 3 && i !== 0) {
            result = "," + result;
            count = 0;
        }
    }
    return result;
};



/* --------------------------------------------------
   🔷 کوتاه کردن متن توضیحات (Function Declaration)
-------------------------------------------------- */
function truncateText(text, limit) {
    if (!text) {
        return "";
    }
    if (text.length <= limit) {
        return text;
    }
    return text.substring(0, limit) + "...";
}



/* --------------------------------------------------
                🔷 توابع مدیریت کوکی‌ها
-------------------------------------------------- */

/* 
تابع ذخیره کوکی:
name = نام کوکی
value = مقدار آن
days = چند روز اعتبار داشته باشد
*/
function setCookie(name, value, days) {
    var d = new Date();
    // زمان انقضا را حساب می‌کنیم
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));

    // تبدیل به فرمت صحیح کوکی
    var expires = "expires=" + d.toUTCString();

    // ذخیره نهایی
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}


/*
تابع خواندن کوکی از طریق نام آن
*/
function getCookie(name) {
    var cname = name + "=";
    var decoded = document.cookie || "";
    var ca = decoded.split(";");

    var i;
    for (i = 0; i < ca.length; i++) {
        var c = ca[i];

        // حذف فاصله‌های اضافی اول رشته
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }

        // اگر کوکی با نام موردنظر شروع شده بود → مقدارش را برمی‌گردانیم
        if (c.indexOf(cname) === 0) {
            return decodeURIComponent(c.substring(cname.length, c.length));
        }
    }
    return "";
}


/*
🔹 ذخیره تمام صفحات دیده‌شده توسط کاربر در کوکی
*/
function logPageClickToCookie(page) {
    var raw = getCookie("pageClicks");
    var arr = [];
    var i;

    // اگر کوکی قبلاً وجود داشت → آن را تبدیل به آرایه می‌کنیم
    if (raw) {
        arr = raw.split(",");
    }

    // شماره صفحه جدید را اضافه می‌کنیم
    arr.push(String(page));

    // ذخیره مجدد کوکی
    setCookie("pageClicks", arr.join(","), 7);

    console.log("Page clicks (saved in cookie):", arr.join(","));
}



/* --------------------------------------------------
          🔷 مدیریت ذخیره‌سازی داده‌ها در localStorage
-------------------------------------------------- */

/*
ذخیره سبد خرید در localStorage
*/
function saveCartToStorage() {
    try {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (e) {
        console.warn("خطا در ذخیره سبد خرید:", e);
    }
}


/*
لود سبد خرید از localStorage
*/
function loadCartFromStorage() {
    try {
        var raw = localStorage.getItem("cartItems");

        if (!raw) {
            cartItems = [];
            return;
        }

        var data = JSON.parse(raw);

        if (Object.prototype.toString.call(data) === "[object Array]") {
            cartItems = data;
        } else {
            cartItems = [];
        }
    } catch (e) {
        console.warn("خطا در خواندن سبد خرید:", e);
        cartItems = [];
    }
}


/*
ذخیره صفحات دیده‌شده در localStorage
*/
function addVisitedPageToStorage(page) {
    var arr = [];

    try {
        var raw = localStorage.getItem("visitedPages");
        if (raw) {
            arr = JSON.parse(raw);
            if (Object.prototype.toString.call(arr) !== "[object Array]") {
                arr = [];
            }
        }
    } catch (e) {
        arr = [];
    }

    // جلوگیری از تکراری بودن
    if (arr.indexOf(page) === -1) {
        arr.push(page);
    }

    localStorage.setItem("visitedPages", JSON.stringify(arr));
    console.log("Page visited (localStorage):", page);
}


/*
ذخیره کلیک روی دکمه "توضیحات"
*/
function addDetailClickToStorage(productName) {
    var arr = [];

    try {
        var raw = localStorage.getItem("detailClickedProducts");
        if (raw) {
            arr = JSON.parse(raw);
            if (Object.prototype.toString.call(arr) !== "[object Array]") {
                arr = [];
            }
        }
    } catch (e) {
        arr = [];
    }

    arr.push(productName);

    localStorage.setItem("detailClickedProducts", JSON.stringify(arr));
    console.log("Details clicked:", productName);
}



/* --------------------------------------------------
    🔷 تابع callback: اجرای یک عملیات روی همه محصولات
-------------------------------------------------- */

function forEachProduct(callback) {
    // callback می‌تواند هر تابع دلخواهی باشد
    var i;
    for (i = 0; i < products.length; i++) {
        callback(products[i], i); // استفاده از callback
    }
}



/* --------------------------------------------------
    🔷 تخفیف ۲۰٪ شانسی روی محصولات (با callback)
-------------------------------------------------- */

function applyRandomDiscountsToProducts() {
    // احتمال ۲۰ درصد
    if (Math.random() > 0.2) {
        discountEnabled = false;
        return;
    }

    discountEnabled = true;

    // نمایش نوار تخفیف بالا
    var db = document.getElementById("discountBar");
    if (db) {
        db.style.display = "flex";
        db.innerHTML = "تبریک! به‌صورت شانسی تخفیف ۱ تا ۳۰٪ دریافت کرده‌اید.";
    }

    // استفاده از callback در forEachProduct
    forEachProduct(function (p) {
        var basePrice = parseInt(p.price, 10);
        if (isNaN(basePrice)) {
            return;
        }

        var percent = Math.floor(Math.random() * 30) + 1;

        // مبلغ تخفیف
        var discountAmount = Math.round(basePrice * percent / 100);

        // قیمت نهایی بعد از تخفیف
        var newPrice = basePrice - discountAmount;

        p.discountPercent = percent;
        p.discountPrice = newPrice;
    });
}



/* --------------------------------------------------
                🔷 پیام داخلی بالای صفحه
-------------------------------------------------- */

function showMessage(text, type) {
    var bar = document.getElementById("messageBar");

    // ساخت کلاس CSS
    var cls = "message-bar message-bar--visible ";
    cls += type === "success" ? "message-bar--success" : "message-bar--info";

    bar.className = cls;
    bar.innerHTML = '<span class="message-dot"></span><span>' + text + '</span>';

    // اگر پیام قبلی فعال است → پاک کنیم
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    // بعد 3 ثانیه پیام مخفی شود
    messageTimeout = setTimeout(function () {
        bar.className = "message-bar";
    }, 3000);
}



/* --------------------------------------------------
     🔷 نمایش توضیحات کامل محصول با alert (برای مبتدی!)
-------------------------------------------------- */

function showDetails(productName, description) {
    addDetailClickToStorage(productName);

    alert("توضیحات " + productName + ":\n\n" + (description || "توضیحی موجود نیست"));
}



/* --------------------------------------------------
                🔷 رندر کردن سبد خرید
-------------------------------------------------- */

/**
 * ------------------------------------------------------------
 *  تابع renderCart
 *  این تابع مسئول آپدیت کامل بخش سبد خرید در صفحه است.
 *  هر بار که آیتمی اضافه یا حذف می‌شود یا تعداد تغییر می‌کند،
 *  این تابع سبد را از نو می‌سازد و جمع کل را محاسبه می‌کند.
 * ------------------------------------------------------------
 */
function renderCart() {

    // گرفتن کانتینر اصلی سبد خرید (جایی که آیتم‌ها قرار می‌گیرند)
    var container = document.getElementById("cartItems");

    // گرفتن عنصر مربوط به نمایش جمع کل
    var totalEl = document.getElementById("cartTotal");

    // ابتدا همه محتویات قبلی سبد را پاک می‌کنیم تا دوباره از نو بسازیم
    container.innerHTML = "";

    // متغیر total برای جمع کل قیمت‌ها
    var total = 0;


    /* ============================================================
       🔹 مرحله اول: بررسی خالی بودن سبد خرید
       اگر هیچ آیتمی وجود نداشته باشد، پیام "سبد خرید خالی است" نمایش می‌دهیم
       و مقدار جمع کل را هم باید صفر کنیم.
    ============================================================= */
    if (!cartItems || cartItems.length === 0) {

        // ساخت یک div برای پیام
        var empty = document.createElement("div");
        empty.className = "cart-empty";
        empty.innerHTML = "سبد خرید خالی است.";

        container.appendChild(empty);

        // جمع کل باید صفر شود
        if (totalEl) {
            totalEl.textContent = "0";
        }

        // از تابع خارج می‌شویم چون چیزی برای نمایش نیست
        return;
    }



    /* ============================================================
       🔹 مرحله دوم: حلقه روی آیتم‌های سبد خرید
       هر آیتم شامل:
       - نام محصول
       - قیمت بدون تخفیف
       - قیمت با تخفیف
       - درصد تخفیف
       - تعداد
       - مجموع هر آیتم (تعداد × قیمت تخفیف‌خورده)
       و برای هرکدام یک ردیف HTML می‌سازیم.
    ============================================================= */

    var i;
    for (i = 0; i < cartItems.length; i++) {

        var item = cartItems[i];

        // حساب کردن مجموع قیمت این آیتم (تعداد × قیمت بعد از تخفیف)
        var lineTotal = item.discountPrice * item.quantity;

        // اضافه کردن به مجموع کل سبد
        total += lineTotal;


        /* ===============================
           ساخت ردیف اصلی هر آیتم در سبد
        ================================ */
        var row = document.createElement("div");
        row.className = "cart-item-row";


        /* -----------------------------------------
           ستون سمت چپ → اطلاعات محصول (نام + قیمت‌ها)
        ----------------------------------------- */
        var main = document.createElement("div");
        main.className = "cart-item-main";

        // نام محصول
        var nameEl = document.createElement("div");
        nameEl.className = "cart-item-name";
        nameEl.innerHTML = item.name;
        main.appendChild(nameEl);

        // اطلاعات قیمت‌ها
        var meta = document.createElement("div");
        meta.className = "cart-item-meta";

        // قیمت اصلی
        var spanBase = document.createElement("span");
        spanBase.innerHTML = "قیمت اصلی: " + formatNumber(item.basePrice);

        // قیمت بعد از تخفیف
        var spanDiscPrice = document.createElement("span");
        spanDiscPrice.innerHTML =
            "قیمت بعد از تخفیف: " + formatNumber(item.discountPrice);

        // درصد تخفیف
        var spanPercent = document.createElement("span");
        spanPercent.innerHTML = "تخفیف: " + item.discountPercent + "٪";

        // افزودن قطعات قیمت به meta
        meta.appendChild(spanBase);
        meta.appendChild(spanDiscPrice);
        meta.appendChild(spanPercent);

        // افزودن meta به ستون main
        main.appendChild(meta);



        /* -----------------------------------------
           ستون سمت راست → تعداد، مجموع، دکمه حذف
        ----------------------------------------- */
        var side = document.createElement("div");
        side.className = "cart-item-side";

        // تعداد
        var qtyEl = document.createElement("span");
        qtyEl.className = "cart-qty";
        qtyEl.innerHTML = "تعداد: " + item.quantity;

        // مجموع قیمت این آیتم
        var lineTotalEl = document.createElement("span");
        lineTotalEl.className = "cart-line-total";
        lineTotalEl.innerHTML =
            "مجموع: " + formatNumber(lineTotal) + " تومان";

        side.appendChild(qtyEl);
        side.appendChild(lineTotalEl);



        /* ===============================
           دکمه حذف هر آیتم (باClosure)
           توجه: این Closure باعث می‌شه هر دکمه
           درست محصول مربوط به خودش رو حذف کنه
        ================================ */
        var removeBtn = document.createElement("button");
        removeBtn.className = "cart-remove-btn";
        removeBtn.innerHTML = "حذف";

        // closure → جلوگیری از مشکل حلقه‌ها
        removeBtn.onclick = (function (name) {
            return function () {
                removeFromCart(name);
            };
        })(item.name);

        side.appendChild(removeBtn);



        /* ===============================
           اضافه کردن ستون‌ها به ردیف
        ================================ */
        row.appendChild(main);
        row.appendChild(side);

        // اضافه کردن ردیف به سبد خرید
        container.appendChild(row);
    }



    /* ============================================================
       🔹 مرحله سوم: به‌روزرسانی جمع کل در DOM
       حالا که total کامل محاسبه شده → نمایش می‌دهیم.
    ============================================================= */
    if (totalEl) {
        totalEl.textContent = formatNumber(total);
    }
}


/* --------------------------------------------------
              🔷 حذف محصول از سبد خرید
-------------------------------------------------- */

function removeFromCart(productName) {
    var i;

    // حذف آیتم از آرایه سبد خرید
    for (i = 0; i < cartItems.length; i++) {
        if (cartItems[i].name === productName) {
            cartItems.splice(i, 1);
            break;
        }
    }

    // ذخیره در localStorage
    saveCartToStorage();

    // ⚠ خواندن مجدد از localStorage برای Sync کامل
    loadCartFromStorage();

    // ⚠ اجرای رندر جدید برای آپدیت DOM
    renderCart();

    showMessage('"' + productName + '" از سبد خرید حذف شد.', "info");
}

/* --------------------------------------------------
                🔷 افزودن محصول به سبد خرید
-------------------------------------------------- */

function addToCart(productName) {
    var product = null;
    var i;

    // پیدا کردن محصول
    for (i = 0; i < products.length; i++) {
        if (products[i].name === productName) {
            product = products[i];
            break;
        }
    }

    if (!product) {
        showMessage("این محصول یافت نشد!", "info");
        return;
    }

    var basePrice = parseInt(product.price, 10) || 0;

    // درصد تخفیف
    var discountPercent = product.discountPercent || 0;

    // مبلغ تخفیف
    var discountAmount = Math.round(basePrice * discountPercent / 100);

    // قیمت نهایی بعد از تخفیف
    var discountPrice = basePrice - discountAmount;

    // آیا قبلاً در سبد بوده؟
    var found = false;

    for (i = 0; i < cartItems.length; i++) {
        if (cartItems[i].name === productName) {
            cartItems[i].quantity++;
            found = true;
            break;
        }
    }

    // اگر نبود → اضافه کنیم
    if (!found) {
        cartItems.push({
            name: productName,
            basePrice: basePrice,
            discountPrice: discountPrice,
            discountPercent: discountPercent,
            quantity: 1
        });
    }

    saveCartToStorage();
    renderCart();
    showMessage('"' + productName + '" به سبد اضافه شد.', "success");
}



/* --------------------------------------------------
        🔷 Closureهای ساخت هندلر دکمه‌ها
-------------------------------------------------- */

function makeDetailHandler(name, description) {
    // این تابع یک Closure است:
    // توابعی که به متغیرهای محیط خود دسترسی دائمی دارند
    return function () {
        showDetails(name, description);
    };
}

function makeAddToCartHandler(name) {
    return function () {
        addToCart(name);
    };
}



/* --------------------------------------------------
         🔷 ساخت کارت محصول برای نمایش در صفحه
-------------------------------------------------- */

function createProductCard(product) {
    var card = document.createElement("article");
    card.className = "product-card";

    // تصویر محصول
    var img = document.createElement("img");
    img.className = "product-image";
    img.src = product.image;
    img.alt = product.name;
    card.appendChild(img);

    // بخش اطلاعات
    var body = document.createElement("div");
    body.className = "product-body";

    // تاریخ به‌روزرسانی
    var meta = document.createElement("div");
    meta.className = "product-meta";
    meta.innerHTML = "به‌روزرسانی: " + (product.updatedAt || "");
    body.appendChild(meta);

    // عنوان
    var title = document.createElement("div");
    title.className = "product-title";
    title.innerHTML = product.name;
    body.appendChild(title);

    // نمایش چندکاراکتر اول توضیحات
    if (product.description) {
        var desc = document.createElement("div");
        desc.className = "product-desc";
        desc.innerHTML = truncateText(product.description, 80);
        body.appendChild(desc);
    }

    // بخش قیمت‌ها
    var priceRow = document.createElement("div");
    priceRow.className = "price-row";

    var basePrice = parseInt(product.price, 10) || 0;

    var original = document.createElement("div");
    var current = document.createElement("div");
    var discount = document.createElement("div");

    // اگر تخفیف وجود دارد
    if (discountEnabled && product.discountPrice) {
        original.className = "price-old";
        original.innerHTML = "تومان " + formatNumber(basePrice);

        current.className = "price-current";
        current.style.display = "block";
        current.innerHTML = "تومان " + formatNumber(product.discountPrice);

        discount.className = "price-discount";
        discount.style.display = "block";
        discount.innerHTML = "تخفیف " + product.discountPercent + "٪";
    } else {
        original.className = "price-original";
        original.innerHTML = "تومان " + formatNumber(basePrice);

        current.className = "price-current";
        current.style.display = "none";

        discount.className = "price-discount";
        discount.style.display = "none";
    }

    priceRow.appendChild(original);
    priceRow.appendChild(current);
    priceRow.appendChild(discount);
    body.appendChild(priceRow);

    // اضافه کردن body به کارت
    card.appendChild(body);

    // فوتر و دکمه‌ها
    var footer = document.createElement("div");
    footer.className = "product-footer";

    // دکمه توضیحات
    var btnDetails = document.createElement("button");
    btnDetails.className = "btn btn-secondary";

    btnDetails.innerHTML = "<span class='btn-icon'>✔</span><span>توضیحات</span>";
    btnDetails.onclick = makeDetailHandler(product.name, product.description);

    // دکمه خرید
    var btnBuy = document.createElement("button");
    btnBuy.className = "btn btn-primary";
    btnBuy.innerHTML = "<span class='btn-icon'>🛒</span><span>خرید</span>";
    btnBuy.onclick = makeAddToCartHandler(product.name);

    footer.appendChild(btnDetails);
    footer.appendChild(btnBuy);
    card.appendChild(footer);

    return card;
}



/* --------------------------------------------------
              🔷 صفحه‌بندی (نمایش محصولات)
-------------------------------------------------- */

function getTotalPages() {
    return Math.ceil(products.length / PRODUCTS_PER_PAGE);
}

function showPage(page) {
    var totalPages = getTotalPages();

    if (page < 1) page = totalPages;
    if (page > totalPages) page = 1;

    currentPage = page;

    var start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    var end = start + PRODUCTS_PER_PAGE;

    var grid = document.querySelector(".products-grid");
    grid.innerHTML = "";

    var i;
    for (i = start; i < end && i < products.length; i++) {
        grid.appendChild(createProductCard(products[i]));
    }

    // نمایش شماره صفحه
    document.getElementById("pageIndicator").innerHTML = "صفحه " + currentPage;

    // ثبت در localStorage
    addVisitedPageToStorage(currentPage);

    // ذخیره در کوکی
    logPageClickToCookie(currentPage);
}

function nextPage() {
    showPage(currentPage + 1);
}

function prevPage() {
    showPage(currentPage - 1);
}



/* --------------------------------------------------
             🔷 لود کردن محصولات از JSON
-------------------------------------------------- */

function loadProducts() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "products.json", true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {

            // اگر درخواست موفق بود
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);

                    if (Object.prototype.toString.call(data) === "[object Array]") {
                        products = data;
                    }
                } catch (e) {
                    console.error("خطا در خواندن JSON:", e);
                    products = [];
                }

                // تخفیف شانسی
                applyRandomDiscountsToProducts();

                // نمایش صفحه اول
                showPage(1);
            }
        }
    };

    xhr.send();
}



/* --------------------------------------------------
      🔷 رویداد اصلی DOMContentLoaded (Arrow Function)
-------------------------------------------------- */

// استفاده از arrow function طبق خواسته شما
document.addEventListener("DOMContentLoaded", () => {

    // اتصال دکمه‌های صفحه‌بندی
    document.getElementById("nextSlide").onclick = nextPage;
    document.getElementById("prevSlide").onclick = prevPage;

    // اتصال دکمه پرداخت
    document.getElementById("cartPayBtn").onclick = function () {
        if (!cartItems.length) {
            showMessage("سبد خرید خالی است.", "info");
        } else {
            showMessage("در حال انتقال به صفحه پرداخت...", "success");
        }
    };

    // لود سبد خرید از localStorage
    loadCartFromStorage();
    renderCart();

    // لود محصولات از فایل JSON
    loadProducts();
});