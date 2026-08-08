/**
 * BCA III Hub — Firebase Realtime Database Config
 * Project: bca2nd-5c622
 * Section: /bca3  (all BCA III data lives here — existing data untouched)
 */
const FIREBASE = {
  rtdbUrl:  'https://bca2nd-5c622-default-rtdb.firebaseio.com',
  section:  '/bca3',

  // Full REST API URL builder
  url: (path) =>
    `https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/${path}.json`,
};
