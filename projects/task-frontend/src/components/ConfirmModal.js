import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button onClick={onCancel} className="btn-cancel-confirm">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-confirm-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;