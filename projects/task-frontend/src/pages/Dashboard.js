import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { tasksAPI } from '../services/api';
import { toast } from 'react-toastify';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import './Dashboard.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, priority, title
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getTasks();
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let filtered = [...tasks];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (taskData) => {
    try {
      await tasksAPI.createTask(taskData);
      setShowForm(false);
      loadTasks();
      toast.success('✅ Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('❌ Failed to create task. Please try again.');
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      await tasksAPI.updateTask(id, taskData);
      setEditingTask(null);
      loadTasks();
      toast.success('✅ Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('❌ Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteTask = async () => {
    try {
      await tasksAPI.deleteTask(confirmDelete);
      setConfirmDelete(null);
      loadTasks();
      toast.success('🗑️ Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('❌ Failed to delete task. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setSortBy('date');
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📋 Task Manager</h1>
          <div className="user-info">
            <button onClick={toggleDarkMode} className="btn-theme" title="Toggle theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <span>👤 {user?.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card progress">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="tasks-section">
          <div className="tasks-header">
            <button
              className="btn-add-task"
              onClick={() => setShowForm(true)}
            >
              + New Task
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date">Date Created</option>
                <option value="priority">Priority</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-clear-filters">
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Info */}
          <div className="results-info">
            {hasActiveFilters ? (
              <p>
                Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
              </p>
            ) : (
              <p>
                <strong>{tasks.length}</strong> total tasks
              </p>
            )}
          </div>

          {loading ? (
            <LoadingSpinner message="Loading your tasks..." />
          ) : (
            <TaskList
              tasks={filteredTasks}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onStatusChange={(id, status) =>
                handleUpdateTask(id, { status })
              }
            />
          )}
        </div>
      </div>

      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingTask && (
        <TaskForm
          task={editingTask}
          onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={confirmDeleteTask}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;