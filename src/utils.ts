import { exec } from "child_process";
import { unlink } from "fs/promises";
import { readFileSync } from "fs";

import pdf from "pdf-page-counter";
import path from "path";
async function deleteFile(filePath: string) {
  await unlink(filePath);
}
const UPLOAD_PATH = path.join(__dirname, "uploads")
function convertToPdf(filePath: string) {
  return new Promise<string>((resolve, reject) =>
    exec(
      `lowriter --headless --print-to-file --outdir ${UPLOAD_PATH} ${filePath} `,
      (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          console.log(err);
          reject(err);
          return;
        }
        //resolve(`${filePath}.pdf`);
        const regex = /->\s([^\s]+\.pdf)\susing/;

        // Use the exec method to get the matched groups
        const match = regex.exec(stdout);

        // Check if there is a match and extract the output path
        if (match && match[1]) {
          const outputPath = match[1];
          resolve(outputPath)
          console.log('Output Path:', outputPath);
        } else {
          console.log('No match found.');
        }
        // the *entire* stdout and stderr (buffered)
      }
    )
  );
}
export interface DocumentInfo {
  paper: string;
  orientation: string;
  pages: number;
}

function parseDocumentInfo(info: string): DocumentInfo | null {
  // Split the input string into lines
  const lines = info.split('\n');

  // Extract relevant information
  const pageSizeMatch = /Page size:\s*(\d+)\s*x\s*(\d+)\s+pts\s*(?:\(([^)]*)\))?/.exec(info)
  const pageCountMatch = /Pages:\s+(\d+)/.exec(info);

  if (!pageSizeMatch || !pageCountMatch) {
    // Return null if the required information is not found
    return null;
  }

  const [, widthStr, heightStr, paper] = pageSizeMatch;
  const [, pageCountStr] = pageCountMatch;

  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);
  const pages = parseInt(pageCountStr, 10);

  // Determine orientation
  const orientation = height < width ? 'landscape' : 'portrait';

  // Identify paper size based on dimensions
  let identifiedPaper: string;

  if ((width === 612 && height === 792) || (width === 792 && height === 612)) {
    identifiedPaper = 'Letter';
  } else if ((width === 612 && height === 1008) || (width === 1008 && height === 612)) {
    identifiedPaper = 'Legal';
  } else if ((width === 595 && height === 842) || (width === 842 && height === 595)) {
    identifiedPaper = 'A4';
  } else {
    identifiedPaper = 'Unknown';
  }

  return {
    paper: identifiedPaper,
    orientation,
    pages,
  };
}

function getPdfData(filePath: string) {

  return new Promise<DocumentInfo>((resolve, reject) =>
    exec(
      `pdfinfo ${filePath}`,
      (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          console.log(err);
          reject(err);
          return;
        }

        const result = parseDocumentInfo(stdout);
        console.log(result)
        if (result) {
          console.log(result);
          resolve(result)
        } else {
          console.log('Unable to parse document information.');
        }


      }
    )
  );
}

export { convertToPdf, deleteFile, getPdfData };
