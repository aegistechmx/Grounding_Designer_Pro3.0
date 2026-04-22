import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Save a project to Firestore
 * @param {string} userId - User ID from Firebase Auth
 * @param {object} projectData - Project data including params, results, etc.
 * @returns {Promise} - Promise with the document reference
 */
export const saveProject = async (userId, projectData) => {
  try {
    const projectRef = await addDoc(collection(db, "projects"), {
      userId,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Project saved with ID:", projectRef.id);
    return projectRef;
  } catch (error) {
    console.error("Error saving project:", error);
    throw error;
  }
};

/**
 * Load all projects for a specific user
 * @param {string} userId - User ID from Firebase Auth
 * @returns {Promise<Array>} - Array of project documents
 */
export const loadProjects = async (userId) => {
  try {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return projects;
  } catch (error) {
    console.error("Error loading projects:", error);
    throw error;
  }
};

/**
 * Load a specific project by ID
 * @param {string} projectId - Project document ID
 * @returns {Promise<object>} - Project data
 */
export const loadProjectById = async (projectId) => {
  try {
    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Project not found");
    }
  } catch (error) {
    console.error("Error loading project:", error);
    throw error;
  }
};

/**
 * Update an existing project
 * @param {string} projectId - Project document ID
 * @param {object} projectData - Updated project data
 * @returns {Promise} - Promise with the update result
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const docRef = doc(db, "projects", projectId);
    await updateDoc(docRef, {
      ...projectData,
      updatedAt: new Date()
    });
    console.log("Project updated:", projectId);
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

/**
 * Delete a project
 * @param {string} projectId - Project document ID
 * @returns {Promise} - Promise with the delete result
 */
export const deleteProject = async (projectId) => {
  try {
    const docRef = doc(db, "projects", projectId);
    await deleteDoc(docRef);
    console.log("Project deleted:", projectId);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};
