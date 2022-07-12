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
const node_path_1 = __importDefault(require("node:path"));
// for windows (testing)
// dont forget to start Print Spooler service
const pdf_to_printer_1 = require("pdf-to-printer");
// for linux
// import { getDefaultPrinter,getPrinters,print } from "unix-print";
const node_crypto_1 = __importDefault(require("node:crypto"));
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
        let ext = node_path_1.default.extname(file.originalname);
        if (ext !== ".docx" && ext !== ".doc" && ext !== ".pdf") {
            return cb(new Error("Only docx are allowed"), false);
        }
        cb(null, true);
    },
});
router.get("/get-printers", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const printers = yield (0, pdf_to_printer_1.getPrinters)();
    ctx.body = { printers: printers };
}));
router.get("/get-default-printer", (ctx) => {
    (0, pdf_to_printer_1.getDefaultPrinter)().then((printer) => {
        ctx.body = { printer };
    });
});
router.post("/print", (ctx) => {
    // implement printing
    // add options
    const filePath = node_path_1.default.join(__dirname, ctx.session.lastUploadFile.path);
    console.log(filePath);
    (0, pdf_to_printer_1.print)(filePath).catch((e) => console.log(e));
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
    // ctx.cookies.set("user-hash", id, { httpOnly: false });
    // serve(path.join(__dirname, "/public"));
    // ctx.body = "hello";
    // ctx.body = path.join(__dirname, "public");
    console.log(ctx.session.id);
    ctx.body = { id: ctx.session.id, file: ctx.session.lastUploadFile };
});
app.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.session.id)
        return yield next();
    const id = node_crypto_1.default.randomBytes(20).toString("hex");
    ctx.session.id = id;
    yield next();
}));
app
    .use((0, koa_static_1.default)(node_path_1.default.join(__dirname, "/public")))
    .use(router.routes())
    .use(router.allowedMethods());
app.listen(3000);
