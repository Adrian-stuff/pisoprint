import Koa from "koa";
import Router from "@koa/router";
import multer from "@koa/multer";
import koaBody from "koa-body";
import serve from "koa-static";
import session from "koa-session";
import path from "path";

import { exec } from "child_process";

// for windows (testing)
// dont forget to start Print Spooler service
// import { getDefaultPrinter, getPrinters, print } from "pdf-to-printer";
// for linux
import { getDefaultPrinter, getPrinters, print } from "unix-print";

import crypto from "crypto";
import Printer from "./printer";
import { convertToPdf, deleteFile } from "./utils";
import send from "koa-send";
const app = new Koa();
const router = new Router();
const printer = new Printer();

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
  const printers = await printer.getPrinters();
  ctx.body = { printers: printers };
});

router.post("/set-default-printer", async (ctx) => {
  const printer = ctx.request.body.printer;
  console.log(printer);
  printer.setDefaultPrinter(printer);
  ctx.body = { success: true };
});

router.get("/get-default-printer", async (ctx) => {
  const defaultPrinter = await printer.getDefaultPrinter();
  ctx.body = { defaultPrinter };
});

router.post("/print", (ctx) => {
  // implement printing
  // add options
  const filePath = path.join(
    __dirname.replace("/dist", ""),
    ctx.session?.lastUploadFile.path
  );
  console.log(filePath);
  // TODO:
  // convertToPdf(filePath).then((convertedFile) => {
  //   print(convertedFile).catch((e) => console.log(e));
  // });
  //TODO: implement converting to pdf
  // docxConverter(filePath, filePath + ".pdf", (err: any, res: any) => {
  //   if (err) console.log(err);
  //   console.log(res);
  // });
  ctx.body = "printing...";
});

router.post("/upload", upload.single("doc-file"), (ctx) => {
  console.log("ctx.file", ctx.file);
  const filePath = path.join(__dirname.replace("/dist", ""), ctx.file.path);
  if (ctx.session!.lastUploadFile !== undefined) {
    console.log("deleting", ctx.session!.lastUploadFile.path);
    deleteFile(ctx.session!.lastUploadFile.path).catch((e) => {
      console.log(e);
    });
    deleteFile(ctx.session!.lastUploadFile.path + ".pdf").catch((e) => {
      console.log(e);
    });
  }
  let pdf = ctx.file.filename;
  if (ctx.file.mimetype !== "application/pdf") {
    console.log("converting...");
    convertToPdf(filePath);
    pdf = ctx.file.filename + ".pdf";
  }
  // console.log("ctx.request.body", ctx.request.body);
  ctx.session!.lastUploadFile = ctx.file;
  ctx.session!.pdfFile = pdf;
  ctx.body = { pdfUrl: `/pdf/${pdf}`, success: true };
});

router.get("/pdf", async (ctx) => {
  await send(ctx, "dist/uploads/" + ctx.session!.pdfFile);
});

router.get("/id", (ctx, next) => {
  // ctx.cookies.set("user-hash", id, { httpOnly: false });
  // serve(path.join(__dirname, "/public"));
  // ctx.body = "hello";
  // ctx.body = path.join(__dirname, "public");
  console.log(ctx.session?.id);
  ctx.body = { id: ctx.session!.id, file: ctx.session!.lastUploadFile };
});

app.use(async (ctx, next) => {
  if (ctx.session!.id) return await next();
  const id = crypto.randomBytes(20).toString("hex");
  ctx.session!.id = id;
  await next();
});

app
  .use(serve(path.join(__dirname, "/public")))

  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
