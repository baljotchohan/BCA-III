/**
 * BCA III Hub — Razorpay Payment & Subscription Module
 * Handles Single Note Purchases (₹10 - ₹20) and Tiered Subscriptions (Pro, Plus, Max)
 */

window.BCA3_PAYMENTS = {
  // Live Razorpay Key ID
  testKeyId: 'rzp_live_TOvSIy2L3J3ply',

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
   * Purchase a single note (₹10 - ₹20)
   */
  payForSingleNote: async function (noteId, noteTitle, priceInRs = 15) {
    if (!currentUserProfile) {
      if (typeof showAuthModal === 'function') showAuthModal();
      alert('Please sign in first to purchase and unlock this note.');
      return;
    }

    try {
      await this.ensureRazorpaySDK();

      // Show loader Toast
      if (typeof showToast === 'function') showToast(`Preparing checkout for ${noteTitle}...`, 'info');

      // Call backend to create Razorpay Order
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

      const orderData = await response.json();

      if (!response.ok || !orderData.success) {
        throw new Error(orderData.error || 'Could not initiate Razorpay order');
      }

      // Configure Razorpay Checkout Options
      const options = {
        key: orderData.keyId || this.testKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BCA III Hub Notes',
        description: `Unlock Note: ${noteTitle}`,
        image: '/favicon.svg',
        order_id: orderData.orderId,
        prefill: {
          name: currentUserProfile.name || '',
          email: currentUserProfile.email || ''
        },
        theme: {
          color: '#6366f1' // Modern Indigo theme
        },
        handler: async function (paymentResponse) {
          try {
            if (typeof showToast === 'function') showToast('Verifying payment...', 'info');

            // Send payment details to backend for verification
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                uid: currentUserProfile.uid,
                itemType: 'single_note',
                itemId: noteId
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              if (!currentUserProfile.purchasedNotes) currentUserProfile.purchasedNotes = {};
              currentUserProfile.purchasedNotes[noteId] = {
                purchasedAt: Date.now(),
                paymentId: paymentResponse.razorpay_payment_id
              };

              localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));

              if (typeof showToast === 'function') {
                showToast(`🎉 Note unlocked successfully!`, 'success');
              } else {
                alert(`🎉 Payment Successful! Note "${noteTitle}" is now unlocked.`);
              }

              // Re-render notes to remove lock overlay
              if (typeof activeSubjectId !== 'undefined' && activeSubjectId && typeof renderSubjectNotes === 'function') {
                const subject = SYLLABUS_DATA ? SYLLABUS_DATA.find(s => s.id === activeSubjectId) : null;
                if (subject) renderSubjectNotes(subject);
              }
            } else {
              alert('Payment verification failed: ' + (verifyData.error || 'Unknown error'));
            }
          } catch (err) {
            console.error('Payment Verification error:', err);
            alert('Payment complete, but verification encountered an error. Please refresh.');
          }
        },
        modal: {
          ondismiss: function () {
            if (typeof showToast === 'function') showToast('Payment cancelled', 'info');
          }
        }
      };

      const rzpInstance = new Razorpay(options);
      rzpInstance.open();

    } catch (err) {
      console.error('Single note checkout error:', err);
      alert('Error initiating checkout: ' + err.message);
    }
  },

  /**
   * Subscribe to Tiered Plan (Pro, Plus, Max)
   */
  payForSubscription: async function (planTier, planName, priceInRs) {
    if (!currentUserProfile) {
      if (typeof showAuthModal === 'function') showAuthModal();
      alert('Please sign in first to upgrade your subscription plan.');
      return;
    }

    try {
      await this.ensureRazorpaySDK();

      if (typeof showToast === 'function') showToast(`Preparing ${planName} subscription...`, 'info');

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

      const orderData = await response.json();

      if (!response.ok || !orderData.success) {
        throw new Error(orderData.error || 'Could not initiate Razorpay order');
      }

      const options = {
        key: orderData.keyId || this.testKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BCA III Hub Subscription',
        description: `Upgrade to ${planName} Tier`,
        image: '/favicon.svg',
        order_id: orderData.orderId,
        prefill: {
          name: currentUserProfile.name || '',
          email: currentUserProfile.email || ''
        },
        theme: {
          color: planTier === 'max' ? '#ec4899' : (planTier === 'plus' ? '#8b5cf6' : '#6366f1')
        },
        handler: async function (paymentResponse) {
          try {
            if (typeof showToast === 'function') showToast('Verifying plan upgrade...', 'info');

            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                uid: currentUserProfile.uid,
                itemType: 'subscription',
                planTier: planTier
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              const now = Date.now();
              currentUserProfile.subscription = {
                plan: planTier,
                status: 'active',
                activatedAt: now,
                validUntil: now + (planTier === 'max' ? 3650 : 30) * 24 * 60 * 60 * 1000
              };

              localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));

              if (typeof showToast === 'function') {
                showToast(`🚀 Upgraded to ${planName} Plan! Full access unlocked.`, 'success');
              } else {
                alert(`🚀 Payment Successful! You are now on the ${planName} Plan.`);
              }

              // Close Pricing Modal & Refresh Workspace
              window.BCA3_PAYMENTS.closePricingModal();

              if (typeof activeSubjectId !== 'undefined' && activeSubjectId && typeof renderSubjectNotes === 'function') {
                const subject = SYLLABUS_DATA ? SYLLABUS_DATA.find(s => s.id === activeSubjectId) : null;
                if (subject) renderSubjectNotes(subject);
              }

              if (typeof updateAuthUI === 'function') updateAuthUI();
            } else {
              alert('Subscription verification failed: ' + (verifyData.error || 'Unknown error'));
            }
          } catch (err) {
            console.error('Subscription verification error:', err);
            alert('Subscription payment recorded, but verification encountered an issue.');
          }
        },
        modal: {
          ondismiss: function () {
            if (typeof showToast === 'function') showToast('Upgrade cancelled', 'info');
          }
        }
      };

      const rzpInstance = new Razorpay(options);
      rzpInstance.open();

    } catch (err) {
      console.error('Subscription checkout error:', err);
      alert('Error starting checkout: ' + err.message);
    }
  },

  /**
   * Helper: Check if current user has access to a note
   */
  hasNoteAccess: function (noteId, indexInSubject = 0) {
    // Admin has access to everything
    if (currentUserProfile && currentUserProfile.isAdmin) return true;

    // First note in any subject is FREE for preview
    if (indexInSubject === 0) return true;

    // Check user's subscription
    if (currentUserProfile && currentUserProfile.subscription) {
      const sub = currentUserProfile.subscription;
      if (sub.status === 'active' && sub.validUntil > Date.now()) {
        if (['pro', 'plus', 'max'].includes(sub.plan)) return true;
      }
    }

    // Check individual note purchase
    if (currentUserProfile && currentUserProfile.purchasedNotes && currentUserProfile.purchasedNotes[noteId]) {
      return true;
    }

    return false;
  },

  openPricingModal: function () {
    const modal = document.getElementById('pricingModal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  },

  closePricingModal: function () {
    const modal = document.getElementById('pricingModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
};
