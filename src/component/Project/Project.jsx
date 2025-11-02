import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { baseUrl } from '../../App'
import styles from './Project.module.css'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'

const Project = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active'
  })
  const [formErrors, setFormErrors] = useState({})
const token = localStorage.getItem('token');
  // Fetch all projects
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${baseUrl}/get/project`,{
        headers:{
            token:token
        }
      })
      console.log('Fetched Projects:', response.data);
      setProjects(response.data.projects || response.data || [])
      setApiError('')
    } catch (error) {
      console.error('Error fetching projects:', error)
      setApiError(error.response?.data?.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

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
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Create or Update project
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setApiError('')

    try {
      if (editingProject) {
        console.log('Editing Project ID:', editingProject.id);
        // Update existing project
        await axios.put(`${baseUrl}/update/project/${editingProject.id}`, formData,{
            headers:{
                token:token
            }
        })
        setSuccessMessage('Project updated successfully!')
      } else {
        // Create new project
        await axios.post(`${baseUrl}/create/project`, formData,{
            headers:{
                token:token
            }   
        })
        setSuccessMessage('Project created successfully!')
      }
      
      fetchProjects()
      handleCloseModal()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving project:', error)
      setApiError(error.response?.data?.message || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  // Toggle project status
  const handleToggleStatus = async (project) => {
    try {
      const newStatus = project.status === 'active' ? 'inactive' : 'active'
      await axios.put(`${baseUrl}/update/project/${project.id}`, {
        ...project,
        status: newStatus
      },{
        headers:{
            token:token
        }   
      })
      
      setSuccessMessage(`Project status changed to ${newStatus}`)
      fetchProjects()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error toggling status:', error)
      setApiError(error.response?.data?.message || 'Failed to update status')
    }
  }

  // Delete project
  const handleDelete = async (id) => {
    console.log('Deleting Project ID:', id);
    setLoading(true)
    try {
      await axios.delete(`${baseUrl}/delete/project/${id}`,{
        headers:{
            token:token
        }   
      })
      setSuccessMessage('Project deleted successfully!')
      fetchProjects()
      setDeleteConfirm(null)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting project:', error)
      setApiError(error.response?.data?.message || 'Failed to delete project')
    } finally {
      setLoading(false)
    }
  }

  // Open modal for create/edit
  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        title: project.title,
        description: project.description,
        status: project.status
      })
    } else {
      setEditingProject(null)
      setFormData({
        title: '',
        description: '',
        status: 'active'
      })
    }
    setShowModal(true)
    setFormErrors({})
    setApiError('')
  }

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setFormData({
      title: '',
      description: '',
      status: 'active'
    })
    setFormErrors({})
    setApiError('')
  }

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Manage your projects efficiently</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Create Project
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

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Projects Table */}
      <div className={styles.tableContainer}>
        {loading && !showModal ? (
          <div className={styles.loadingContainer}>
            <Loader className={styles.spinner} size={40} />
            <p>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <h3>No projects found</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first project to get started'}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr 
                  key={project.id || index}
                  className={styles.tableRow}
                >
                  <td className={styles.titleCell}>{project.title}</td>
                  <td className={styles.descriptionCell}>{project.description}</td>
                  <td>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={project.status === 'active'}
                        onChange={() => handleToggleStatus(project)}
                        className={styles.toggleInput}
                      />
                      <span className={styles.toggleSlider}></span>
                      <span className={styles.toggleLabel}>
                        {project.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleOpenModal(project)}
                        title="Edit project"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => setDeleteConfirm(project)}
                        title="Delete project"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
              <button 
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
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
                  placeholder="Enter project title"
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
                  placeholder="Enter project description"
                  rows="4"
                />
                {formErrors.description && (
                  <span className={styles.errorText}>{formErrors.description}</span>
                )}
              </div>

              {/* Status */}
              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  Status
                </label>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      status: e.target.checked ? 'active' : 'inactive'
                    }))}
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span className={styles.toggleLabel}>
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </label>
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
                      {editingProject ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProject ? 'Update Project' : 'Create Project'
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
            <h2>Delete Project?</h2>
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
                onClick={() => handleDelete(deleteConfirm.id)}
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

export default Project