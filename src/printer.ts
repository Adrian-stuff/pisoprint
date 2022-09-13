// (async () => {
//   const { getDefaultPrinter, getPrinters, print } =
//     process.platform === "win32"
//       ? await import("pdf-to-printer")
//       : await import("unix-print");
// })();

import { getPrinters, getDefaultPrinter, print } from "unix-print";

class Printer {
  printer: string | undefined;
  memoizedJson: {
    printer: string | undefined;
    printers: any;
    defaultPrinter: any;
  } = {
    printer: undefined,
    printers: undefined,
    defaultPrinter: undefined,
  };
  constructor(printer?: string) {
    this.printer = printer;
    if (printer) {
      this.memoizedJson.printer = printer;
    }
  }

  async getPrinters() {
    // return await getPrinters();
    if (typeof this.memoizedJson.printers === "undefined") {
      const printers = await getPrinters();
      this.memoizedJson.printers = printers;
      return this.memoizedJson.printers;
    }
    return this.memoizedJson.printers;
  }

  async getDefaultPrinter() {
    // return await getDefaultPrinter();
    if (typeof this.memoizedJson.defaultPrinter === "undefined") {
      const defaultPrinter = await getDefaultPrinter();
      this.memoizedJson.defaultPrinter = defaultPrinter;
      return this.memoizedJson.defaultPrinter;
    }
    return this.memoizedJson.defaultPrinter;
  }

  setDefaultPrinter(printer: string) {
    this.printer = printer;
  }

  async print(file: string, options?: string[]) {
    return await print(file, this.printer, options);
  }
}

export default Printer;
