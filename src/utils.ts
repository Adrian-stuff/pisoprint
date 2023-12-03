import { exec } from "child_process";
import { unlink } from "fs/promises";
import { readFileSync } from "fs";

import pdf from "pdf-page-counter";
async function deleteFile(filePath: string) {
  await unlink(filePath);
}
const UPLOAD_PATH = "/root/projects/pisoprint/dist/uploads"
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
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      }
    )
  );
}

function getPdfData(filePath: string) {
  let dataBuffer = readFileSync(filePath);

  return pdf(dataBuffer);
}

export { convertToPdf, deleteFile, getPdfData };
