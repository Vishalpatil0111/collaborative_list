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
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="public-note">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="public-note">
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>{note.title}</h1>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div>Created: {new Date(note.created_at).toLocaleDateString()}</div>
              <div>Updated: {new Date(note.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: '1.6', 
          fontSize: '16px',
          minHeight: '200px'
        }}>
          {note.content || 'This note is empty.'}
        </div>
        
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid #eee',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          This is a read-only view of a shared note from Collaborative Notes
        </div>
      </div>
    </div>
  );
};

export default PublicNote;