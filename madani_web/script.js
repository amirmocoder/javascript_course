var messageTimeout = null;
var currentPage = 1;
var PRODUCTS_PER_PAGE = 6;
var products = [];
var discountEnabled = false;
var cartItems = [];

// function to convert a int to a string in more readably formed
var formatNumber = function (num) {
    var str = String(num);
    var result = "";
    var count = 0;
    var i;

    for (i = str.length - 1; i >= 0; i--) {
        result = str.charAt(i) + result;
        count++;
        if (count === 3 && i !== 0) {
            result = "," + result;
            count = 0;
        }
    }
    return result;
};

// function to summarize the description for better UI
function truncateText(text, limit) {
    if (!text) {
        return "";
    }
    if (text.length <= limit) {
        return text;
    }
    return text.substring(0, limit) + "...";
}

// function to set a Cookie
function setCookie(name, value, days) {
    var d = new Date();

    // calcs expiration time in ms unit
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();

    // save Cookie
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

// function to get a Cookie using name
function getCookie(name) {
    var cname = name + "=";
    var decoded = document.cookie || "";
    var ca = decoded.split(";");

    var i;
    for (i = 0; i < ca.length; i++) {
        var c = ca[i];

        // strips string from left
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        
        //checks if Cookie starts with Cookie name
        if (c.indexOf(cname) === 0) {
            return decodeURIComponent(c.substring(cname.length, c.length));
        }
    }
    return "";
}

// function to store visited page in Cookie
function logPageClickToCookie(page) {
    var raw = getCookie("pageClicks");
    var arr = [];
    var i;

    if (raw) {
        arr = raw.split(",");
    }

    arr.push(String(page));

    setCookie("pageClicks", arr.join(","), 7);

    // prints a log in console to insure that Cookie is set
    console.log("Page clicks (saved in cookie):", arr.join(","));
}

// function to save cart into localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (e) {
        console.warn("خطا در ذخیره سبد خرید:", e);
    }
}

// function to load cart from localStorage
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

// function to store visited pages in localStorage
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

    if (arr.indexOf(page) === -1) {
        arr.push(page);
    }

    localStorage.setItem("visitedPages", JSON.stringify(arr));
    console.log("Page visited (localStorage):", page);
}


// function to store clicked detail buttons in localStorage
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

// callback function to operate for each product
function forEachProduct(callback) {
    // it possible to pass any function to callback parameter
    var i;
    for (i = 0; i < products.length; i++) {
        callback(products[i], i);
    }
}

// function to apply discount to products with 20% probability
function applyRandomDiscountsToProducts() {
    if (Math.random() > 0.2) {
        discountEnabled = false;
        return;
    }

    discountEnabled = true;

    // show the discount you won message on discountBar
    var db = document.getElementById("discountBar");
    if (db) {
        db.style.display = "flex";
        db.innerHTML =
            "تبریک! شما تخفیف بین ۱ تا ۳۰ درصدی روی محصولات دریافت کرده‌اید.";
        }

    // callback to iterate and apply discount to each product
    forEachProduct(function (p) {
        var basePrice = parseInt(p.price, 10);
        if (isNaN(basePrice)) {
            return;
        }

        var percent = Math.floor(Math.random() * 30) + 1;
        var discountAmount = Math.round(basePrice * percent / 100);
        var newPrice = basePrice - discountAmount;

        p.discountPercent = percent;
        p.discountPrice = newPrice;
    });
}

// function to show passed massage to user on top bar of page
function showMessage(text, type) {
    var bar = document.getElementById("messageBar");

    // create and set proper class name related on type
    var cls = "message-bar message-bar--visible ";
    cls += type === "success" ? "message-bar--success" : "message-bar--info";

    bar.className = cls;
    bar.innerHTML = '<span class="message-dot"></span><span>' + text + '</span>';

    // if already a message exists there clean it
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    // clear message after few seconds
    messageTimeout = setTimeout(function () {
        bar.className = "message-bar";
    }, 3000);
}

// shows an alert contains full description of product
function showDetails(productName, description) {
    addDetailClickToStorage(productName);

    alert("توضیحات " + productName + ":\n\n" + (description || "توضیحی موجود نیست"));
}

