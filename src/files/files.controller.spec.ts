import { FilesController } from './files.controller';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(() => {
    controller = new FilesController();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('returns the url of the uploaded file', () => {
      const file = {
        filename: '1700000000000-avatar.png',
      } as Express.Multer.File;

      expect(controller.upload(file)).toEqual({
        url: '/uploads/1700000000000-avatar.png',
      });
    });
  });
});
