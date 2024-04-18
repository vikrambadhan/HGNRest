// const mongoose = require('mongoose');
// const Project = require('../models/project');
// const Task = require('../models/task');
const WBS = require('../models/wbs');
const wbsController = require('./wbsController');
const helper = require('../utilities/permissions');
const { mockReq, mockRes, assertResMock } = require('../test');

const makeSut = () => {
  const { getAllWBS, postWBS, deleteWBS } = wbsController(WBS);

  return { getAllWBS, postWBS, deleteWBS };
};

const flushPromises = async () => new Promise(setImmediate);

const mockHasPermission = (value) =>
  jest.spyOn(helper, 'hasPermission').mockImplementationOnce(() => Promise.resolve(value));

describe('Wbs Controller', () => {
  beforeEach(() => {
    mockReq.params.projectId = '6237f9af9820a0134ca79c5d';
    mockReq.body.wbsName = 'New WBS';
    mockReq.body.isActive = true;
    mockReq.params.id = '6237f9af9820a0134ca79c5c';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllWBS method', () => {
    test('Returns 404 if an error occurs when querying the database.', async () => {
      const { getAllWBS } = makeSut();

      const errMsg = 'Error when sorting!';
      const findObj = { sort: () => {} };

      const findSpy = jest.spyOn(WBS, 'find').mockReturnValueOnce(findObj);
      const sortSpy = jest.spyOn(findObj, 'sort').mockRejectedValueOnce(new Error(errMsg));

      const response = getAllWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(404, new Error(errMsg), response, mockRes);
      expect(findSpy).toHaveBeenCalledWith(
        { projectId: { $in: [mockReq.params.projectId] } },
        'wbsName isActive modifiedDatetime',
      );
      expect(sortSpy).toHaveBeenCalledWith({ modifiedDatetime: -1 });
    });

    test('Returns 200 if all is successful', async () => {
      const { getAllWBS } = makeSut();

      const findObj = { sort: () => {} };
      const result = [{ id: 'randomId' }];

      const findSpy = jest.spyOn(WBS, 'find').mockReturnValueOnce(findObj);
      const sortSpy = jest.spyOn(findObj, 'sort').mockResolvedValueOnce(result);

      const response = getAllWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(200, result, response, mockRes);
      expect(findSpy).toHaveBeenCalledWith(
        { projectId: { $in: [mockReq.params.projectId] } },
        'wbsName isActive modifiedDatetime',
      );
      expect(sortSpy).toHaveBeenCalledWith({ modifiedDatetime: -1 });
    });
  });

  describe('postWBS method', () => {
    test('Returns 403 if the user does not have permission', async () => {
      const { postWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(false);

      const response = await postWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(
        403,
        { error: 'You are not authorized to create new projects.' },
        response,
        mockRes,
      );
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'postWbs');
    });

    test('Returns 400 if req.body does not contain wbsName or isActive', async () => {
      const { postWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(true);

      mockReq.body.wbsName = null;
      mockReq.body.isActive = null;

      const response = await postWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(
        400,
        { error: 'WBS Name and active status are mandatory fields' },
        response,
        mockRes,
      );
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'postWbs');
    });

    test('returns 500 if an error occurs when saving', async () => {
      const { postWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(true);

      const err = 'failed to save';
      jest.spyOn(WBS.prototype, 'save').mockRejectedValueOnce(new Error(err));
      const response = await postWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(500, { error: new Error(err) }, response, mockRes);
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'postWbs');
    });

    test('Returns 201 if all is successful', async () => {
      const { postWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(true);

      jest.spyOn(WBS.prototype, 'save').mockResolvedValueOnce({ _id: '123random' });
      const response = await postWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(201, { _id: '123random' }, response, mockRes);
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'postWbs');
    });
  });

  describe('deleteWBS method', () => {
    test('Returns 403 if the user does not have permission', async () => {
      const { deleteWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(false);

      const response = await deleteWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(
        403,
        { error: 'You are not authorized to delete projects.' },
        response,
        mockRes,
      );
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'deleteWbs');
    });

    test('Returns 400 if and error occurs when querying DB', async () => {
      const { deleteWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(true);
      const findByIdSpy = jest
        .spyOn(WBS, 'findById')
        .mockImplementationOnce((_, cb) => cb(true, null));

      const response = await deleteWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(400, { error: 'No valid records found' }, response, mockRes);
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'deleteWbs');
      expect(findByIdSpy).toHaveBeenCalledWith(mockReq.params.id, expect.anything());
    });

    test('returns 400 if an error occurs when removing the WBS', async () => {
      const { deleteWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(true);
      const record = { _id: 'randomId', remove: () => {} };
      const err = 'Remove failed';

      const findByIdSpy = jest
        .spyOn(WBS, 'findById')
        .mockImplementationOnce((_, cb) => cb(false, record));
      jest.spyOn(record, 'remove').mockRejectedValueOnce(new Error(err));

      const response = await deleteWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(400, new Error(err), response, mockRes);
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'deleteWbs');
      expect(findByIdSpy).toHaveBeenCalledWith(mockReq.params.id, expect.anything());
    });

    test('Returns 201 if all is successful', async () => {
      const { deleteWBS } = makeSut();
      const hasPermissionSpy = mockHasPermission(true);
      const record = { _id: 'randomId', remove: () => {} };

      const findByIdSpy = jest
        .spyOn(WBS, 'findById')
        .mockImplementationOnce((_, cb) => cb(false, record));
      jest.spyOn(record, 'remove').mockResolvedValueOnce(true);

      const response = await deleteWBS(mockReq, mockRes);
      await flushPromises();

      assertResMock(200, { message: ' WBS successfully deleted' }, response, mockRes);
      expect(hasPermissionSpy).toHaveBeenCalledWith(mockReq.body.requestor, 'deleteWbs');
      expect(findByIdSpy).toHaveBeenCalledWith(mockReq.params.id, expect.anything());
    });
  });
});
