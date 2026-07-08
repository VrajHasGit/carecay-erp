import React, { useState, useEffect, useRef } from 'react';
import { processFile, loadMediaFromFirestore, saveMediaToFirestore, deleteMediaFromFirestore } from '../../utils/uploadMedia';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PHOTO_SLOTS = [
  "Front",
  "Back",
  "Left Side",
  "Right Side",
  "Interior - Dashboard",
  "Interior - Seats",
  "Engine Bay",
  "Boot / Trunk",
  "Odometer",
  "Other / Misc"
];

export const StkPhotosModal = ({ isOpen, onClose, stkRec, onSaved }) => {
  const [mediaItems, setMediaItems] = useState(Array(10).fill(null));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    if (isOpen && stkRec?.id) {
      loadExistingMedia();
    }
  }, [isOpen, stkRec]);

  const loadExistingMedia = async () => {
    setLoading(true);
    try {
      const existing = await loadMediaFromFirestore('stk', stkRec.id);
      
      const newItems = Array(10).fill(null);
      existing.forEach(item => {
        const slotIndex = PHOTO_SLOTS.indexOf(item.name);
        if (slotIndex !== -1) {
          newItems[slotIndex] = item;
        } else {
          // If there are unmapped images from the past, try to find an empty slot
          const emptyIdx = newItems.findIndex(i => i === null);
          if (emptyIdx !== -1) newItems[emptyIdx] = item;
        }
      });
      setMediaItems(newItems);
    } catch (e) {
      console.error("Failed to load photos:", e);
    }
    setLoading(false);
  };

  const handleSlotClick = (index) => {
    setActiveSlot(index);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    if (activeSlot === null || !e.target.files?.length) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    try {
      const processed = await processFile(file);
      // Force the name to exactly match the slot name
      processed.name = PHOTO_SLOTS[activeSlot];
      
      setMediaItems(prev => {
        const next = [...prev];
        next[activeSlot] = processed;
        return next;
      });
    } catch (err) {
      console.error('File compression failed', err);
      alert('Failed to process image');
    }
    
    // reset input
    e.target.value = '';
    setActiveSlot(null);
  };

  const handleDelete = async (index, e) => {
    e.stopPropagation();
    const item = mediaItems[index];
    if (!item) return;

    if (item.docId) {
      // It's saved in Firestore, delete it
      try {
        await deleteMediaFromFirestore('stk', stkRec.id, item.docId);
      } catch (err) {
        console.error("Failed to delete media", err);
        alert("Failed to delete image from database.");
        return;
      }
    }
    
    setMediaItems(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out nulls and only save items that have a URL
      const validItems = mediaItems.filter(Boolean);
      await saveMediaToFirestore('stk', stkRec.id, validItems);
      
      // Update photos field if it was missing
      if (stkRec.sk_photos !== 'Yes') {
        const stkRef = doc(db, 'stk', stkRec.id);
        await updateDoc(stkRef, { sk_photos: 'Yes' });
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving photos:", err);
      alert('Failed to save photos.');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="overlay on" style={{ zIndex: 1000 }}>
      <div className="mbox" style={{ maxWidth: 800 }}>
        <div className="m-hdr">
          <div className="m-hdr-icon">📷</div>
          <h3>Refurbished Photos — {stkRec?.regNo || 'Vehicle'}</h3>
          <button className="m-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        
        <div className="m-body">
          <p style={{ color: 'var(--text2)', marginBottom: '16px', fontSize: '13px' }}>
            Upload exactly 10 photos of the vehicle in the specific slots below.
          </p>

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
              <i className="car-spinner" style={{ fontSize: 24, marginBottom: 12 }}></i>
              <div>Loading photos...</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px'
            }}>
              {PHOTO_SLOTS.map((slotName, idx) => {
                const item = mediaItems[idx];
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleSlotClick(idx)}
                    style={{
                      aspectRatio: '1',
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: item ? 'var(--surface)' : 'var(--surface2)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--or1)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {item ? (
                      <>
                        <img 
                          src={item.url} 
                          alt={slotName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button
                          onClick={(e) => handleDelete(idx, e)}
                          style={{
                            position: 'absolute', top: 6, right: 6,
                            background: 'rgba(220,38,38,.9)', color: '#fff',
                            border: 'none', borderRadius: '50%',
                            width: 24, height: 24, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,.2)'
                          }}
                          title="Remove Photo"
                        >
                          <i className="fa fa-xmark"></i>
                        </button>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'rgba(0,0,0,0.7)', color: '#fff',
                          fontSize: 10, fontWeight: 600, padding: '4px 6px',
                          textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.5px'
                        }}>
                          {slotName}
                        </div>
                      </>
                    ) : (
                      <>
                        <i className="fa fa-camera" style={{ fontSize: 24, color: 'var(--text3)', marginBottom: 8 }}></i>
                        <span style={{ 
                          fontSize: 11, fontWeight: 600, color: 'var(--text2)', 
                          textAlign: 'center', padding: '0 8px' 
                        }}>
                          {slotName}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--or1)', marginTop: 4 }}>Click to add</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={handleSave} disabled={saving || loading}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save Photos</>}
          </button>
        </div>
      </div>
    </div>
  );
};
