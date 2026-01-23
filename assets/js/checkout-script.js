$(document).ready(function () {

  $('#menu').click(function () {
    $(this).toggleClass('fa-times');
    $('.navbar').toggleClass('nav-toggle');
  });

  $(window).on('scroll load', function () {
    $('#menu').removeClass('fa-times');
    $('.navbar').removeClass('nav-toggle');

    if (window.scrollY > 60) {
      document.querySelector('#scroll-top').classList.add('active');
    } else {
      document.querySelector('#scroll-top').classList.remove('active');
    }
  });

  // smooth scrolling
  $('a[href*="#"]').on('click', function (e) {
    const href = $(this).attr('href');
    const targetElement = $(href);

    if (targetElement.length) {
      e.preventDefault();
      $('html, body').animate({
        scrollTop: targetElement.offset().top,
      }, 500, 'linear');
    }
  });

  loadCheckoutData();
});

function getCourseIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get('id')) || null;
}

function loadCheckoutData() {
  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    window.location.href = '/courses';
    return;
  }

  fetch('/courses/courses.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(courses => {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        displayCheckoutData(course);
      } else {
        window.location.href = '/courses';
      }
    })
    .catch(error => {
      console.error('Error loading course:', error);
      window.location.href = '/courses';
    });
}

function displayCheckoutData(course) {
  // Store course data for later use
  window.currentCourseForPayment = course;

  // Update page title
  document.title = `Checkout: ${course.name} | Design Byte`;

  // Populate order summary
  document.getElementById('courseSummaryImage').src = course.image;
  document.getElementById('courseSummaryName').textContent = course.name;
  document.getElementById('courseSummaryInstructor').textContent = course.instructor;
  document.getElementById('courseSummaryDuration').textContent = course.duration;
  document.getElementById('summaryPrice').textContent = course.price;
  document.getElementById('summaryTotal').textContent = course.price;
}

// Store current payment context
let currentPaymentGateway = null;

// Select payment gateway and show customer form
function selectPaymentGateway(gateway) {
  if (!window.currentCourseForPayment) {
    showPaymentStatus('error', 'Course Not Found', 'Course information was not found. Please try again.');
    return;
  }

  currentPaymentGateway = gateway;
  showCustomerDetailsForm();
}

// Show gateway selection view
function showGatewaySelection() {
  document.getElementById('gatewaySelectionView').style.display = 'block';
  document.getElementById('customerDetailsView').style.display = 'none';
}

// Show customer details form
function showCustomerDetailsForm() {
  document.getElementById('gatewaySelectionView').style.display = 'none';
  document.getElementById('customerDetailsView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Back to gateway selection
function backToGatewaySelection() {
  showGatewaySelection();
  document.getElementById('customerForm').reset();
  clearFormErrors();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Clear form error messages
function clearFormErrors() {
  document.getElementById('nameError').textContent = '';
  document.getElementById('emailError').textContent = '';
  document.getElementById('phoneError').textContent = '';
}

// Validate customer form
function validateCustomerForm() {
  clearFormErrors();
  const name = document.getElementById('customerName').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  let isValid = true;

  if (!name || name.length < 3) {
    document.getElementById('nameError').textContent = 'Please enter a valid name (minimum 3 characters)';
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email address';
    isValid = false;
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phone || !phoneRegex.test(phone)) {
    document.getElementById('phoneError').textContent = 'Please enter a valid 10-digit phone number';
    isValid = false;
  }

  return isValid;
}

// Get customer details from form
function getCustomerDetailsFromForm() {
  return {
    name: document.getElementById('customerName').value.trim(),
    email: document.getElementById('customerEmail').value.trim(),
    phone: document.getElementById('customerPhone').value.trim()
  };
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('customerForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (validateCustomerForm()) {
        const customerDetails = getCustomerDetailsFromForm();
        proceedToPaymentGateway(customerDetails);
      }
    });
  }
});

// Proceed to payment gateway with customer details
async function proceedToPaymentGateway(customerDetails) {
  if (!window.currentCourseForPayment || !currentPaymentGateway) {
    showPaymentStatus('error', 'Payment Error', 'Payment initialization failed. Please try again.');
    return;
  }

  try {
    showPaymentStatus('pending', 'Processing Payment', 'Please wait while we initialize your payment...');

    // Get course price
    const priceText = window.currentCourseForPayment.price;
    const amount = parseFloat(priceText.replace('₹', '').trim());

    // Store for later verification
    localStorage.setItem('current_amount', amount);
    localStorage.setItem('current_customer_email', customerDetails.email);

    // Call backend API to create order
    const response = await fetch('http://localhost:5000/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        gateway: currentPaymentGateway,
        customer: customerDetails,
        description: `Payment for ${window.currentCourseForPayment.name}`
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    // Handle different gateways
    handleGatewayPayment(currentPaymentGateway, data.order, amount, customerDetails);

  } catch (error) {
    console.error('Payment error:', error);
    showPaymentStatus('error', 'Payment Initialization Failed', error.message);
  }
}

function handleGatewayPayment(gateway, order, amount, customer) {
  switch(gateway) {
    case 'razorpay':
      handleRazorpayPayment(order, amount, customer);
      break;
    case 'phonepe':
      handlePhonePePayment(order);
      break;
    case 'cashfree':
      handleCashfreePayment(order);
      break;
  }
}

function handleRazorpayPayment(order, amount, customer) {
  // Load Razorpay script if not loaded
  if (!window.Razorpay) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => openRazorpayCheckout(order, amount, customer);
    document.head.appendChild(script);
  } else {
    openRazorpayCheckout(order, amount, customer);
  }
}

