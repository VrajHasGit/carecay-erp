/**
 * Media utility — compresses images client-side and stores as base64 data URLs.
 * No external storage service needed — works entirely with Firestore.
 *
 * Flow:
 *   1. User selects files → compressed to base64 in browser (INSTANT)
 *   2. User clicks Save → base64 data saved to Firestore sub-collection
 */

import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ── Compression Settings ──
const MAX_DIMENSION = 1200;   // max width/height
const JPEG_QUALITY = 0.55;    // good enough for inspection, very small files
const MAX_FILE_SIZE = 800 * 1024; // skip compression for files already under 800KB after compress

/**
 * Compress an image using Canvas API → returns base64 data URL.
 */
function compressToBase64(file) {
  return new Promise((resolve) => {
    // If not an image, read as-is
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      console.log(`📸 ${file.name}: ${(file.size/1024).toFixed(0)}KB → ${(dataUrl.length * 0.75 / 1024).toFixed(0)}KB`);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    };

    img.src = url;
  });
}

/**
 * Process a single file — compress images or upload to Firestore.
 */
export async function processFile(file) {

  const dataUrl = await compressToBase64(file);
  return {
    url: dataUrl,
    name: file.name,
    type: file.type.startsWith('image/') ? 'image/jpeg' : file.type,
    size: Math.round(dataUrl.length * 0.75), // approximate binary size
  };
}

/**
 * Process multiple files in parallel — all client-side, very fast.
 */
export async function processFiles(files) {
  // Process all files concurrently
  return Promise.all(Array.from(files).map(f => processFile(f)));
}

/**
 * Save media items to Firestore sub-collection.
 * Called when the form is saved (not during file selection).
 *
 * @param {string} parentCollection - e.g. 'val'
 * @param {string} parentId - document ID
 * @param {Array} mediaItems - [{url, name, type, size}]
 */
export async function saveMediaToFirestore(parentCollection, parentId, mediaItems) {
  if (!mediaItems?.length) return;

  const batch = writeBatch(db);
  const mediaCol = collection(db, parentCollection, parentId, 'media');

  for (const item of mediaItems) {
    // Only save new items (items with base64 data URLs or flagged as new from Cloudinary)
    if (item.url && (item.url.startsWith('data:') || item.isNew)) {
      const docRef = doc(mediaCol);
      batch.set(docRef, {
        url: item.url,
        name: item.name || 'untitled',
        type: item.type || 'image/jpeg',
        size: item.size || 0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  await batch.commit();
}

/**
 * Load media items from Firestore sub-collection.
 *
 * @param {string} parentCollection - e.g. 'val'
 * @param {string} parentId - document ID
 * @returns {Array} [{url, name, type, size, docId}]
 */
export async function loadMediaFromFirestore(parentCollection, parentId) {
  try {
    const mediaCol = collection(db, parentCollection, parentId, 'media');
    const snapshot = await getDocs(mediaCol);
    return snapshot.docs.map(d => ({
      ...d.data(),
      docId: d.id,
    }));
  } catch (err) {
    console.error('Failed to load media:', err);
    return [];
  }
}

/**
 * Delete a single media document from Firestore.
 */
export async function deleteMediaFromFirestore(parentCollection, parentId, mediaDocId) {
  const mediaDoc = doc(db, parentCollection, parentId, 'media', mediaDocId);
  await deleteDoc(mediaDoc);
}

/**
 * Delete ALL media documents for a parent record.
 */
export async function deleteAllMediaFromFirestore(parentCollection, parentId) {
  const mediaCol = collection(db, parentCollection, parentId, 'media');
  const snapshot = await getDocs(mediaCol);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ── Helpers (unchanged) ──

/** Check if a file is an image */
export function isImage(file) {
  if (typeof file === 'string') {
    if (file.startsWith('data:image/') || file.startsWith('image/')) return true;
    return /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp|svg)$/i.test(file);
  }
  return file?.type?.startsWith('image/');
}


export async function uploadAudioToStorage(file, recordId) {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
