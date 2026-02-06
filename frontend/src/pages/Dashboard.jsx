import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const { user, logout, API_URL } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchNotes();
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error searching notes:', error);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/api/notes`, {
        title: newNoteTitle,
        content: ''
      });
      
      setNotes([response.data, ...notes]);
      setNewNoteTitle('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await axios.delete(`${API_URL}/api/notes/${noteId}`);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>✨ Collaborative Notes</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search notes..."
              className="search-bar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn btn-secondary" style={{ padding: '12px 20px' }}>Search</button>
            <div className="user-badge">👤 {user?.name}</div>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '12px 20px' }}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c' }}>📝 Your Notes</h2>
          {user?.role !== 'viewer' && (
            <button 
              onClick={() => setShowCreateForm(true)} 
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '15px' }}
            >
              ➕ Create New Note
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="create-note-form">
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>Create New Note</h3>
            <form onSubmit={createNote}>
              <div className="form-group">
                <label>Note Title</label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)} 
                className="btn btn-secondary"
                style={{ marginTop: '0' }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255, 255, 255, 0.98)', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1a202c' }}>No notes yet</h3>
            <p style={{ color: '#718096', fontSize: '16px' }}>Create your first note to get started!</p>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <div 
                  onClick={() => navigate(`/note/${note.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="note-title">{note.title}</div>
                  <div className="note-preview">
                    {note.content ? note.content.substring(0, 120) + '...' : '✍️ No content yet'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🕒</span>
                    <span>{new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                {note.owner_id === user?.id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f7fafc' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="btn btn-danger"
                      style={{ fontSize: '13px', padding: '8px 16px', margin: 0 }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;