function openRazorpayCheckout(order, amount, customer) {
  const options = {
    key: order.razorpayKey,
    amount: order.amount,
    currency: 'INR',
    order_id: order.orderId,
    customer_details: {
      name: customer.name,
      email: customer.email,
      contact: customer.phone
    },
    handler: async function(response) {
      await verifyRazorpayPayment(order.orderId, response.razorpay_payment_id, response.razorpay_signature);
    },
    prefill: {
      name: customer.name,
      email: customer.email,
      contact: customer.phone
    },
    theme: {
      color: '#2b3dda'
    },
    modal: {
      ondismiss: function() {
        console.log('Payment modal closed');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

async function verifyRazorpayPayment(orderId, paymentId, signature) {
  try {
    showPaymentStatus('pending', 'Processing Payment', 'Please wait while we confirm your payment...');

    const response = await fetch('http://localhost:5000/api/payment/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gateway: 'razorpay',
        orderId: orderId,
        paymentId: paymentId,
        signature: signature
      })
    });

    const data = await response.json();

    if (data.success) {
      showPaymentSuccess('Razorpay', data);
    } else {
      showPaymentStatus('error', 'Payment Verification Failed', data.error || 'Please contact support if the issue persists.');
    }
  } catch (error) {
    console.error('Verification error:', error);
    showPaymentStatus('error', 'Payment Verification Failed', 'An error occurred during verification. Please contact support.');
  }
}

function handlePhonePePayment(order) {
  if (order.redirectUrl) {
    // Store transaction ID for later verification
    localStorage.setItem('phonepe_transaction_id', order.transactionId);
    localStorage.setItem('phonepe_amount', localStorage.getItem('current_amount'));
    localStorage.setItem('phonepe_order_id', order.orderId);
    localStorage.setItem('payment_gateway', 'phonepe');

    // Redirect to PhonePe - backend will handle return_url callback
    window.location.href = order.redirectUrl;
  } else {
    showPaymentStatus('error', 'Payment Gateway Error', 'Failed to initialize PhonePe payment. Please try again.');
  }
}

function handleCashfreePayment(order) {
  if (order.paymentLink) {
    // Store order ID for later verification
    localStorage.setItem('cashfree_order_id', order.orderId);
    localStorage.setItem('payment_gateway', 'cashfree');

    // Redirect to Cashfree - backend will handle return_url callback
    window.location.href = order.paymentLink;
  } else {
    showPaymentStatus('error', 'Payment Gateway Error', 'Failed to initialize Cashfree payment. Please try again.');
  }
}

// Show payment status modal
function showPaymentStatus(type, title, message, details = null) {
  const overlay = document.getElementById('paymentStatusOverlay');
  const statusContent = document.getElementById('statusContent');

  let html = '<div class="status-header">';

  if (type === 'success') {
    html += '<div class="status-icon success">✓</div>';
  } else if (type === 'error') {
    html += '<div class="status-icon error">✕</div>';
  } else if (type === 'pending') {
    html += '<div class="status-spinner"></div>';
  }

  html += `
    <h2 class="status-title">${title}</h2>
    <p class="status-message">${message}</p>
  `;

  if (details) {
    html += '<div class="status-details">';
    Object.entries(details).forEach(([key, value]) => {
      html += `
        <div class="status-detail-item">
          <span class="status-detail-label">${key}:</span>
          <span class="status-detail-value">${value}</span>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '<div class="status-actions">';

  if (type === 'success') {
    html += `
      <button class="btn-status-action btn-status-primary" onclick="window.location.href='/courses'">
        Back to Courses
      </button>
    `;
  } else if (type === 'error') {
    html += `
      <button class="btn-status-action btn-status-primary" onclick="closePaymentStatus()">
        Try Again
      </button>
      <button class="btn-status-action btn-status-secondary" onclick="window.location.href='/courses'">
        Back to Courses
      </button>
    `;
  } else if (type === 'pending') {
    html += '<p style="color: #666; font-size: 1.4rem; margin-top: 1rem;">This may take a few moments...</p>';
  }

  html += '</div></div>';

  statusContent.innerHTML = html;
  overlay.classList.add('active');
}

function closePaymentStatus() {
  const overlay = document.getElementById('paymentStatusOverlay');
  overlay.classList.remove('active');
  showGatewaySelection();
}

function showPaymentSuccess(gateway, paymentData) {
  const details = {
    'Gateway': gateway,
    'Amount': `₹${paymentData.amount}`,
    'Status': paymentData.status
  };

  showPaymentStatus('success', 'Payment Successful!',
    'Your payment has been confirmed. You will be enrolled in the course shortly. Check your email for further instructions.',
    details);

  // Redirect to courses page after 3 seconds
  setTimeout(() => {
    window.location.href = '/courses';
  }, 3000);
}

// Disable developer mode
document.onkeydown = function (e) {
  if (e.keyCode == 123) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
    return false;
  }
}
