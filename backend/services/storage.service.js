/**
 * Storage Service
 * Handles S3-compatible storage for PDFs, heatmaps, DXF files
 * Supports AWS S3, MinIO, and other S3-compatible services
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class StorageService {
  constructor() {
    this.s3Client = null;
    this.bucketName = process.env.S3_BUCKET || 'grounding-designer-pro';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.endpoint = process.env.S3_ENDPOINT; // For MinIO or other S3-compatible services
    this.accessKeyId = process.env.S3_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.useLocal = process.env.USE_LOCAL_STORAGE === 'true';
    
    this.initialize();
  }

  initialize() {
    if (this.useLocal) {
      console.log('Using local file storage');
      return;
    }

    if (!this.accessKeyId || !this.secretAccessKey) {
      console.warn('S3 credentials not configured, falling back to local storage');
      this.useLocal = true;
      return;
    }

    const config = {
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      }
    };

    if (this.endpoint) {
      config.endpoint = this.endpoint;
      config.forcePathStyle = true; // Required for MinIO
    }

    this.s3Client = new S3Client(config);
    console.log('S3 storage initialized');
  }

  /**
   * Upload file to storage
   */
  async uploadFile(key, buffer, contentType, metadata = {}) {
    if (this.useLocal) {
      return this.uploadLocal(key, buffer);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata
      });

      await this.s3Client.send(command);
      
      return {
        success: true,
        key,
        url: this.getFileUrl(key)
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload file to local storage
   */
  async uploadLocal(key, buffer) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const localPath = path.join(process.cwd(), 'storage', key);
    const dir = path.dirname(localPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(localPath, buffer);
    
    return {
      success: true,
      key,
      url: `/storage/${key}`
    };
  }

  /**
   * Get file from storage
   */
  async getFile(key) {
    if (this.useLocal) {
      return this.getLocalFile(key);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('S3 get file error:', error);
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  /**
   * Get file from local storage
   */
  async getLocalFile(key) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const localPath = path.join(process.cwd(), 'storage', key);
    
    return await fs.readFile(localPath);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key) {
    if (this.useLocal) {
      return this.deleteLocalFile(key);
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      
      return { success: true, key };
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteLocalFile(key) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const localPath = path.join(process.cwd(), 'storage', key);
    
    await fs.unlink(localPath);
    
    return { success: true, key };
  }

  /**
   * Generate presigned URL for file access
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    if (this.useLocal) {
      return this.getFileUrl(key);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return url;
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Get public URL for file
   */
  getFileUrl(key) {
    if (this.useLocal) {
      return `/storage/${key}`;
    }

    if (this.endpoint) {
      return `${this.endpoint}/${this.bucketName}/${key}`;
    }

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * List files in a prefix
   */
  async listFiles(prefix = '', maxKeys = 1000) {
    if (this.useLocal) {
      return this.listLocalFiles(prefix);
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      });

      const response = await this.s3Client.send(command);
      
      return {
        files: response.Contents || [],
        count: response.KeyCount || 0
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * List files in local storage
   */
  async listLocalFiles(prefix = '') {
    const fs = require('fs').promises;
    const path = require('path');
    
    const localPath = path.join(process.cwd(), 'storage', prefix);
    
    try {
      const files = await fs.readdir(localPath, { recursive: true });
      
      return {
        files: files.map(f => ({ Key: f })),
        count: files.length
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { files: [], count: 0 };
      }
      throw error;
    }
  }

  /**
   * Upload PDF report
   */
  async uploadPDF(reportId, pdfBuffer, metadata = {}) {
    const key = `reports/${reportId}.pdf`;
    return await this.uploadFile(key, pdfBuffer, 'application/pdf', metadata);
  }

  /**
   * Upload Excel report
   */
  async uploadExcel(reportId, excelBuffer, metadata = {}) {
    const key = `reports/${reportId}.xlsx`;
    return await this.uploadFile(key, excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', metadata);
  }

  /**
   * Upload DXF file
   */
  async uploadDXF(reportId, dxfBuffer, metadata = {}) {
    const key = `exports/${reportId}.dxf`;
    return await this.uploadFile(key, dxfBuffer, 'application/dxf', metadata);
  }

  /**
   * Upload heatmap image
   */
  async uploadHeatmap(simulationId, imageBuffer, metadata = {}) {
    const key = `heatmaps/${simulationId}.png`;
    return await this.uploadFile(key, imageBuffer, 'image/png', metadata);
  }

  /**
   * Upload batch ZIP
   */
  async uploadBatch(batchId, zipBuffer, metadata = {}) {
    const key = `batches/${batchId}.zip`;
    return await this.uploadFile(key, zipBuffer, 'application/zip', metadata);
  }
}

module.exports = new StorageService();
