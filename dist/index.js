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
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("@koa/router"));
const multer_1 = __importDefault(require("@koa/multer"));
const koa_static_1 = __importDefault(require("koa-static"));
const koa_session_1 = __importDefault(require("koa-session"));
const path_1 = __importDefault(require("path"));
// for windows (testing)
// dont forget to start Print Spooler service
// import { getDefaultPrinter, getPrinters, print } from "pdf-to-printer";
// for linux
// import { getDefaultPrinter, getPrinters, print } from "unix-print";
const crypto_1 = __importDefault(require("crypto"));
const printer_1 = __importDefault(require("./printer"));
const utils_1 = require("./utils");
const koa_send_1 = __importDefault(require("koa-send"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = new koa_1.default();
const router = new router_1.default();
const printer = new printer_1.default();
const serverState = { isPrinting: false, waitingForCash: false };
const httpServer = (0, http_1.createServer)(app.callback());
const io = new socket_io_1.Server(httpServer, {
/* options */
});
io.on("connection", (socket) => {
    // ...
});
app.keys = ["idk what todo"];
app.use((0, koa_session_1.default)(app));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./dist/uploads");
    },
    filename: (req, file, cb) => {
        const fileFormat = file.originalname.split(".");
        // split returns a string
        cb(null, `${Date.now()}.${fileFormat[fileFormat.length - 1]}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        let ext = path_1.default.extname(file.originalname);
        if (ext !== ".docx" && ext !== ".doc" && ext !== ".pdf") {
            return cb(new Error("Only docx,doc,pdf are allowed"), false);
        }
        cb(null, true);
    },
});
router.get("/get-printers", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const printers = yield printer.getPrinters();
    ctx.body = { printers: printers };
}));
router.post("/set-default-printer", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const printer = ctx.request.body.printer;
    console.log(printer);
    printer.setDefaultPrinter(printer);
    ctx.body = { success: true };
}));
router.get("/get-default-printer", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultPrinter = yield printer.getDefaultPrinter();
    ctx.body = { defaultPrinter };
}));
router.post("/print", (ctx) => {
    var _a;
    // implement printing
    // add options
    const filePath = path_1.default.join(__dirname.replace("/dist", ""), (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.lastUploadFile.path);
    let options = [];
    // TODO: implement printing options
    console.log(filePath);
    printer
        .print("dist/uploads/" + ctx.session.pdfFile, options)
        .then(() => {
        ctx.session.isDonePrinting = true;
        ctx.body = { success: true, message: "printing..." };
    })
        .catch((e) => {
        console.log(e);
        ctx.body = { success: false, message: "printing..." };
    });
    // TODO: implement deleting files
});
router.post("/upload", upload.single("doc-file"), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("ctx.file", ctx.file);
    const filePath = path_1.default.join(__dirname.replace("/dist", ""), ctx.file.path);
    if (ctx.session.lastUploadFile !== undefined) {
        // TODO: delete files
        console.log("deleting", ctx.session.lastUploadFile.path);
        // deleteFile(ctx.session!.lastUploadFile.path).catch((e) => {
        //   console.log(e);
        // });
        // deleteFile(ctx.session!.lastUploadFile.path + ".pdf").catch((e) => {
        //   console.log(e);
        // });
    }
    let pdf = ctx.file.filename;
    console.log("converting...");
    yield (0, utils_1.convertToPdf)(filePath)
        .then((pdfPath) => {
        pdf = ctx.file.filename + ".pdf";
    })
        .catch((e) => {
        ctx.body = {
            pdfUrl: undefined,
            pdfPages: undefined,
            success: false,
            error: e.toString(),
        };
        return;
    });
    let data = yield (0, utils_1.getPdfData)(path_1.default.join(__dirname, "uploads/" + pdf));
    const pages = data.numpages;
    console.log("pdfData: ", data);
    // TODO: exception handling
    // console.log("ctx.request.body", ctx.request.body);
    ctx.session.lastUploadFile = ctx.file;
    ctx.session.pdfFile = pdf;
    ctx.session.isDonePrinting = false;
    ctx.body = { pdfUrl: `/pdf/${pdf}`, pdfPages: pages, success: true };
}));
router.get("/pdf", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, koa_send_1.default)(ctx, "dist/uploads/" + ctx.session.pdfFile);
}));
router.get("/id", (ctx, next) => {
    var _a;
    // ctx.cookies.set("user-hash", id, { httpOnly: false });
    // serve(path.join(__dirname, "/public"));
    // ctx.body = "hello";
    // ctx.body = path.join(__dirname, "public");
    console.log((_a = ctx.session) === null || _a === void 0 ? void 0 : _a.id);
    ctx.body = { id: ctx.session.id, file: ctx.session.lastUploadFile };
});
app.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.session.id)
        return yield next();
    const id = crypto_1.default.randomBytes(20).toString("hex");
    ctx.session.id = id;
    yield next();
}));
app
    .use((0, koa_static_1.default)(path_1.default.join(__dirname, "/public")))
    .use(router.routes())
    .use(router.allowedMethods());
app.listen(3000);
