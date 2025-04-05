/**
 * EZ Sign-Out User Data Manager
 * 
 * A centralized data management system for handling user sign-outs and sign-ins.
 * This module provides a consistent API for all user data operations across
 * different parts of the application.
 */

// Define the UserDataManager class
class UserDataManager {
  constructor() {
    // Initialize Firebase if not already initialized
    if (!window.firebase || !window.firebase.apps.length) {
      const firebaseConfig = {
        apiKey: "AIzaSyAEfc8pQ0UHiIm9XQSYbKgI2IhOuP1w0do",
        authDomain: "ez-signout-b1f95.firebaseapp.com",
        projectId: "ez-signout-b1f95",
        storageBucket: "ez-signout-b1f95.firebasestorage.app",
        messagingSenderId: "747672158416",
        appId: "1:747672158416:web:dbf4f85c5acfb5c9785ed5"
      };
      
      window.firebase.initializeApp(firebaseConfig);
    }
    
    // Get Firebase Firestore instance
    this.db = window.firebase.firestore();
    
    // Initialize data structure
    this.userData = {
      signOutRecords: [],
      signInRecords: []
    };
    
    // Define collection and document paths
    this.collectionPath = 'signOutApp';
    this.documentPath = 'userData';
    
    // Initialize listeners array to manage unsubscribe functions
    this.listeners = [];
    
    // Available users with their roles
    this.availableUsers = [
      // Students
      { name: "Tjark", role: "12k" },
      { name: "Cecilia", role: "12k" },
      { name: "Sarah", role: "12k" },
      { name: "Luca", role: "12k" },
      { name: "Folke", role: "12k" },
      { name: "Mania", role: "12k" },
      { name: "Aditi", role: "12k" },
      { name: "Teuen", role: "12k" },
      { name: "Aurelius", role: "12k" },
      { name: "Ebba", role: "12k" },
      { name: "Nell", role: "12k" },
      { name: "Flora", role: "12k" },
      
      // Teachers
      { name: "Ms. King", role: "Teacher" },
      { name: "Mr. Barry", role: "Teacher" },
      { name: "Mr. Thompson", role: "Teacher" },
      { name: "Mr. Wise", role: "Teacher" },
      { name: "Mr. Lee", role: "Teacher" },
      { name: "Mr. Smith", role: "Teacher" },
      { name: "Mr. Crozier", role: "Teacher" },
      { name: "Ms. Ward", role: "Teacher" }
    ];
  }

