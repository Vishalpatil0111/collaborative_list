import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, API_URL } = useAuth();
  const socket = useSocket(API_URL);
  
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareUrl, setShowShareUrl] = useState(false);
  
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef({ title: '', content: '' });

  useEffect(() => {
    fetchNote();
    
    if (socket) {
      socket.emit('joinNote', id);
      
      socket.on('noteChange', (data) => {
        if (data.field === 'title') {
          setTitle(data.value);
        } else if (data.field === 'content') {
          setContent(data.value);
        }
      });

      socket.on('noteUpdated', (updatedNote) => {
        setNote(updatedNote);
        setTitle(updatedNote.title);
        setContent(updatedNote.content);
        lastSavedRef.current = { title: updatedNote.title, content: updatedNote.content };
      });
    }

    return () => {
      if (socket) {
        socket.emit('leaveNote', id);
        socket.off('noteChange');
        socket.off('noteUpdated');
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, socket]);

  const fetchNote = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notes/${id}`);
      const noteData = response.data;
      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content);
      lastSavedRef.current = { title: noteData.title, content: noteData.content };
    } catch (error) {
      console.error('Error fetching note:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (title !== lastSavedRef.current.title || content !== lastSavedRef.current.content) {
        await saveNote();
      }
    }, 1000);
  };

  const saveNote = async () => {
    if (!note || note.owner_id !== user?.id) return;
    
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/notes/${id}`, { title, content });
      lastSavedRef.current = { title, content };
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (socket) {
      socket.emit('noteChange', { noteId: id, field: 'title', value: newTitle });
    }
    
    debouncedSave();
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (socket) {
      socket.emit('noteChange', { noteId: id, field: 'content', value: newContent });
    }
    
    debouncedSave();
  };

  const shareNote = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/notes/${id}/share`);
      setShareUrl(response.data.publicUrl);
      setShowShareUrl(true);
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Share URL copied to clipboard!');
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

  if (!note) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>Note not found</p>
        </div>
      </div>
    );
  }

  const canEdit = note.owner_id === user?.id || user?.role === 'editor';

  return (
    <div className="container">
      <div className="editor-container">
        <div className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              ← Back
            </button>
            {saving && (
              <span style={{ color: '#667eea', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="saving-spinner"></span>
                Saving...
              </span>
            )}
          </div>
          <div>
            {note.owner_id === user?.id && (
              <button onClick={shareNote} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                🔗 Share Note
              </button>
            )}
          </div>
        </div>
        
        <div className="editor-content">
          <div className="form-group">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="✍️ Untitled note..."
              disabled={!canEdit}
              style={{ 
                fontSize: '32px', 
                fontWeight: '800', 
                border: 'none', 
                outline: 'none',
                width: '100%',
                marginBottom: '24px',
                background: 'transparent',
                color: '#1a202c'
              }}
            />
          </div>
          
          <div className="form-group">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing your note... \n\nYou can collaborate with others in real-time!"
              disabled={!canEdit}
              style={{
                minHeight: '500px',
                fontSize: '16px',
                lineHeight: '1.8',
                border: 'none',
                background: 'transparent',
                resize: 'vertical'
              }}
            />
          </div>
          
          {!canEdit && (
            <div style={{ 
              color: '#718096', 
              fontStyle: 'italic', 
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f7fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #667eea'
            }}>
              🔒 You have read-only access to this note.
            </div>
          )}
        </div>
      </div>

      {showShareUrl && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🔗 Share Your Note</h3>
            <p style={{ color: '#718096', marginBottom: '20px', lineHeight: '1.6' }}>
              Anyone with this link can view your note in read-only mode:
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '24px' 
            }}>
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                style={{ 
                  flex: 1,
                  padding: '12px 16px',
                  background: '#f7fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}
              />
              <button onClick={copyShareUrl} className="btn btn-primary" style={{ margin: 0, padding: '12px 24px' }}>
                📋 Copy
              </button>
            </div>
            <button 
              onClick={() => setShowShareUrl(false)} 
              className="btn btn-secondary"
              style={{ width: '100%', margin: 0 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;