import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import Printer from "./printer";
import { DocumentInfo, convertToPdf, deleteFile, getPdfData } from "./utils";
import { writeFile } from "fs";
import express from "express";
import siofu from "socketio-file-upload";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

app.use(express.json());
app.use(siofu.router);
app.use(express.static(path.join(__dirname, "/public")));
const printer = new Printer();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./dist/uploads");
//   },
//   filename: (req, file, cb) => {
//     const fileFormat = file.originalname.split(".");
//     // split returns a string
//     cb(null, `${Date.now()}.${fileFormat[fileFormat.length - 1]}`);
//   },
// });
// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     let ext = path.extname(file.originalname);
//     if (ext !== ".docx" && ext !== ".doc" && ext !== ".pdf") {
//       return cb(new Error("Only docx,doc,pdf are allowed"), false);
//     }
//     cb(null, true);
//   },
// });
interface FileType {
  name: string;
  mtime: any;
  encoding: string;
  clientDetail: {};
  meta: {};
  id: number;
  size: number;
  bytesLoaded: number;
  success: boolean;
  base: string;
  pathName: string;
}

interface PdfDataType {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  version: any;
  text: any;
}
const dataMap: Map<
  string,
  {
    file: FileType;
    pdfData?: DocumentInfo;
    pdfPath?: string;
    isPrinted: boolean;
  }
> = new Map();

io.on("connection", (socket) => {
  const pathUploads = path.join(__dirname, "uploads");
  const uploader = new siofu();

  uploader.uploadValidator = (event: any, callback: any) => {
    // asynchronous operations allowed here; when done,
    console.log("event: ", event);
    const ext = path.extname(event.file.name);
    if (ext === ".docx" || ext === ".doc" || ext === ".pdf") {

      callback(true);
    } else {
      callback(false);
    }
  };

  uploader.on("start", (e: any) => {
    const userData = dataMap.get("file");
    console.log(userData);
    if (userData) {
      deleteFile(userData.file.pathName).catch((e) =>
        console.log("error deleting", e)
      );

      if (userData.pdfPath !== undefined) {

        deleteFile(userData.pdfPath).catch((e) =>
          console.log("error deleting", e)
        );

      }
      dataMap.delete("file")
    }
  });
  // TODO: IMPLEMENT DELETING DOCUMENTS
  // TODO: FRONTEND, COINSLOT MECHANISM
  uploader.on("saved", (e: any) => {
    // implement delete uploaded documents

    dataMap.set("file", { file: e.file, isPrinted: false });
    // const userData = dataMap.get(socket.id);
    const userData = dataMap.get("file")
    console.log("userData", userData)
    if (userData) {
      const ext = path.extname(userData.file.name)
      if (ext !== ".pdf") {
        convertToPdf(userData.file.pathName)
          .then((pdfPath) => {
            getPdfData(pdfPath)
              .then((data) => {
                dataMap.set("file", {
                  ...userData,
                  pdfData: data,
                  pdfPath: pdfPath,
                });
                console.log("done converting", data)
                socket.emit("pdfInfo", data);
              })
              .catch((e: any) => {
                console.log("pdfData error:", e);
              });
          })
          // /home/adrian/Projects/pisoprint/dist/uploads/1663650329404.docx.pdf
          .catch((e) => {
            console.log("convert error: ", e);
          });
        return
      }
      // else just continue no need to convert pdf
      // TODO: ADD PREVIEW FEATURE TO PREVIEW WHAT TO BE PRINT maybe not because this does have page options
      getPdfData(userData.file.pathName)
        .then((data) => {
          dataMap.set("file", {
            ...userData,
            pdfData: data,
            pdfPath: userData.file.pathName,
          });
          // TODO: make the print option fit to page if the page size is unknown
          socket.emit("pdfInfo", data);
        })
        .catch((e: any) => {
          console.log("pdfData error:", e);
        });
    }

    console.log("saved: ", e);
  });

  uploader.on("error", (e: any) => {
    console.log("Error: ", e);
  });

  uploader.dir = pathUploads;
  uploader.listen(socket);

  // TODO: coin slot
  socket.on("print", (e, cb) => {
    socket.emit("waitingForCoins");
    // implement inserting coins
    const userData = dataMap.get("file");
    printer.setDefaultPrinter("PDF")
    console.log(userData);
    if (userData) {

      if (userData.pdfPath !== undefined) {
        const pathPDF = userData?.pdfPath

        printer.print(pathPDF,).then(val => {
          console.log("done printing")
          deleteFile(userData.file.pathName).catch((e) =>
            console.log("error deleting", e)
          );
          deleteFile(pathPDF).catch((e) =>
            console.log("error deleting", e)
          );
          dataMap.delete("file")
        }).catch(e => console.log("error printing", e))
      }
    }
  });

  socket.on("disconnect", () => {
    // const userData = dataMap.get("file");
    // if (userData) {
    //   deleteFile(userData.file.pathName).catch((e) =>
    //     console.log("error deleting", e)
    //   );
    //   if (userData.pdfPath !== undefined) {
    //     deleteFile(userData.pdfPath).catch((e) =>
    //       console.log("error deleting", e)
    //     );
    //   }
    // }
    // dataMap.delete("file");
  });
});

app.get("/get-printers", async (req, res) => {
  const printers = await printer.getPrinters();
  res.json({ printers: printers });
});

app.post("/set-default-printer", async (req, res) => {
  const printer = req.body.printer;
  console.log(printer);
  printer.setDefaultPrinter(printer);
  res.json({ success: true });
});

app.post("/print", async (req, res) => {
  const userData = dataMap.get("file");
  if (userData) {
    if (userData.pdfPath !== undefined) {
      printer.print(userData.pdfPath)
    }
  }
})

app.get("/pdf", async (req, res) => {
  const userData = dataMap.get("file");
  if (userData) {
    if (userData.pdfPath !== undefined) {

      res.sendFile(userData.pdfPath)
    }
  }
})

httpServer.listen(3000, () => {
  console.log("listening at 3000");
});
