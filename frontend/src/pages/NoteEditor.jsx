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
    return <div className="container">Loading...</div>;
  }

  if (!note) {
    return <div className="container">Note not found</div>;
  }

  const canEdit = note.owner_id === user?.id || user?.role === 'editor';

  return (
    <div className="container">
      <div className="editor-container">
        <div className="editor-header">
          <div>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              ← Back to Dashboard
            </button>
            {saving && <span style={{ marginLeft: '15px', color: '#666' }}>Saving...</span>}
          </div>
          <div>
            {note.owner_id === user?.id && (
              <button onClick={shareNote} className="btn btn-primary">
                Share Note
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
              placeholder="Note title..."
              disabled={!canEdit}
              style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                border: 'none', 
                outline: 'none',
                width: '100%',
                marginBottom: '20px'
              }}
            />
          </div>
          
          <div className="form-group">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing your note..."
              disabled={!canEdit}
            />
          </div>
          
          {!canEdit && (
            <div style={{ color: '#666', fontStyle: 'italic', marginTop: '10px' }}>
              You have read-only access to this note.
            </div>
          )}
        </div>
      </div>

      {showShareUrl && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '8px', 
            maxWidth: '500px', 
            width: '90%' 
          }}>
            <h3>Share Note</h3>
            <p>Anyone with this link can view your note (read-only):</p>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginTop: '15px', 
              marginBottom: '20px' 
            }}>
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                style={{ flex: 1 }}
              />
              <button onClick={copyShareUrl} className="btn btn-primary">
                Copy
              </button>
            </div>
            <button 
              onClick={() => setShowShareUrl(false)} 
              className="btn btn-secondary"
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