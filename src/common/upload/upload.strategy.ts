export interface Strategy {
  upload(file: Express.Multer.File): Promise<string>;
}
