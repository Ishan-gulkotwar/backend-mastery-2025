import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import './Dashboard.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await tasksAPI.getTasks(params);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await tasksAPI.createTask(taskData);
      setShowForm(false);
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      await tasksAPI.updateTask(id, taskData);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await tasksAPI.deleteTask(id);
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📋 Task Manager</h1>
          <div className="user-info">
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
            <div className="filters">
              <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={filter === 'pending' ? 'active' : ''}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                className={filter === 'in_progress' ? 'active' : ''}
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </button>
              <button
                className={filter === 'completed' ? 'active' : ''}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>

            <button
              className="btn-add-task"
              onClick={() => setShowForm(true)}
            >
              + New Task
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading tasks...</div>
          ) : (
            <TaskList
              tasks={tasks}
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
    </div>
  );
}

export default Dashboard;