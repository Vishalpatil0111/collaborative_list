import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PublicNote = () => {
  const { publicId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchPublicNote();
  }, [publicId]);

  const fetchPublicNote = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/public/${publicId}`);
      setNote(response.data);
    } catch (error) {
      setError('Note not found or not publicly accessible');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <p style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="public-note" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: '#1a202c' }}>Access Denied</h2>
          <p style={{ color: '#718096', fontSize: '16px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="public-note">
        <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #f7fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
                🌐 PUBLIC NOTE
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a202c', lineHeight: '1.2', marginBottom: '8px' }}>{note.title}</h1>
            </div>
            <div style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'right' }}>
              <div style={{ marginBottom: '4px' }}>📅 Created: {new Date(note.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div>🔄 Updated: {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: '1.8', 
          fontSize: '16px',
          minHeight: '300px',
          color: '#2d3748'
        }}>
          {note.content || '📄 This note is empty.'}
        </div>
        
        <div style={{ 
          marginTop: '48px', 
          paddingTop: '24px', 
          borderTop: '2px solid #f7fafc',
          textAlign: 'center',
          color: '#a0aec0',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>🔒</span>
          <span>This is a read-only view of a shared note from <strong style={{ color: '#667eea' }}>Collaborative Notes</strong></span>
        </div>
      </div>
    </div>
  );
};

export default PublicNote;