const timeEntry = require('../models/timeentry');
const userProfile = require('../models/userProfile');
const project = require('../models/project');
const team = require('../models/team');
const actionItem = require('../models/actionItem');
const notification = require('../models/notification');
const wbs = require('../models/wbs');
const task = require('../models/task');
const timer = require('../models/timer');
const popup = require('../models/popupEditor');
const popupBackup = require('../models/popupEditorBackup');
const taskNotification = require('../models/taskNotification');
const badge = require('../models/badge');
const inventoryItem = require('../models/inventoryItem');
const inventoryItemType = require('../models/inventoryItemType');
const role = require('../models/role');
const ownerMessage = require('../models/ownerMessage');
const ownerStandardMessage = require('../models/ownerStandardMessage');
const reason = require('../models/reason')

const userProfileRouter = require('../routes/userProfileRouter')(userProfile);
const badgeRouter = require('../routes/badgeRouter')(badge);
const dashboardRouter = require('../routes/dashboardRouter')();
const timeEntryRouter = require('../routes/timeentryRouter')(timeEntry);
const projectRouter = require('../routes/projectRouter')(project);
const teamRouter = require('../routes/teamRouter')(team);
const actionItemRouter = require('../routes/actionItemRouter')(actionItem);
const notificationRouter = require('../routes/notificationRouter')(notification);
const loginRouter = require('../routes/loginRouter')();
const forgotPwdRouter = require('../routes/forgotPwdRouter')(userProfile);
const forcePwdRouter = require('../routes/forcePwdRouter')(userProfile);
const reportsRouter = require('../routes/reportsRouter')();
const wbsRouter = require('../routes/wbsRouter')(wbs);
const taskRouter = require('../routes/taskRouter')(task);
const timerRouter = require('../routes/timerRouter')(timer);
const popupRouter = require('../routes/popupEditorRouter')(popup);
const popupBackupRouter = require('../routes/popupEditorBackupRouter')(popupBackup);
const taskNotificationRouter = require('../routes/taskNotificationRouter')(taskNotification);
const inventoryRouter = require('../routes/inventoryRouter')(inventoryItem, inventoryItemType);
const timeZoneAPIRouter = require('../routes/timeZoneAPIRoutes')();

const taskEditSuggestion = require('../models/taskEditSuggestion');
const taskEditSuggestionRouter = require('../routes/taskEditSuggestionRouter')(taskEditSuggestion);
const roleRouter = require('../routes/roleRouter')(role);
const ownerMessageRouter = require('../routes/ownerMessageRouter')(ownerMessage);
const ownerStandardMessageRouter = require('../routes/ownerStandardMessageRouter')(ownerStandardMessage);

const reasonRouter = require('../routes/reasonRouter')(reason, userProfile)

module.exports = function (app) {
  app.use('/api', forgotPwdRouter);
  app.use('/api', loginRouter);
  app.use('/api', forcePwdRouter);
  app.use('/api', projectRouter);
  app.use('/api', userProfileRouter);
  app.use('/api', dashboardRouter);
  app.use('/api', timeEntryRouter);
  app.use('/api', teamRouter);
  app.use('/api', actionItemRouter);
  app.use('/api', notificationRouter);
  app.use('/api', reportsRouter);
  app.use('/api', wbsRouter);
  app.use('/api', taskRouter);
  app.use('/api', timerRouter);
  app.use('/api', popupRouter);
  app.use('/api', popupBackupRouter);
  app.use('/api', taskNotificationRouter);
  app.use('/api', badgeRouter);
  app.use('/api', inventoryRouter);
  app.use('/api', timeZoneAPIRouter);
  app.use('/api', taskEditSuggestionRouter);
  app.use('/api', roleRouter);
  app.use('/api', ownerMessageRouter);
  app.use('/api', ownerStandardMessageRouter);
};
