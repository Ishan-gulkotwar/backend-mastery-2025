import React from 'react';
import './TaskList.css';

function TaskList({ tasks, onEdit, onDelete, onStatusChange }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>No tasks yet</h3>
        <p>Create your first task to get started!</p>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', color: '#fbbf24' },
      in_progress: { text: 'In Progress', color: '#3b82f6' },
      completed: { text: 'Completed', color: '#10b981' },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const statusBadge = getStatusBadge(task.status);
        
        return (
          <div key={task.id} className="task-item">
            <div className="task-main">
              <div
                className="task-priority"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              />
              
              <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                
                <div className="task-meta">
                  <span
                    className="task-status"
                    style={{ backgroundColor: statusBadge.color }}
                  >
                    {statusBadge.text}
                  </span>
                  <span className="task-priority-label">
                    {task.priority.toUpperCase()}
                  </span>
                  <span className="task-date">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="task-actions">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={() => onEdit(task)}
                className="btn-edit"
                title="Edit task"
              >
                ✏️
              </button>

              <button
                onClick={() => onDelete(task.id)}
                className="btn-delete"
                title="Delete task"
              >
                🗑️
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;