// function to render (update, set and present) list of shopping
function renderCart() {

    var container = document.getElementById("cartItems");
    var totalEl = document.getElementById("cartTotal");

    // clear the container if any things is there
    container.innerHTML = "";

    // to save sum of costs
    var total = 0;


    // first scenario is the shopping card is empty
    if (!cartItems || cartItems.length === 0) {

        var empty = document.createElement("div");
        empty.className = "cart-empty";
        empty.innerHTML = "سبد خرید خالی است.";
        container.appendChild(empty);

        if (totalEl) {
            totalEl.textContent = "0";
        }
        return;
    }

    // present items in the shopping list
    var i;
    for (i = 0; i < cartItems.length; i++) {

        var item = cartItems[i];
        var lineTotal = item.discountPrice * item.quantity;
        total += lineTotal;
        
        // create row for each item
        var row = document.createElement("div");
        row.className = "cart-item-row";

        var main = document.createElement("div");
        main.className = "cart-item-main";

        // show the name of item
        var nameEl = document.createElement("div");
        nameEl.className = "cart-item-name";
        nameEl.innerHTML = item.name;
        main.appendChild(nameEl);

        var meta = document.createElement("div");
        meta.className = "cart-item-meta";

        // show the main price of item
        var spanBase = document.createElement("span");
        spanBase.innerHTML = "قیمت اصلی: " + formatNumber(item.basePrice);

        // show the new price of item
        var spanDiscPrice = document.createElement("span");
        spanDiscPrice.innerHTML =
            "قیمت بعد از تخفیف: " + formatNumber(item.discountPrice);

        // show the discount percent of item
        var spanPercent = document.createElement("span");
        spanPercent.innerHTML = "تخفیف: " + item.discountPercent + "٪";

        meta.appendChild(spanBase);
        meta.appendChild(spanDiscPrice);
        meta.appendChild(spanPercent);
        main.appendChild(meta);


        var side = document.createElement("div");
        side.className = "cart-item-side";

        // show the quantities of item
        var qtyEl = document.createElement("span");
        qtyEl.className = "cart-qty";
        qtyEl.innerHTML = "تعداد: " + item.quantity;

        // show the total cost of item
        var lineTotalEl = document.createElement("span");
        lineTotalEl.className = "cart-line-total";
        lineTotalEl.innerHTML =
            "مجموع: " + formatNumber(lineTotal) + " تومان";

        side.appendChild(qtyEl);
        side.appendChild(lineTotalEl);

        // create item remove button
        var removeBtn = document.createElement("button");
        removeBtn.className = "cart-remove-btn";
        removeBtn.innerHTML = "حذف";

        // closure method has been used to remove item correctly
        removeBtn.onclick = (function (name) {
            return function () {
                removeFromCart(name);
            };
        })(item.name);

        side.appendChild(removeBtn);
        row.appendChild(main);
        row.appendChild(side);

        container.appendChild(row);
    }

    if (totalEl) {
        totalEl.textContent = formatNumber(total);
    }
}

// function to remove an item from shopping list
function removeFromCart(productName) {
    var i;
    for (i = 0; i < cartItems.length; i++) {
        if (cartItems[i].name === productName) {
            cartItems.splice(i, 1);
            break;
        }
    }
    
    // save changes in localStorage
    saveCartToStorage();
    loadCartFromStorage();

    renderCart();
    showMessage('"' + productName + '" از سبد خرید حذف شد.', "info");
}

