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
const child_process_1 = require("child_process");
// for windows (testing)
// dont forget to start Print Spooler service
// import { getDefaultPrinter, getPrinters, print } from "pdf-to-printer";
// for linux
const unix_print_1 = require("unix-print");
const crypto_1 = __importDefault(require("crypto"));
const app = new koa_1.default();
const router = new router_1.default();
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
            return cb(new Error("Only docx are allowed"), false);
        }
        cb(null, true);
    },
});
function convertToPdf(filePath) {
    return new Promise((resolve, reject) => (0, child_process_1.exec)(`unoconvert --convert-to pdf ${filePath} ${filePath}.pdf`, (err, stdout, stderr) => {
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
    }));
}
router.get("/get-printers", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const printers = yield (0, unix_print_1.getPrinters)();
    ctx.body = { printers: printers };
}));
router.get("/get-default-printer", (ctx) => {
    (0, unix_print_1.getDefaultPrinter)().then((printer) => {
        ctx.body = { printer };
    });
});
router.post("/print", (ctx) => {
    var _a;
    // implement printing
    // add options
    const filePath = path_1.default.join(__dirname.replace("/dist", ""), (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.lastUploadFile.path);
    console.log(filePath);
    convertToPdf(filePath).then((convertedFile) => {
        (0, unix_print_1.print)(convertedFile).catch((e) => console.log(e));
    });
    //TODO: implement converting to pdf
    // docxConverter(filePath, filePath + ".pdf", (err: any, res: any) => {
    //   if (err) console.log(err);
    //   console.log(res);
    // });
    ctx.body = "printing...";
});
router.post("/upload", upload.single("doc-file"), (ctx) => {
    console.log("ctx.request.file", ctx.request.file);
    console.log("ctx.file", ctx.file);
    // console.log("ctx.request.body", ctx.request.body);
    ctx.session.lastUploadFile = ctx.file;
    ctx.body = "done";
});
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
