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
// import { getDefaultPrinter, getPrinters, print } from "unix-print";

import crypto from "crypto";
import Printer from "./printer";
import { convertToPdf, deleteFile, getPdfData } from "./utils";
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
  let options: string[] = [];
  // TODO: implement printing options
  console.log(filePath);
  printer.print("dist/uploads/" + ctx.session!.pdfFile, options);
  // TODO: implement deleting files
  ctx.body = "printing...";
});

router.post("/upload", upload.single("doc-file"), async (ctx) => {
  console.log("ctx.file", ctx.file);
  const filePath = path.join(__dirname.replace("/dist", ""), ctx.file.path);
  if (ctx.session!.lastUploadFile !== undefined) {
    // TODO: delete files
    console.log("deleting", ctx.session!.lastUploadFile.path);
    // deleteFile(ctx.session!.lastUploadFile.path).catch((e) => {
    //   console.log(e);
    // });
    // deleteFile(ctx.session!.lastUploadFile.path + ".pdf").catch((e) => {
    //   console.log(e);
    // });
  }
  let pdf = ctx.file.filename;

  console.log("converting...");

  await convertToPdf(filePath)
    .then((pdfPath) => {
      pdf = ctx.file.filename + ".pdf";
    })
    .catch((e) => {
      ctx.body = { pdfUrl: undefined, pdfPages: undefined, success: false };
      return;
    });

  let data = await getPdfData(path.join(__dirname, "uploads/" + pdf));
  const pages = data.numpages;
  console.log("pdfData: ", data);
  // TODO: exception handling

  // console.log("ctx.request.body", ctx.request.body);
  ctx.session!.lastUploadFile = ctx.file;
  ctx.session!.pdfFile = pdf;

  ctx.body = { pdfUrl: `/pdf/${pdf}`, pdfPages: pages, success: true };
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
