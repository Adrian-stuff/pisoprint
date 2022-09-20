import { exec } from "child_process";
import { unlink } from "fs/promises";
import { readFileSync } from "fs";

import pdf from "pdf-page-counter";
async function deleteFile(filePath: string) {
  await unlink(filePath);
}

function convertToPdf(filePath: string) {
  return new Promise<string>((resolve, reject) =>
    exec(
      `unoconvert --convert-to pdf ${filePath} ${filePath}.pdf`,
      (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          console.log(err);
          reject(err);
          return;
        }
        resolve(`${filePath}.pdf`);
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
