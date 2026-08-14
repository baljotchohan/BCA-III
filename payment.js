/**
 * BCA III Hub — Razorpay Payment & Subscription Module
 * Pricing Architecture:
 * - Free Plan (₹0): Full access to all notes, lectures, syllabus, and announcements for Unit 1 across all subjects.
 * - Pro Scholar (₹19 / month): Full access to ALL Units (I, II, III, IV), all notes, and site features for 30 days.
 * - Max Lifetime (₹49 permanent): Lifetime permanent access to all notes, all units, and all future updates.
 * - Single Note Unlock (₹15): Permanent access to a single note.
 */

window.BCA3_PAYMENTS = {
  // Live Razorpay Key ID
  testKeyId: 'rzp_live_TOvSIy2L3J3ply',

  /**
   * Helper to check if a note belongs to Unit 1 / Unit I
   */
  isUnitOne: function (note) {
    if (!note) return false;
    const unitStr = String(note.unit || note.unitNumber || note.unitId || '').trim().toLowerCase();
    if (!unitStr) return true; // Default if unspecified
    return (
      unitStr === 'unit i' ||
      unitStr === 'unit 1' ||
      unitStr === 'unit-1' ||
      unitStr === 'unit_1' ||
      unitStr === 'unit1' ||
      unitStr === '1' ||
      unitStr === 'i' ||
      unitStr.startsWith('unit 1') ||
      unitStr.startsWith('unit i ') ||
      unitStr === 'general'
    );
  },

  /**
   * Check if current user has access to a given note
   * Returns: { hasAccess: boolean, reason: string, message?: string }
   */
  hasNoteAccess: function (noteOrId, indexInSubject = 0) {
    // 1. Admin always has full access (strictly verified via authenticated admin email)
    const adminEmails = ['baljotchohan23@gmail.com', 'mehakpreetkaur@gmail.com', 'mehakpreetsaini26@gmail.com'];
    const isAdmin = Boolean(
      currentUserProfile &&
      currentUserProfile.email &&
      adminEmails.includes(String(currentUserProfile.email).toLowerCase())
    );
    if (isAdmin) {
      return { hasAccess: true, reason: 'admin' };
    }

    // Resolve note object if an ID or string was passed
    let note = null;
    if (typeof noteOrId === 'object' && noteOrId !== null) {
      note = noteOrId;
    } else if (typeof _currentSubjectNotes !== 'undefined' && Array.isArray(_currentSubjectNotes)) {
      note = _currentSubjectNotes.find(n => (n.fbKey === noteOrId || n.id === noteOrId));
    } else if (typeof _notes !== 'undefined' && Array.isArray(_notes)) {
      note = _notes.find(n => (n.fbKey === noteOrId || n.id === noteOrId));
    }

    const noteId = (note && (note.fbKey || note.id)) || (typeof noteOrId === 'string' ? noteOrId : '');

    // 2. Individual note purchase check
    if (currentUserProfile && currentUserProfile.purchasedNotes && noteId && currentUserProfile.purchasedNotes[noteId]) {
      return { hasAccess: true, reason: 'purchased' };
    }

    // 3. User subscription check (Pro / Max)
    if (currentUserProfile && currentUserProfile.subscription) {
      const sub = currentUserProfile.subscription;
      if (sub.status === 'active' || !sub.status) {
        if (sub.plan === 'max') {
          return { hasAccess: true, reason: 'max_lifetime' };
        }
        if (sub.plan === 'pro' || sub.plan === 'plus') {
          const isNotExpired = !sub.validUntil || sub.validUntil > Date.now();
          if (isNotExpired) {
            return { hasAccess: true, reason: 'pro_active' };
          }
        }
      }
    }

    // 4. Guest / Non-logged-in User
    const isGuest = !currentUserProfile || !currentUserProfile.uid || String(currentUserProfile.uid).startsWith('guest_');
    if (isGuest) {
      // 1st note in Unit 1 is free preview for guests
      if (indexInSubject === 0 && (!note || this.isUnitOne(note))) {
        return { hasAccess: true, reason: 'guest_preview' };
      }
      return {
        hasAccess: false,
        reason: 'requires_signin',
        message: 'Sign in with Google to unlock all Unit 1 notes for free!'
      };
    }

    // 5. Logged-in User on Free Plan:
    // Full access to all Unit 1 notes across all subjects
    if (note && this.isUnitOne(note)) {
      return { hasAccess: true, reason: 'free_unit_1' };
    }

    if (indexInSubject === 0 && (!note || !note.unit)) {
      return { hasAccess: true, reason: 'free_unit_1' };
    }

    // 6. Unit 2, 3, 4 require Pro (₹19) or Max (₹49)
    return {
      hasAccess: false,
      reason: 'requires_upgrade',
      message: 'Upgrade to Pro (₹19/mo) or Max Lifetime (₹49) to unlock Units II, III & IV!'
    };
  },

  /**
   * Load Razorpay Checkout SDK dynamically if not loaded yet
   */
  ensureRazorpaySDK: function () {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  },

  /**
   * Purchase a single note (₹15)
   */
  payForSingleNote: async function (noteId, noteTitle, priceInRs = 15) {
    if (!currentUserProfile || !currentUserProfile.uid || currentUserProfile.uid.startsWith('guest_')) {
      if (typeof handleAuthAction === 'function') handleAuthAction();
      else if (typeof showToast === 'function') showToast('Please sign in first to purchase notes.');
      return;
    }

    try {
      await this.ensureRazorpaySDK();

      if (typeof showToast === 'function') showToast(`Preparing checkout for ${noteTitle}...`, 'info');

      let orderData = null;
      try {
        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceInRs,
            itemType: 'single_note',
            itemId: noteId,
            uid: currentUserProfile.uid
          })
        });
        if (response.ok) {
          orderData = await response.json();
        }
      } catch (netErr) {
        console.warn('Backend order creation note:', netErr);
      }

      const amountInPaise = (orderData && orderData.amount) ? orderData.amount : Math.round(priceInRs * 100);

      const options = {
        key: (orderData && orderData.keyId) || this.testKeyId,
        amount: amountInPaise,
        currency: 'INR',
        name: 'BCA III Hub Notes',
        description: `Unlock Note: ${noteTitle}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: (orderData && orderData.orderId) ? orderData.orderId : undefined,
        prefill: {
          name: currentUserProfile.name || '',
          email: currentUserProfile.email || ''
        },
        theme: {
          color: '#c25e3e' // Anthropic warm coral theme
        },
        handler: async function (paymentResponse) {
          try {
            if (typeof showToast === 'function') showToast('⏳ Verifying payment with secure server...', 'info');

            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                uid: (currentUserProfile && currentUserProfile.uid) || 'anonymous',
                itemType: 'single_note',
                itemId: noteId
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }

            if (typeof showToast === 'function') showToast('🎉 Payment verified! Unlocking note...', 'success');

            if (!currentUserProfile) currentUserProfile = { uid: 'user_' + Date.now(), name: 'Student' };
            if (!currentUserProfile.purchasedNotes) currentUserProfile.purchasedNotes = {};
            currentUserProfile.purchasedNotes[noteId] = {
              purchasedAt: Date.now(),
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              verified: true
            };
            localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));

            if (typeof renderSubjectNotes === 'function' && typeof activeSubjectId !== 'undefined' && activeSubjectId) {
              const subjectIndex = (typeof BCA_3RD_SEM_DATA !== 'undefined' && BCA_3RD_SEM_DATA.subjects) ? BCA_3RD_SEM_DATA.subjects : [];
              const subject = subjectIndex.find(s => s.id === activeSubjectId);
              if (subject) renderSubjectNotes(subject);
            }

            if (typeof openNoteReaderView === 'function') {
              openNoteReaderView(noteId);
            }

          } catch (err) {
            console.error('Payment handler error:', err);
            if (typeof showToast === 'function') showToast('❌ Verification error: ' + err.message, 'error');
          }
        },
        modal: {
          ondismiss: function () {
            if (typeof showToast === 'function') showToast('Payment cancelled', 'info');
          }
        }
      };

      const rzpInstance = new Razorpay(options);

      // Handle failed payment events from Razorpay
      rzpInstance.on('payment.failed', function (response) {
        console.warn('Razorpay Single Note Payment Failed:', response.error);
        const errMsg = response.error ? (response.error.description || response.error.reason || 'Payment failed') : 'Payment declined';
        if (typeof showToast === 'function') {
          showToast(`❌ Payment failed: ${errMsg}. No amount was deducted.`, 'error');
        }
      });

      rzpInstance.open();

    } catch (err) {
      console.error('Single note checkout error:', err);
      if (typeof showToast === 'function') showToast('Checkout error: ' + err.message);
    }
  },

  /**
   * Subscribe to Pro (₹19 / mo) or Max Lifetime (₹49 permanent)
   */
  payForSubscription: async function (planTier, planName, priceInRs) {
    try {
      await this.ensureRazorpaySDK();

      if (typeof Razorpay === 'undefined') {
        if (typeof showToast === 'function') {
          showToast('Payment gateway is initializing. Please retry in a moment.', 'info');
        } else {
          alert('Razorpay Payment Gateway SDK is loading. Please check your internet connection and try again.');
        }
        return;
      }

      if (!currentUserProfile || !currentUserProfile.uid || String(currentUserProfile.uid).startsWith('guest_')) {
        if (typeof openProfileModal === 'function') {
          openProfileModal();
          if (typeof showToast === 'function') {
            showToast('Please sign in with Google first before purchasing a study pass', 'info');
          }
        }
        return;
      }

      if (typeof showToast === 'function') {
        showToast(`Initiating secure checkout for ${planName} (₹${priceInRs})...`, 'info');
      }

      let orderData = null;
      try {
        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceInRs,
            itemType: 'subscription',
            planTier: planTier,
            uid: currentUserProfile.uid
          })
        });
        if (response.ok) {
          orderData = await response.json();
        }
      } catch (netErr) {
        console.warn('Backend order creation notice:', netErr);
      }

      const amountInPaise = (orderData && orderData.amount) ? orderData.amount : Math.round(priceInRs * 100);

      const options = {
        key: (orderData && orderData.keyId) || this.testKeyId,
        amount: amountInPaise,
        currency: 'INR',
        name: 'BCA III Hub Study Pass',
        description: `${planName} — Full PU Syllabus Unlocked`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: (orderData && orderData.orderId) ? orderData.orderId : undefined,
        prefill: {
          name: currentUserProfile.name || '',
          email: currentUserProfile.email || ''
        },
        theme: {
          color: planTier === 'max' ? '#ea580c' : '#7c3aed'
        },
        handler: async function (paymentResponse) {
          try {
            if (typeof showToast === 'function') showToast('⏳ Verifying subscription with secure server...', 'info');

            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                uid: (currentUserProfile && currentUserProfile.uid) || 'anonymous',
                itemType: 'subscription',
                planTier: planTier
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }

            const now = Date.now();
            let durationDays = 30;
            if (planTier === 'max') durationDays = 3650; // Lifetime 10 years

            const subData = {
              plan: planTier,
              status: 'active',
              activatedAt: now,
              validUntil: now + durationDays * 24 * 60 * 60 * 1000,
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              verified: true
            };

            if (!currentUserProfile) {
              currentUserProfile = { uid: 'user_' + Date.now(), name: 'Student' };
            }
            currentUserProfile.subscription = subData;
            localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));

            if (typeof showToast === 'function') {
              showToast(`🎉 ${planName} Activated! All notes & features unlocked!`, 'success');
            }

            window.BCA3_PAYMENTS.closePricingModal();

            if (typeof renderSubjectNotes === 'function' && typeof activeSubjectId !== 'undefined' && activeSubjectId) {
              const subjectIndex = (typeof BCA_3RD_SEM_DATA !== 'undefined' && BCA_3RD_SEM_DATA.subjects) ? BCA_3RD_SEM_DATA.subjects : [];
              const subject = subjectIndex.find(s => s.id === activeSubjectId);
              if (subject) renderSubjectNotes(subject);
            }

            if (typeof updateProfileUI === 'function') updateProfileUI();
            if (typeof updateAdminHeaderUI === 'function') updateAdminHeaderUI();

          } catch (err) {
            console.error('Subscription payment handler error:', err);
            if (typeof showToast === 'function') showToast('❌ Verification error: ' + err.message, 'error');
          }
        },
        modal: {
          ondismiss: function () {
            if (typeof showToast === 'function') showToast('Payment checkout cancelled', 'info');
          }
        }
      };

      const rzpInstance = new Razorpay(options);

      // Handle failed payment events from Razorpay
      rzpInstance.on('payment.failed', function (response) {
        console.warn('Razorpay Subscription Payment Failed:', response.error);
        const errMsg = response.error ? (response.error.description || response.error.reason || 'Payment failed') : 'Transaction declined';
        if (typeof showToast === 'function') {
          showToast(`❌ Payment failed: ${errMsg}. No money was charged.`, 'error');
        }
      });

      rzpInstance.open();

    } catch (err) {
      console.error('Subscription checkout error:', err);
      if (typeof showToast === 'function') showToast('Checkout error: ' + err.message);
    }
  },

  /**
   * 📧 Request Refund or Billing Assistance
   */
  requestRefundOrSupport: function () {
    const prof = currentUserProfile || {};
    const sub = prof.subscription || {};
    const email = prof.email || 'N/A';
    const uid = prof.uid || 'N/A';
    const payId = sub.paymentId || 'N/A';
    const orderId = sub.orderId || 'N/A';
    const plan = (sub.plan || 'pro').toUpperCase();

    const subject = encodeURIComponent(`[BCA III Hub] Refund / Payment Support Request - ${payId}`);
    const body = encodeURIComponent(
      `Hi Baljot / Admin Team,\n\nI need help regarding my BCA III Hub subscription / payment.\n\nDetails:\n- Student Name: ${prof.name || 'Scholar'}\n- Email: ${email}\n- User UID: ${uid}\n- Plan: ${plan}\n- Payment ID: ${payId}\n- Order ID: ${orderId}\n\nReason for refund/query:\n[Please write your reason here]\n\nThank you!`
    );

    window.open(`mailto:baljotchohan23@gmail.com?cc=chohanjatt07@gmail.com&subject=${subject}&body=${body}`, '_blank');
    if (typeof showToast === 'function') {
      showToast('📧 Opening email client with your payment reference pre-filled...', 'info');
    }
  },

  openPricingModal: function () {
    const modal = document.getElementById('pricingModal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.updatePricingModalUI();
    }
  },

  closePricingModal: function () {
    const modal = document.getElementById('pricingModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  },

  updatePricingModalUI: function () {
    const sub = currentUserProfile && currentUserProfile.subscription ? currentUserProfile.subscription : null;
    let activePlan = 'free';
    if (sub && (sub.status === 'active' || !sub.status)) {
      if (sub.plan === 'max') {
        activePlan = 'max';
      } else if (sub.plan === 'pro' || sub.plan === 'plus') {
        if (!sub.validUntil || sub.validUntil > Date.now()) {
          activePlan = 'pro';
        }
      }
    }

    const isAdmin = Boolean(
      currentUserProfile &&
      currentUserProfile.email &&
      ['baljotchohan23@gmail.com', 'mehakpreetkaur@gmail.com', 'mehakpreetsaini26@gmail.com'].includes(String(currentUserProfile.email).toLowerCase())
    );

    const btnFree = document.getElementById('plan-btn-free');
    const cardFree = document.getElementById('plan-card-free');
    const btnPro = document.querySelector('#plan-card-pro .plan-btn');
    const cardPro = document.getElementById('plan-card-pro');
    const btnMax = document.querySelector('#plan-card-max .plan-btn');
    const cardMax = document.getElementById('plan-card-max');

    if (cardFree) {
      cardFree.style.borderColor = (activePlan === 'free' && !isAdmin) ? 'rgba(255,255,255,0.4)' : '';
      cardFree.style.boxShadow = (activePlan === 'free' && !isAdmin) ? '0 0 20px rgba(255,255,255,0.1)' : '';
    }
    if (btnFree) {
      btnFree.innerHTML = (activePlan === 'free' && !isAdmin) ? '✅ Active Free Plan' : 'Free Tier (Unit 1)';
      btnFree.onclick = () => this.closePricingModal();
    }

    if (cardPro) {
      cardPro.style.borderColor = (activePlan === 'pro' && !isAdmin) ? '#7c3aed' : '';
      cardPro.style.boxShadow = (activePlan === 'pro' && !isAdmin) ? '0 0 30px rgba(124, 58, 237, 0.4)' : '';
    }
    if (btnPro) {
      const isPro = (activePlan === 'pro' && !isAdmin);
      btnPro.innerHTML = isPro ? '⭐ Active Pro Plan' : 'Upgrade to Pro (₹19/mo)';
      btnPro.onclick = () => window.BCA3_PAYMENTS.payForSubscription('pro', 'Pro Scholar', 19);
    }

    if (cardMax) {
      const isMax = (activePlan === 'max' || isAdmin);
      cardMax.style.borderColor = isMax ? '#c25e3e' : '';
      cardMax.style.boxShadow = isMax ? '0 0 35px rgba(194, 94, 62, 0.45)' : '';
    }
    if (btnMax) {
      const isMax = (activePlan === 'max' || isAdmin);
      btnMax.innerHTML = isMax ? '🌟 Active Lifetime Pass (All Unlocked)' : 'Get Max Lifetime Pass (₹49)';
      btnMax.style.background = isMax ? 'rgba(194, 94, 62, 0.25)' : 'linear-gradient(135deg, #c25e3e, #ea580c)';
      btnMax.onclick = () => window.BCA3_PAYMENTS.payForSubscription('max', 'Max Lifetime', 49);
    }
  }
};