// function to add item to shopping card
function addToCart(productName) {
    var product = null;
    var i;

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

    // get the discount percent of product
    var discountPercent = product.discountPercent || 0;

    // get the discount amount of product
    var discountAmount = Math.round(basePrice * discountPercent / 100);

    // get new price of product
    var discountPrice = basePrice - discountAmount;

    // checks if the product has already been on shopping card as an item
    var found = false;

    for (i = 0; i < cartItems.length; i++) {
        if (cartItems[i].name === productName) {
            cartItems[i].quantity++;
            found = true;
            break;
        }
    }
    // if does not
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


// function to handle show detail of each product correctly using closure method
function makeDetailHandler(name, description) {
    return function () {
        showDetails(name, description);
    };
}

// function to handle add item (product) to shopping its works for each product correctly using closure method
function makeAddToCartHandler(name) {
    return function () {
        addToCart(name);
    };
}

// function to create and present the card of product in pages
function createProductCard(product) {
    var card = document.createElement("article");
    card.className = "product-card";

    // prepare the image of product
    var img = document.createElement("img");
    img.className = "product-image";
    img.src = product.image;
    img.alt = product.name;
    card.appendChild(img);

    // prepare the information of product
    var body = document.createElement("div");
    body.className = "product-body";

    // prepare the last updated date of product
    var meta = document.createElement("div");
    meta.className = "product-meta";
    meta.innerHTML = "به‌روزرسانی: " + (product.updatedAt || "");
    body.appendChild(meta);

    // prepare the title or name of product
    var title = document.createElement("div");
    title.className = "product-title";
    title.innerHTML = product.name;
    body.appendChild(title);

    // prepare the summarized detail of product
    if (product.description) {
        var desc = document.createElement("div");
        desc.className = "product-desc";
        desc.innerHTML = truncateText(product.description, 80);
        body.appendChild(desc);
    }

    // prepare the price of product
    var priceRow = document.createElement("div");
    priceRow.className = "price-row";

    var basePrice = parseInt(product.price, 10) || 0;

    var original = document.createElement("div");
    var current = document.createElement("div");
    var discount = document.createElement("div");

    // if discount has been enabled on page
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

    card.appendChild(body);

    var footer = document.createElement("div");
    footer.className = "product-footer";

    // prepare the detail button of product
    var btnDetails = document.createElement("button");
    btnDetails.className = "btn btn-secondary";

    btnDetails.innerHTML = "<span class='btn-icon'>✔</span><span>توضیحات</span>";
    btnDetails.onclick = makeDetailHandler(product.name, product.description);

    // prepare the buy item button of product
    var btnBuy = document.createElement("button");
    btnBuy.className = "btn btn-primary";
    btnBuy.innerHTML = "<span class='btn-icon'>🛒</span><span>خرید</span>";
    btnBuy.onclick = makeAddToCartHandler(product.name);

    footer.appendChild(btnDetails);
    footer.appendChild(btnBuy);
    card.appendChild(footer);

    return card;
}

function getTotalPages() {
    return Math.ceil(products.length / PRODUCTS_PER_PAGE);
}

// functions to handel paging of products
function showPage(page) {
    currentPage = page;

    // to set start and end index of loading products on related page
    var start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    var end = start + PRODUCTS_PER_PAGE;

    var grid = document.querySelector(".products-grid");
    grid.innerHTML = "";

    var i;
    for (i = start; i < end && i < products.length; i++) {
        grid.appendChild(createProductCard(products[i]));
    }

    // show the new page number
    document.getElementById("pageIndicator").innerHTML = "صفحه " + currentPage;

    addVisitedPageToStorage(currentPage);
    logPageClickToCookie(currentPage);
}

// function to go to the next page
function nextPage() {
    var lastPagesIndex = getTotalPages();
    var nextPageIndex = currentPage + 1
    if (nextPageIndex > lastPagesIndex){
        return
    } else{
        showPage(nextPageIndex);
    }
}

// function to go to the pervious page
function prevPage() {
    var prevPageIndex = currentPage - 1
    if (prevPageIndex <= 0){
        return
    } else{
        showPage(prevPageIndex);
    }
}

// function to load products from source json file
function loadProducts() {
    var xhr = new XMLHttpRequest();

    // send get request to source json file asyncly
    xhr.open("GET", "products.json", true);

    // set an event on readystate value changing
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {

            // if request was successful
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
                
                // call the random discount function
                applyRandomDiscountsToProducts();

                // show the first page of product at first load
                showPage(1);
            }
        }
    };

    xhr.send();
}

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("nextSlide").onclick = nextPage;
    document.getElementById("prevSlide").onclick = prevPage;

    // handel pay button actions
    document.getElementById("cartPayBtn").onclick = function () {
        if (!cartItems.length) {
            showMessage("سبد خرید خالی است.", "info");
        } else {
            showMessage("در حال انتقال به صفحه پرداخت...", "success");
        }
    };

    loadCartFromStorage();
    renderCart();
    
    loadProducts();
});