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
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const printer_1 = __importDefault(require("./printer"));
const utils_1 = require("./utils");
const express_1 = __importDefault(require("express"));
const socketio_file_upload_1 = __importDefault(require("socketio-file-upload"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
/* options */
});
app.use(express_1.default.json());
app.use(socketio_file_upload_1.default.router);
app.use(express_1.default.static(path_1.default.join(__dirname, "/public")));
const printer = new printer_1.default();
const dataMap = new Map();
io.on("connection", (socket) => {
    const pathUploads = path_1.default.join(__dirname, "uploads");
    const uploader = new socketio_file_upload_1.default();
    uploader.uploadValidator = (event, callback) => {
        // asynchronous operations allowed here; when done,
        console.log("event: ", event);
        const ext = path_1.default.extname(event.file.name);
        if (ext === ".docx" || ext === ".doc" || ext === ".pdf") {
            callback(true);
        }
        else {
            callback(false);
        }
    };
    uploader.on("start", (e) => {
        const userData = dataMap.get(socket.id);
        console.log(userData);
        if (userData) {
            (0, utils_1.deleteFile)(userData.file.pathName).catch((e) => console.log("error deleting", e));
            (0, utils_1.deleteFile)(userData.file.pathName + ".pdf").catch((e) => console.log("error deleting", e));
        }
    });
    uploader.on("saved", (e) => {
        // implement delete uploaded documents
        dataMap.set(socket.id, { file: e.file, isPrinted: false });
        const userData = dataMap.get(socket.id);
        if (userData) {
            (0, utils_1.convertToPdf)(userData.file.pathName)
                .then((pdfPath) => {
                (0, utils_1.getPdfData)(pdfPath)
                    .then((data) => {
                    dataMap.set(socket.id, Object.assign(Object.assign({}, userData), { pdfData: data, pdfPath: userData.file.pathName + ".pdf" }));
                    socket.emit("pdfInfo", data);
                })
                    .catch((e) => {
                    console.log("pdfData error:", e);
                });
            })
                // /home/adrian/Projects/pisoprint/dist/uploads/1663650329404.docx.pdf
                .catch((e) => {
                console.log("convert error: ", e);
            });
        }
        console.log("saved: ", e);
    });
    uploader.on("error", (e) => {
        console.log("Error: ", e);
    });
    uploader.dir = pathUploads;
    uploader.listen(socket);
    socket.on("print", (e, cb) => {
        socket.emit("waitingForCoins");
        // implement inserting coins
        const userData = dataMap.get(socket.id);
        console.log(userData);
        if (userData) {
            (0, utils_1.deleteFile)(userData.file.pathName).catch((e) => console.log("error deleting", e));
            (0, utils_1.deleteFile)(userData.file.pathName + ".pdf").catch((e) => console.log("error deleting", e));
        }
    });
    socket.on("disconnect", () => {
        const userData = dataMap.get(socket.id);
        if (userData) {
            (0, utils_1.deleteFile)(userData.file.pathName).catch((e) => console.log("error deleting", e));
            (0, utils_1.deleteFile)(userData.file.pathName + ".pdf").catch((e) => console.log("error deleting", e));
        }
        dataMap.delete(socket.id);
    });
});
app.get("/get-printers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const printers = yield printer.getPrinters();
    res.json({ printers: printers });
}));
app.post("/set-default-printer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const printer = req.body.printer;
    console.log(printer);
    printer.setDefaultPrinter(printer);
    res.json({ success: true });
}));
httpServer.listen(3000, () => {
    console.log("listening at 3000");
});
