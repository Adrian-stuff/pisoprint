"use strict";
// (async () => {
//   const { getDefaultPrinter, getPrinters, print } =
//     process.platform === "win32"
//       ? await import("pdf-to-printer")
//       : await import("unix-print");
// })();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const unix_print_1 = require("unix-print");
class Printer {
    constructor(printer) {
        this.memoizedJson = {
            printer: undefined,
            printers: undefined,
            defaultPrinter: undefined,
        };
        this.printer = printer;
        if (printer) {
            this.memoizedJson.printer = printer;
        }
    }
    getPrinters() {
        return __awaiter(this, void 0, void 0, function* () {
            // return await getPrinters();
            if (typeof this.memoizedJson.printers === "undefined") {
                const printers = yield (0, unix_print_1.getPrinters)();
                this.memoizedJson.printers = printers;
                return this.memoizedJson.printers;
            }
            return this.memoizedJson.printers;
        });
    }
    getDefaultPrinter() {
        return __awaiter(this, void 0, void 0, function* () {
            // return await getDefaultPrinter();
            if (typeof this.memoizedJson.defaultPrinter === "undefined") {
                const defaultPrinter = yield (0, unix_print_1.getDefaultPrinter)();
                this.memoizedJson.defaultPrinter = defaultPrinter;
                return this.memoizedJson.defaultPrinter;
            }
            return this.memoizedJson.defaultPrinter;
        });
    }
    setDefaultPrinter(printer) {
        this.printer = printer;
    }
    print(file, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, unix_print_1.print)(file, this.printer, options);
        });
    }
}
exports.default = Printer;
