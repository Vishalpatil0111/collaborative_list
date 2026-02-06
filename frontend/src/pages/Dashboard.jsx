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
          <h1>Collaborative Notes</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input
              type="text"
              placeholder="Search notes..."
              className="search-bar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn btn-secondary">Search</button>
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Notes</h2>
          {user?.role !== 'viewer' && (
            <button 
              onClick={() => setShowCreateForm(true)} 
              className="btn btn-primary"
            >
              Create New Note
            </button>
          )}
        </div>

        {showCreateForm && (
          <div style={{ marginBottom: '20px', padding: '20px', background: 'white', borderRadius: '8px' }}>
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
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>No notes found. Create your first note to get started!</p>
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
                    {note.content ? note.content.substring(0, 150) + '...' : 'No content yet'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                    Last updated: {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
                {note.owner_id === user?.id && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Delete
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