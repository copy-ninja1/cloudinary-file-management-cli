import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as path from 'path';
import * as fs from 'fs/promises';
import { program } from 'commander';
import cloudConfig from './config/cloudinary';

cloudinary.config(cloudConfig);

// check if file exists on Cloudinary
async function checkFileExists(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.api.resource(publicId);
    return !!result;
  } catch (error: any) {
    if (error && error.http_code === 404) {
      return false; // File not found
    }
    console.error('Error checking file existence:', error);
    return false;
  }
}

// upload a file to Cloudinary
async function uploadFile(filePath: string, folderPath?: string): Promise<void> {
  const fileName = path.basename(filePath);
  const publicId = folderPath ? `${fileName}` : fileName;

  if (!(await checkFileExists(publicId))) {
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
        folder: folderPath,
        resource_type: 'auto',
        public_id: publicId,
      });
      console.log(`File uploaded successfully: ${result.public_id}`);
    } catch (error) {
      console.error(`Error uploading file: ${filePath}`, error);
    }
  } else {
    console.log(`File already exists on Cloudinary: ${publicId}`);
  }
}

// upload all files in a directory, including subdirectories
async function uploadDirectory(dirPath: string, parentFolder?: string): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        const folderName = path.basename(filePath);
        await uploadDirectory(filePath, parentFolder ? `${parentFolder}/${folderName}` : folderName);
      } else {
        await uploadFile(filePath, parentFolder);
      }
    }
  } catch (error) {
    console.error('Failed to read directory or file:', error);
  }
}

//  delete a file
// async function deleteFile(filePath: string): Promise<void> {
//   try {
//     await fs.unlink(filePath);
//     console.log(`File deleted successfully: ${filePath}`);
//   } catch (error) {
//     console.error(`Error deleting file: ${filePath}`, error);
//   }
// }

//  delete a folder recursively
// async function deleteFolder(folderPath: string): Promise<void> {
//   try {
//     const files = await fs.readdir(folderPath);
//     for (const file of files) {
//       const filePath = path.join(folderPath, file);
//       const stats = await fs.stat(filePath);
//       if (stats.isDirectory()) {
//         await deleteFolder(filePath);
//       } else {
//         await deleteFile(filePath);
//       }
//     }
//     await fs.rmdir(folderPath);
//     console.log(`Folder deleted successfully: ${folderPath}`);
//   } catch (error) {
//     console.error(`Error deleting folder: ${folderPath}`, error);
//   }
// }

//  cli arguments using commander
program
  .command('upload <directory>')
  .description('Upload a directory to Cloudinary')
  .action((directory: string) => {
    uploadDirectory(directory);
  });

// program
//   .command('delete-file <file>')
//   .description('Delete a file')
//   .action((file: string) => {
//     deleteFile(file);
//   });

// program
//   .command('delete-folder <folder>')
//   .description('Delete a folder')
//   .action((folder: string) => {
//     deleteFolder(folder);
//   });

program.parse(process.argv);
