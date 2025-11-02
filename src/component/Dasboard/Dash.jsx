import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Dash.module.css";

import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  FileText, 
  DollarSign, 
  Settings, 
  HelpCircle, 
  X, 
  Menu, 
  Search, 
  Bell, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  LogOut,
  Home,
  Activity
} from "lucide-react";
import axios from "axios";


const Dash = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeContent, setActiveContent] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userStatus, setUserStatus] = useState('online'); // online, away, offline

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3, content: 'dashboard' },
    { path: "/projects", label: "Projects", icon: Users, content: 'projects' },
    { path: "/tasks", label: "Tasks", icon: FileText, content: 'tasks' }
  ];

  const token = localStorage.getItem('token');

  const handleMenuClick = (path, content) => {
    console.log('Menu clicked:', { path, content });
    setIsLoading(true);
    setActiveContent(content);
    console.log('Active content set to:', content);
    
    setTimeout(() => {
      setIsLoading(false);
      setSidebarOpen(false);
    }, 300);
    
    // Navigate to the correct path
    navigate(path);
  };

  const handleLogout = async() => {
    localStorage.removeItem('token');
    navigate('/');
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleUserStatus = () => {
    setUserStatus(prev => {
      if (prev === 'online') return 'away';
      if (prev === 'away') return 'offline';
      return 'online';
    });
  };

  const getStatusColor = () => {
    switch(userStatus) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#10b981';
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize active content based on current route or default to dashboard
  useEffect(() => {
    // Set active content based on current path
    const currentPath = location.pathname;
    const currentItem = menuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveContent(currentItem.content);
    } else if (currentPath === '/dashboard') {
      setActiveContent('dashboard');
    }
  }, [location.pathname]);

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <Activity size={20} />
            </div>
            <span className={styles.logoText}>Dashboard</span>
          </div>
          <button className={styles.closeButton} onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navigation}>
          <div className={styles.menuSection}>
            <span className={styles.sectionLabel}>Main</span>
            {menuItems.map((item, index) => {
              const isActive = activeContent === item.content;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.path}
                  className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                  onClick={() => handleMenuClick(item.path, item.content)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={styles.menuItemContent}>
                    <IconComponent size={20} className={styles.menuIcon} />
                    <span className={styles.menuLabel}>{item.label}</span>
                  </div>
                  {isActive && <div className={styles.activeIndicator}></div>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
                alt="User" 
                className={styles.avatarImage}
              />
              <button 
                className={styles.statusIndicator}
                onClick={toggleUserStatus}
                style={{ backgroundColor: getStatusColor() }}
                title={`Status: ${userStatus} (Click to change)`}
              ></button>
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>Admin User</span>
              <span className={styles.userRole} style={{ 
                color: getStatusColor(),
                textTransform: 'capitalize' 
              }}>
                {userStatus}
              </span>
            </div>
          </div>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Navbar */}
        <header className={styles.navbar}>
          <div className={styles.navbarLeft}>
            <button className={styles.menuToggle} onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Assignment</h1>
              <span className={styles.pageBreadcrumb}>{activeContent}</span>
            </div>
          </div>

          <div className={styles.navbarRight}>
            {/* Search Bar */}
            <div className={`${styles.searchContainer} ${searchFocused ? styles.searchFocused : ''}`}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className={styles.searchInput}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className={styles.searchShortcut}>⌘K</div>
            </div>

            {/* Notifications */}
            <button className={styles.notificationButton}>
              <Bell size={20} />
              <span className={styles.notificationBadge}>3</span>
            </button>

            {/* Profile Dropdown */}
            <button className={styles.profileButton}>
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
                alt="Profile" 
                className={styles.profileAvatar}
              />
              <ChevronDown size={16} className={styles.profileChevron} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                <span className={styles.loadingText}>Loading...</span>
              </div>
            </div>
          )}
          
          <div className={`${styles.contentWrapper} ${isLoading ? styles.contentLoading : ''}`}>
            {activeContent === 'trainers' && <TrainerTab />}
            {activeContent === 'dashboard' && (
              <div className={styles.dashboardContent}>
                <div className={styles.welcomeCard}>
                  <div className={styles.cardHeader}>
                    <Home size={24} className={styles.cardIcon} />
                    <div>
                      <h2 className={styles.cardTitle}>Welcome Back!</h2>
                      <p className={styles.cardSubtitle}>Here's what's happening with your projects today.</p>
                    </div>
                  </div>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>24</div>
                      <div className={styles.statLabel}>Active Projects</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>156</div>
                      <div className={styles.statLabel}>Total Users</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>98%</div>
                      <div className={styles.statLabel}>Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!activeContent && (
              <div style={{padding: '20px', textAlign: 'center'}}>
                <p>No content selected. Current activeContent: "{activeContent}"</p>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
        onClick={closeSidebar}
      ></div>
    </div>
  );
};

export default Dash;