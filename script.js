document.addEventListener('DOMContentLoaded', function() {
    const startScannerBtn = document.getElementById('startScanner');
    const stopScannerBtn = document.getElementById('stopScanner');
    const scannerContainer = document.getElementById('scanner-container');
    const barcodeInput = document.getElementById('barcode');
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const addProductBtn = document.getElementById('addProduct');
    const invoiceItems = document.getElementById('invoice-items');
    const totalAmount = document.getElementById('total-amount');
    const completeSaleBtn = document.getElementById('completeSale');
    const printReportBtn = document.getElementById('printReport');

    let scannerActive = false;
    let currentInvoice = [];
    let total = 0;

    // بدء الماسح الضوئي
    startScannerBtn.addEventListener('click', function() {
        scannerContainer.style.display = 'block';
        startScannerBtn.style.display = 'none';
        initScanner();
    });

    // إيقاف الماسح الضوئي
    stopScannerBtn.addEventListener('click', function() {
        scannerContainer.style.display = 'none';
        startScannerBtn.style.display = 'block';
        Quagga.stop();
    });

    // إضافة منتج
    addProductBtn.addEventListener('click', function() {
        const barcode = barcodeInput.value;
        const name = productNameInput.value;
        const price = parseFloat(productPriceInput.value);

        if (!barcode || !name || isNaN(price)) {
            alert('الرجاء إدخال جميع بيانات المنتج');
            return;
        }

        // إضافة المنتج إلى قاعدة البيانات (سيتم تنفيذ هذا لاحقًا)
        addProductToDatabase(barcode, name, price);

        // إضافة المنتج إلى الفاتورة الحالية
        addToInvoice(barcode, name, price);

        // مسح الحقول
        barcodeInput.value = '';
        productNameInput.value = '';
        productPriceInput.value = '';
    });

    // إتمام عملية البيع
    completeSaleBtn.addEventListener('click', function() {
        if (currentInvoice.length === 0) {
            alert('لا توجد عناصر في الفاتورة');
            return;
        }

        // حفظ الفاتورة في قاعدة البيانات (سيتم تنفيذ هذا لاحقًا)
        saveInvoice(currentInvoice, total);

        // إعادة تعيين الفاتورة
        currentInvoice = [];
        total = 0;
        updateInvoiceDisplay();
        alert('تم إتمام عملية البيع بنجاح');
    });

    // طباعة التقرير
    printReportBtn.addEventListener('click', function() {
        // جلب التقارير من قاعدة البيانات (سيتم تنفيذ هذا لاحقًا)
        generateReport();
    });

    function initScanner() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive'),
                constraints: {
                    width: 480,
                    height: 320,
                    facingMode: "environment"
                },
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader"]
            },
        }, function(err) {
            if (err) {
                console.error(err);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            barcodeInput.value = code;
            Quagga.stop();
            scannerContainer.style.display = 'none';
            startScannerBtn.style.display = 'block';

            // البحث عن المنتج في قاعدة البيانات
            findProduct(code);
        });
    }

    function findProduct(barcode) {
        // سيتم تنفيذ هذا لاحقًا للاتصال بالخادم
        fetch(`/api/products/${barcode}`)
            .then(response => response.json())
            .then(product => {
                if (product) {
                    // المنتج موجود، إضافته إلى الفاتورة
                    addToInvoice(product.barcode, product.name, product.price);
                } else {
                    // المنتج غير موجود، السماح للمستخدم بإدخال بياناته
                    productNameInput.focus();
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function addToInvoice(barcode, name, price) {
        currentInvoice.push({ barcode, name, price, quantity: 1 });
        total += price;
        updateInvoiceDisplay();
    }

    function updateInvoiceDisplay() {
        invoiceItems.innerHTML = '';
        currentInvoice.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'invoice-item';
            itemElement.innerHTML = `
                <span>${item.name}</span>
                <span>${item.quantity} × ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}</span>
            `;
            invoiceItems.appendChild(itemElement);
        });

        totalAmount.textContent = total.toFixed(2);
    }

    // هذه الدوال سيتم تنفيذها لاحقًا عند ربطها بالخادم
    function addProductToDatabase(barcode, name, price) {
        console.log('Adding product to database:', { barcode, name, price });
        // سيتم تنفيذ هذا لاحقًا
    }

    function saveInvoice(items, total) {
        console.log('Saving invoice:', { items, total });
        // سيتم تنفيذ هذا لاحقًا
    }

    function generateReport() {
        console.log('Generating report');
        // سيتم تنفيذ هذا لاحقًا
    }
});
