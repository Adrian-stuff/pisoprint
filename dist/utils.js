"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPdfData = exports.deleteFile = exports.convertToPdf = void 0;
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const pdf_page_counter_1 = __importDefault(require("pdf-page-counter"));
function deleteFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, promises_1.unlink)(filePath);
    });
}
exports.deleteFile = deleteFile;
const UPLOAD_PATH = "/root/projects/pisoprint/dist/uploads";
function convertToPdf(filePath) {
    return new Promise((resolve, reject) => (0, child_process_1.exec)(`lowriter --headless --print-to-file --outdir ${UPLOAD_PATH} ${filePath} `, (err, stdout, stderr) => {
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
            resolve(outputPath);
            console.log('Output Path:', outputPath);
        }
        else {
            console.log('No match found.');
        }
        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    }));
}
exports.convertToPdf = convertToPdf;
function getPdfData(filePath) {
    let dataBuffer = (0, fs_1.readFileSync)(filePath);
    return (0, pdf_page_counter_1.default)(dataBuffer);
}
exports.getPdfData = getPdfData;
