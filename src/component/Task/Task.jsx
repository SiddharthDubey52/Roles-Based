import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { baseUrl } from '../../App'
import styles from './Task.module.css'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  AlertCircle,
  CheckCircle,
  Loader,
  Calendar,
  Briefcase,
  ChevronDown
} from 'lucide-react'

const Task = () => {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'inprogress',
    dueDate: '',
    projectId: ''
  })
  const [formErrors, setFormErrors] = useState({})

  // Status options
  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#94a3b8' },
    { value: 'inprogress', label: 'In Progress', color: '#3b82f6' },
    { value: 'completed', label: 'Completed', color: '#10b981' }
  ]
const token=localStorage.getItem("token");
  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get/project`,{
        headers:{
            token: token
        }
      })
      const projectList = response.data.projects || response.data || []
      setProjects(projectList)
      
      // Only auto-select first active project on initial load (when selectedProject is null and projects list was empty)
      if (!selectedProject && projects.length === 0 && projectList.length > 0) {
        const firstActiveProject = projectList.find(p => p.status === 'active') || projectList[0]
        setSelectedProject(firstActiveProject)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setApiError(error.response?.data?.message || 'Failed to fetch projects')
    }
  }

  // Fetch tasks for selected project
  const fetchTasks = async () => {
    if (!selectedProject || !selectedProject.id) {
      console.log('No project selected')
      return
    }
    
    setLoading(true)
    setApiError('')
    try {
      console.log('Fetching tasks for project:', selectedProject.id)
      const response = await axios.get(`${baseUrl}/get/${selectedProject.id}`, {
        headers: {
          token: token
        }
      })
      console.log('Tasks response:', response.data)
      setTasks(response.data.tasks || response.data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setApiError(error.response?.data?.message || 'Failed to fetch tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, []) // Empty dependency array - only runs once on mount

  useEffect(() => {
    if (selectedProject && selectedProject.id) {
      console.log('Selected project changed:', selectedProject.id)
      fetchTasks()
    } else {
      setTasks([])
    }
  }, [selectedProject?.id]) // Only re-run when project ID changes

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required'
    }
    if (!formData.projectId) {
      errors.projectId = 'Project is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Create or Update task
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setApiError('')

    try {
      if (editingTask) {
        // Update existing task
        await axios.put(`${baseUrl}/${editingTask._id}`, formData, {
          headers: {
            token: token
          }
        })
        setSuccessMessage('Task updated successfully!')
      } else {
        // Create new task - use projectId from formData
       const response =  await axios.post(`${baseUrl}/create/${formData.projectId}`, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          dueDate: formData.dueDate
        }, {
          headers: {
            token: token
          }
        })
        console.log('Create task response:', response.data)
        setSuccessMessage('Task created successfully!')
      }
      
      // Refresh tasks if the current selected project matches the form project
      if (selectedProject && selectedProject.id === formData.projectId) {
        fetchTasks()
      }
      handleCloseModal()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving task:', error)
      setApiError(error.response?.data?.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  // Toggle task status
  const handleToggleStatus = async (task) => {
    try {
      const statusIndex = statusOptions.findIndex(s => s.value === task.status)
      const nextStatus = statusOptions[(statusIndex + 1) % statusOptions.length].value
      
      await axios.put(`${baseUrl}/${task._id}`, {
        ...task,
        status: nextStatus
      }, {
        headers: {
          token: token
        }
      })
      
      setSuccessMessage(`Task status changed to ${nextStatus}`)
      fetchTasks()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error toggling status:', error)
      setApiError(error.response?.data?.message || 'Failed to update status')
    }
  }

  // Delete task
  const handleDelete = async (_id) => {
    setLoading(true)
    try {
      await axios.delete(`${baseUrl}/delete/${_id}`, {
        headers: {
          token: token
        }
      })
      setSuccessMessage('Task deleted successfully!')
      fetchTasks()
      setDeleteConfirm(null)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting task:', error)
      setApiError(error.response?.data?.message || 'Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  // Open modal for create/edit
  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task)
      // projectId comes as object with _id and title from backend
      const taskProjectId = task.projectId?._id || task.projectId || selectedProject?.id || ''
      console.log('Editing task, project ID:', taskProjectId, 'Task:', task)
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        projectId: taskProjectId
      })
    } else {
      setEditingTask(null)
      setFormData({
        title: '',
        description: '',
        status: 'inprogress',
        dueDate: '',
        projectId: selectedProject ? selectedProject.id : ''
      })
    }
    setShowModal(true)
    setFormErrors({})
    setApiError('')
  }

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      status: 'inprogress',
      dueDate: '',
      projectId: ''
    })
    setFormErrors({})
    setApiError('')
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Check if task is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get status info
  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>Manage your tasks efficiently</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Create Task
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={styles.successMessage}>
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div className={styles.apiError}>
          <AlertCircle size={20} />
          {apiError}
        </div>
      )}

      {/* Project Selector */}
      <div className={styles.projectSelector}>
        <div className={styles.projectSelectorLabel}>
          <Briefcase size={20} />
          <span>Select Project:</span>
        </div>
        <div className={styles.selectWrapper}>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const projectId = e.target.value
              if (projectId) {
                const project = projects.find(p => p.id === projectId)
                console.log('Project selected:', project)
                setSelectedProject(project)
              } else {
                setSelectedProject(null)
                setTasks([])
              }
            }}
            className={styles.projectSelect}
          >
            <option value="">Choose a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title} {project.status === 'active' ? '✓' : '(Inactive)'}
              </option>
            ))}
          </select>
          <ChevronDown size={20} className={styles.selectIcon} />
        </div>
      </div>

      {/* Search Bar */}
      {selectedProject && (
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {/* Tasks Table */}
      <div className={styles.tableContainer}>
        {!selectedProject ? (
          <div className={styles.emptyState}>
            <Briefcase size={48} />
            <h3>No Project Selected</h3>
            <p>Please select a project to view and manage tasks</p>
          </div>
        ) : loading && !showModal ? (
          <div className={styles.loadingContainer}>
            <Loader className={styles.spinner} size={40} />
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <h3>No tasks found</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first task to get started'}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => {
                const statusInfo = getStatusInfo(task.status)
                const overdue = isOverdue(task.dueDate)
                
                return (
                  <tr 
                    key={task._id || index}
                    className={styles.tableRow}
                  >
                    <td className={styles.titleCell}>{task.title}</td>
                    <td className={styles.descriptionCell}>{task.description}</td>
                    <td>
                      <button
                        className={styles.statusBadge}
                        style={{ 
                          backgroundColor: `${statusInfo.color}20`,
                          color: statusInfo.color,
                          borderColor: statusInfo.color
                        }}
                        onClick={() => handleToggleStatus(task)}
                        title="Click to change status"
                      >
                        <span className={styles.statusDot} style={{ backgroundColor: statusInfo.color }}></span>
                        {statusInfo.label}
                      </button>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <Calendar size={16} className={overdue ? styles.overdueIcon : ''} />
                        <span className={overdue ? styles.overdueText : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                        {overdue && <span className={styles.overdueLabel}>Overdue</span>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleOpenModal(task)}
                          title="Edit task"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => setDeleteConfirm(task)}
                          title="Delete task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div 
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button 
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Project Selection */}
              <div className={styles.formGroup}>
                <label htmlFor="projectId" className={styles.label}>
                  Project <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="projectId"
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    className={`${styles.select} ${formErrors.projectId ? styles.inputError : ''}`}
                  >
                    <option value="">Select a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title} {project.status === 'active' ? '✓' : '(Inactive)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className={styles.selectIconForm} />
                </div>
                {formErrors.projectId && (
                  <span className={styles.errorText}>{formErrors.projectId}</span>
                )}
              </div>

              {/* Title */}
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formErrors.title ? styles.inputError : ''}`}
                  placeholder="Enter task title"
                />
                {formErrors.title && (
                  <span className={styles.errorText}>{formErrors.title}</span>
                )}
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`${styles.textarea} ${formErrors.description ? styles.inputError : ''}`}
                  placeholder="Enter task description"
                  rows="4"
                />
                {formErrors.description && (
                  <span className={styles.errorText}>{formErrors.description}</span>
                )}
              </div>

              {/* Status */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Status
                </label>
                <div className={styles.statusOptions}>
                  {statusOptions.map(option => (
                    <label
                      key={option.value}
                      className={`${styles.statusOption} ${
                        formData.status === option.value ? styles.statusOptionActive : ''
                      }`}
                      style={{
                        borderColor: formData.status === option.value ? option.color : '#e2e8f0',
                        backgroundColor: formData.status === option.value ? `${option.color}15` : 'transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={formData.status === option.value}
                        onChange={handleInputChange}
                        className={styles.radioInput}
                      />
                      <span 
                        className={styles.statusDot} 
                        style={{ backgroundColor: option.color }}
                      ></span>
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className={styles.formGroup}>
                <label htmlFor="dueDate" className={styles.label}>
                  Due Date <span className={styles.required}>*</span>
                </label>
                <div className={styles.dateInputWrapper}>
                  <Calendar size={18} className={styles.calendarIcon} />
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className={`${styles.input} ${styles.dateInput} ${formErrors.dueDate ? styles.inputError : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {formErrors.dueDate && (
                  <span className={styles.errorText}>{formErrors.dueDate}</span>
                )}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className={styles.buttonSpinner} size={18} />
                      {editingTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTask ? 'Update Task' : 'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div 
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmIcon}>
              <AlertCircle size={48} />
            </div>
            <h2>Delete Task?</h2>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? 
              This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={() => handleDelete(deleteConfirm._id)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className={styles.buttonSpinner} size={18} />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Task