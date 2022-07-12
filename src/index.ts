import Koa from "koa";
import Router from "@koa/router";
import multer from "@koa/multer";
import koaBody from "koa-body";
import serve from "koa-static";
import session from "koa-session";
import path from "node:path";

// for windows (testing)
// dont forget to start Print Spooler service
import { getDefaultPrinter, getPrinters, print } from "pdf-to-printer";
// for linux
// import { getDefaultPrinter,getPrinters,print } from "unix-print";

import crypto from "node:crypto";
const app = new Koa();
const router = new Router();

app.keys = ["idk what todo"];

app.use(session(app));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./dist/uploads");
  },
  filename: (req, file, cb) => {
    const fileFormat = file.originalname.split(".");
    // split returns a string
    cb(null, `${Date.now()}.${fileFormat[fileFormat.length - 1]}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".docx" && ext !== ".doc" && ext !== ".pdf") {
      return cb(new Error("Only docx are allowed"), false);
    }
    cb(null, true);
  },
});

router.get("/get-printers", async (ctx) => {
  const printers = await getPrinters();
  ctx.body = { printers: printers };
});

router.get("/get-default-printer", (ctx) => {
  getDefaultPrinter().then((printer: any) => {
    ctx.body = { printer };
  });
});

router.post("/print", (ctx) => {
  // implement printing
  // add options
  const filePath = path.join(__dirname, ctx.session.lastUploadFile.path);
  console.log(filePath);
  //TODO: implement converting to pdf
  // docxConverter(filePath, filePath + ".pdf", (err: any, res: any) => {
  //   if (err) console.log(err);
  //   console.log(res);
  // });
  print(filePath).catch((e) => console.log(e));
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

app.use(async (ctx, next) => {
  if (ctx.session.id) return await next();
  const id = crypto.randomBytes(20).toString("hex");
  ctx.session.id = id;
  await next();
});

app
  .use(serve(path.join(__dirname, "/public")))
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
