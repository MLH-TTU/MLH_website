import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageReference 
} from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  fileId: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * Allowed image MIME types for profile pictures
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

/**
 * Allowed document MIME types for resumes
 */
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];

/**
 * Maximum file size for profile pictures (5MB)
 */
const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum file size for resumes (10MB)
 */
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

/**
 * Validates file type against allowed types
 */
function validateFileType(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`
    );
  }
}

/**
 * Validates file size against maximum size
 */
function validateFileSize(file: File, maxSize: number): void {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    );
  }
}

/**
 * Generates a unique file ID based on timestamp and random string
 */
function generateFileId(fileName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `${timestamp}_${randomStr}.${extension}`;
}

/**
 * Uploads a profile picture to Firebase Storage
 * 
 * @param file - The image file to upload
 * @param uid - The user's Firebase UID
 * @returns Upload result with file ID and download URL
 * @throws Error if validation fails or upload fails
 */
export async function uploadProfilePicture(
  file: File, 
  uid: string
): Promise<UploadResult> {
  // Validate file type
  validateFileType(file, ALLOWED_IMAGE_TYPES);
  
  // Validate file size
  validateFileSize(file, MAX_PROFILE_PICTURE_SIZE);
  
  // Generate unique file ID
  const fileId = generateFileId(file.name);
  
  // Create storage reference
  const storagePath = `users/${uid}/profile-picture/${fileId}`;
  const storageRef = ref(storage, storagePath);
  
  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return {
      fileId: storagePath,
      downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture. Please try again.');
  }
}

/**
 * Uploads a resume to Firebase Storage
 * 
 * @param file - The resume file to upload (PDF or DOCX)
 * @param uid - The user's Firebase UID
 * @returns Upload result with file ID and download URL
 * @throws Error if validation fails or upload fails
 */
export async function uploadResume(
  file: File, 
  uid: string
): Promise<UploadResult> {
  // Validate file type
  validateFileType(file, ALLOWED_RESUME_TYPES);
  
  // Validate file size
  validateFileSize(file, MAX_RESUME_SIZE);
  
  // Generate unique file ID
  const fileId = generateFileId(file.name);
  
  // Create storage reference
  const storagePath = `users/${uid}/resume/${fileId}`;
  const storageRef = ref(storage, storagePath);
  
  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return {
      fileId: storagePath,
      downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw new Error('Failed to upload resume. Please try again.');
  }
}

/**
 * Deletes a file from Firebase Storage
 * 
 * @param fileId - The storage path of the file to delete
 * @throws Error if deletion fails
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const storageRef = ref(storage, fileId);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
}

/**
 * Gets the download URL for a file
 * 
 * @param fileId - The storage path of the file
 * @returns The download URL
 * @throws Error if getting URL fails
 */
export async function getFileUrl(fileId: string): Promise<string> {
  try {
    const storageRef = ref(storage, fileId);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL. Please try again.');
  }
}
