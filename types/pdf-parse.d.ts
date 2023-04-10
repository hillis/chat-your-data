declare module "pdf-parse" {
  const pdfParse: (dataBuffer: Buffer, options?: object) => Promise<object>;
  export default pdfParse;
}
