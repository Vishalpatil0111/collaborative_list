import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, API_URL } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/activity`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'share': return '🔗';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return '#38a169';
      case 'update': return '#667eea';
      case 'delete': return '#e53e3e';
      case 'share': return '#764ba2';
      default: return '#718096';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>✨ Collaborative Notes</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '12px 20px' }}>
              ← Dashboard
            </button>
            <div className="user-badge">👤 {user?.name}</div>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>📊 Activity Logs</h2>
          <p style={{ color: '#718096', fontSize: '16px' }}>Track all user actions and note changes</p>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255, 255, 255, 0.98)', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1a202c' }}>No activity yet</h3>
            <p style={{ color: '#718096', fontSize: '16px' }}>Activity logs will appear here as users interact with notes</p>
          </div>
        ) : (
          <div style={{ background: 'rgba(255, 255, 255, 0.98)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#2d3748', fontSize: '14px' }}>Action</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#2d3748', fontSize: '14px' }}>User</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#2d3748', fontSize: '14px' }}>Note</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#2d3748', fontSize: '14px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f7fafc', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{getActionIcon(log.action)}</span>
                          <span 
                            style={{ 
                              fontWeight: '600', 
                              color: getActionColor(log.action),
                              textTransform: 'capitalize'
                            }}
                          >
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#1a202c' }}>{log.user_name}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#718096' }}>{log.note_title || 'Deleted Note'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#a0aec0' }}>
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: '#f7fafc', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>
                📊 Showing last {logs.length} activities
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