  /**
   * Initialize the data manager by loading data from Firestore
   * @returns {Promise} Promise resolving when initialization is complete
   */
  async initialize() {
    try {
      const docRef = this.db.collection(this.collectionPath).doc(this.documentPath);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        
        // Convert string dates back to Date objects
        if (data.signOutRecords) {
          data.signOutRecords.forEach(record => {
            record.date = new Date(record.date);
            if (record.endDate) record.endDate = new Date(record.endDate);
          });
        }
        
        if (data.signInRecords) {
          data.signInRecords.forEach(record => {
            record.date = new Date(record.date);
          });
        }
        
        this.userData = data;
      } else {
        // Initialize with empty data if document doesn't exist
        this.userData = {
          signOutRecords: [],
          signInRecords: []
        };
        
        // Create the document
        await docRef.set(this.userData);
      }
      
      return this.userData;
    } catch (error) {
      console.error("Error initializing UserDataManager:", error);
      throw error;
    }
  }

  /**
   * Get all user data
   * @returns {Object} The user data object
   */
  getData() {
    return this.userData;
  }
  
  /**
   * Get list of available users
   * @returns {Array} Array of user objects with name and role
   */
  getAvailableUsers() {
    return this.availableUsers;
  }

  /**
   * Add a real-time listener for data changes
   * @param {Function} callback Function to call when data changes
   * @returns {Function} Unsubscribe function
   */
  addDataListener(callback) {
    const unsubscribe = this.db.collection(this.collectionPath)
      .doc(this.documentPath)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          
          // Convert string dates back to Date objects
          if (data.signOutRecords) {
            data.signOutRecords.forEach(record => {
              record.date = new Date(record.date);
              if (record.endDate) record.endDate = new Date(record.endDate);
            });
          }
          
          if (data.signInRecords) {
            data.signInRecords.forEach(record => {
              record.date = new Date(record.date);
            });
          }
          
          // Update local data
          this.userData = data;
          
          // Call the callback with the updated data
          callback(this.userData);
        }
      }, error => {
        console.error("Error listening to data changes:", error);
      });
    
    // Store the unsubscribe function
    this.listeners.push(unsubscribe);
    
    // Return the unsubscribe function for individual management
    return unsubscribe;
  }

  /**
   * Remove all data listeners
   */
  removeAllListeners() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }

  /**
   * Sign out a user
   * @param {String} username User's name
   * @param {Date} startDate Start date and time of the sign-out
   * @param {Date} endDate End date and time of the sign-out (optional)
   * @param {Boolean} isRecurring Whether the sign-out is recurring (optional)
   * @param {String} comment Additional comment for the sign-out (optional)
   * @returns {Promise} Promise resolving when the sign-out is saved
   */
  async signOut(username, startDate, endDate = null, isRecurring = false, comment = "") {
    const record = {
      user: username,
      date: startDate,
      endDate: endDate,
      signedBackIn: false,
      isRecurring: isRecurring,
      comment: comment
    };
    
    this.userData.signOutRecords.push(record);
    
    // If recurring, create additional weekly events
    if (isRecurring) {
      // Create 10 weekly recurring events
      for (let i = 1; i <= 10; i++) {
        const nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + (i * 7)); // Add 7 days for each week
        
        let nextEndDate = null;
        if (endDate) {
          nextEndDate = new Date(nextDate);
          nextEndDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds());
        }
        
        const recurringRecord = {
          user: username,
          date: nextDate,
          endDate: nextEndDate,
          signedBackIn: false,
          isRecurring: true,
          comment: comment
        };
        
        this.userData.signOutRecords.push(recurringRecord);
      }
    }
    
    await this.saveData();
    return record;
  }

  /**
   * Sign in a user
   * @param {String} username User's name
   * @returns {Promise} Promise resolving when the sign-in is saved
   */
  async signIn(username) {
    const now = new Date();
    let foundActive = false;
    
    // Update sign-out records
    this.userData.signOutRecords.forEach(record => {
      if (record.user === username && 
          record.date <= now && 
          (!record.endDate || record.endDate >= now) && 
          !record.signedBackIn) {
        record.signedBackIn = true;
        foundActive = true;
      }
    });
    
    if (foundActive) {
      // Add sign-in record
      const signInRecord = {
        user: username,
        date: now
      };
      
      this.userData.signInRecords.push(signInRecord);
      
      // Save data
      await this.saveData();
      return signInRecord;
    } else {
      throw new Error("No active sign-out found for user: " + username);
    }
  }

  /**
   * Cancel a sign-out record
   * @param {Number} index Index of the sign-out record to cancel
   * @returns {Promise} Promise resolving when the cancellation is saved
   */
  async cancelSignOut(index) {
    if (index >= 0 && index < this.userData.signOutRecords.length) {
      // Remove the sign-out record
      const removedRecord = this.userData.signOutRecords.splice(index, 1)[0];
      
      // Save data
      await this.saveData();
      return removedRecord;
    } else {
      throw new Error("Invalid sign-out record index: " + index);
    }
  }

  /**
   * Check if a user is currently signed out
   * @param {String} username User's name
   * @returns {Boolean} True if the user is signed out, false otherwise
   */
  isUserSignedOut(username) {
    const now = new Date();
    
    // Find active sign-out records for the user
    const activeSignOut = this.userData.signOutRecords.find(record => {
      return record.user === username && 
             record.date <= now && 
             (!record.endDate || record.endDate >= now) && 
             !record.signedBackIn;
    });
    
    return !!activeSignOut;
  }

  /**
   * Get active sign-out details for a user
   * @param {String} username User's name
   * @returns {Object|null} Sign-out details or null if not signed out
   */
  getActiveSignOutDetails(username) {
    const now = new Date();
    
    // Find active sign-out for the user
    const activeSignOut = this.userData.signOutRecords.find(record => {
      return record.user === username && 
             record.date <= now && 
             (!record.endDate || record.endDate >= now) && 
             !record.signedBackIn;
    });
    
    return activeSignOut || null;
  }

  /**
   * Get sign-out records for a specific date
   * @param {Date} date The date to filter records for
   * @param {String} username Optional username to filter by
   * @returns {Array} Filtered sign-out records
   */
  getSignOutRecordsForDate(date, username = null) {
    const dateStr = this.getDateString(date);
    
    return this.userData.signOutRecords.filter(record => {
      // Filter by username if provided
      if (username && record.user !== username) {
        return false;
      }
      
      // Check if record date matches the specified date
      const recordDateStr = this.getDateString(record.date);
      if (recordDateStr === dateStr) {
        return true;
      }
      
      // Check if record span includes the specified date
      if (record.endDate) {
        return record.date <= date && record.endDate >= date;
      }
      
      return false;
    });
  }

  /**
   * Get sign-in records for a specific date
   * @param {Date} date The date to filter records for
   * @param {String} username Optional username to filter by
   * @returns {Array} Filtered sign-in records
   */
  getSignInRecordsForDate(date, username = null) {
    const dateStr = this.getDateString(date);
    
    return this.userData.signInRecords.filter(record => {
      // Filter by username if provided
      if (username && record.user !== username) {
        return false;
      }
      
      // Check if record date matches the specified date
      const recordDateStr = this.getDateString(record.date);
      return recordDateStr === dateStr;
    });
  }

  /**
   * Get all sign-out records for a user
   * @param {String} username The username to filter by
   * @returns {Array} Filtered sign-out records
   */
  getUserSignOutRecords(username) {
    return this.userData.signOutRecords.filter(record => record.user === username);
  }

  /**
   * Get all sign-in records for a user
   * @param {String} username The username to filter by
   * @returns {Array} Filtered sign-in records
   */
  getUserSignInRecords(username) {
    return this.userData.signInRecords.filter(record => record.user === username);
  }

  /**
   * Get all unique users in the system
   * @returns {Array} Array of unique usernames
   */
  getAllUsers() {
    const allUsers = new Set();
    
    // Add all predefined users
    this.availableUsers.forEach(user => {
      allUsers.add(user.name);
    });
    
    // Add any additional users from records
    this.userData.signOutRecords.forEach(record => {
      if (record.user) allUsers.add(record.user);
    });
    
    this.userData.signInRecords.forEach(record => {
      if (record.user) allUsers.add(record.user);
    });
    
    return Array.from(allUsers).sort();
  }

  /**
   * Get all students (users with role 12k or unknown)
   * @returns {Array} Array of student usernames
   */
  getAllStudents() {
    const allUsers = this.getAllUsers();
    
    return allUsers.filter(username => {
      const userInfo = this.availableUsers.find(u => u.name === username);
      return !userInfo || userInfo.role !== "Teacher";
    });
  }

  /**
   * Get all teachers (users with Teacher role)
   * @returns {Array} Array of teacher usernames
   */
  getAllTeachers() {
    const allUsers = this.getAllUsers();
    
    return allUsers.filter(username => {
      const userInfo = this.availableUsers.find(u => u.name === username);
      return userInfo && userInfo.role === "Teacher";
    });
  }

  /**
   * Get statistics for the current day
   * @returns {Object} Statistics object
   */
  getCurrentStats() {
    const now = new Date();
    const today = this.getDateString(now);
    
    // Calculate total sign-outs today
    const todaySignOuts = this.userData.signOutRecords.filter(record => 
      this.getDateString(record.date) === today
    ).length;
    
    // Calculate currently signed out
    const currentlySignedOut = this.userData.signOutRecords.filter(record => 
      record.date <= now && 
      (!record.endDate || record.endDate >= now) && 
      !record.signedBackIn
    ).length;
    
    // Total unique users
    const uniqueUsers = this.getAllUsers().length;
    
    return {
      todaySignOuts,
      currentlySignedOut,
      uniqueUsers
    };
  }

  /**
   * Format date to YYYY-MM-DD string for comparison
   * @param {Date} date Date to format
   * @returns {String} Formatted date string
   */
  getDateString(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  /**
   * Format date for display
   * @param {Date} date Date to format
   * @returns {String} Formatted date string
   */
  formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Format time for display
   * @param {Date} date Date to format
   * @returns {String} Formatted time string
   */
  formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Get the end of day date
   * @param {Date} date Base date
   * @returns {Date} End of day date
   */
  getEndOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get the end of week date
   * @param {Date} date Base date
   * @returns {Date} End of week date
   */
  getEndOfWeek(date) {
    const result = new Date(date);
    result.setDate(date.getDate() + (6 - date.getDay()));
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Save data to Firestore
   * @returns {Promise} Promise resolving when the save is complete
   */
  async saveData() {
    try {
      // Create a serializable copy
      const serializableData = JSON.parse(JSON.stringify(this.userData));
      
      // Save to Firestore
      await this.db.collection(this.collectionPath).doc(this.documentPath).set(serializableData);
      
      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  }
  
  /**
   * Delete a user and all their data
   * @param {String} username Username to delete
   * @returns {Promise} Promise resolving when the deletion is complete
   */
  async deleteUserData(username) {
    if (!username) throw new Error("Username is required");
    
    // Remove all user's records
    this.userData.signOutRecords = this.userData.signOutRecords.filter(
      record => record.user !== username
    );
    
    this.userData.signInRecords = this.userData.signInRecords.filter(
      record => record.user !== username
    );
    
    // Save to Firestore
    await this.saveData();
    return true;
  }
  
  /**
   * Clear all data
   * @returns {Promise} Promise resolving when the clear is complete
   */
  async clearAllData() {
    // Reset data
    this.userData = {
      signOutRecords: [],
      signInRecords: []
    };
    
    // Save to Firestore
    await this.saveData();
    return true;
  }
  
  /**
   * Export all data as a JSON string
   * @returns {String} JSON string of all data
   */
  exportAllData() {
    return JSON.stringify(this.userData, null, 2);
  }
  
  /**
   * Import data from a JSON string
   * @param {String} jsonData JSON string of data to import
   * @returns {Promise} Promise resolving when the import is complete
   */
  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.signOutRecords || !data.signInRecords) {
        throw new Error("Invalid data structure");
      }
      
      // Convert string dates to Date objects
      if (data.signOutRecords) {
        data.signOutRecords.forEach(record => {
          record.date = new Date(record.date);
          if (record.endDate) record.endDate = new Date(record.endDate);
        });
      }
      
      if (data.signInRecords) {
        data.signInRecords.forEach(record => {
          record.date = new Date(record.date);
        });
      }
      
      // Update data
      this.userData = data;
      
      // Save to Firestore
      await this.saveData();
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const userDataManager = new UserDataManager();

// Export the singleton instance
export default userDataManager;