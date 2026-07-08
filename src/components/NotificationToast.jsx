import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationToast = () => {
  const { toasts, dismissToast, markRead } = useNotifications();
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="notif-toast-container">
      {toasts.map((t, i) => (
        <div
          key={t.toastId}
          className="notif-toast"
          style={{ animationDelay: `${i * 80}ms` }}
          onClick={() => {
            if (t.link) navigate(t.link);
            markRead(t.id);
            dismissToast(t.toastId);
          }}
        >
          {/* Progress bar */}
          <div className="notif-toast-progress" style={{ animationDelay: `${i * 80}ms` }} />

          {/* Icon */}
          <div className="notif-toast-icon" style={{
            background: `${t.color || '#6366F1'}22`,
            borderColor: `${t.color || '#6366F1'}44`,
          }}>
            <i className={`fa ${t.icon || 'fa-bell'}`} style={{ color: t.color || '#6366F1' }} />
          </div>

          {/* Content */}
          <div className="notif-toast-body">
            <div className="notif-toast-title">{t.title}</div>
            <div className="notif-toast-msg">{t.message}</div>
            {t.actor?.name && t.actor.name !== 'System' && (
              <div className="notif-toast-actor">
                <i className="fa fa-user" style={{ fontSize: 8, marginRight: 4 }} />
                {t.actor.name} · {timeAgo(t.createdAt)}
              </div>
            )}
          </div>

          {/* Close */}
          <button
            className="notif-toast-close"
            onClick={(e) => { e.stopPropagation(); dismissToast(t.toastId); }}
          >
            <i className="fa fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
