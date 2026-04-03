/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminSchedule from './pages/AdminSchedule';
import AdminSites from './pages/AdminSites';
import AdminTasks from './pages/AdminTasks';
import Materials from './pages/Materials';
import Furniture from './pages/Furniture';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotificationCenter from './pages/NotificationCenter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Records": Records,
    "Analytics": Analytics,
    "Calendar": Calendar,
    "Tasks": Tasks,
    "Furniture": Furniture,
    "Profile": Profile,
    "AdminUsers": AdminUsers,
    "AdminSchedule": AdminSchedule,
    "AdminSites": AdminSites,
    "AdminTasks": AdminTasks,
    "Materials": Materials,
    "Reports": Reports,
    "Settings": Settings,
    "NotificationCenter": NotificationCenter,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};