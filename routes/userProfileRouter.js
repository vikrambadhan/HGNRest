var express = require('express');


var routes = function (userProfile) {

  var controller = require('../controllers/userProfileController')(userProfile);

  var userProfileRouter = express.Router();
  userProfileRouter.route('/userProfile')
    .get(controller.getUserProfiles)
    .post(controller.postUserProfile);

  userProfileRouter.route('/userProfile/:projectId')
    .get(controller.getProjectMembers);

  userProfileRouter.route('/userProfile/:userId')
    .get(controller.getUserById)
    .put(controller.putUserProfile);


  userProfileRouter.route('/userProfile/reportees/:userId')
    .get(controller.getreportees);

  userProfileRouter.route('/userProfile/teammembers/:userId')
    .get(controller.getTeamMembersofUser);


  userProfileRouter.route('/userProfile/:userId/updatePassword')
    .patch(controller.updatepassword)

  userProfileRouter.route('/userProfile/name/:userId')
    .get(controller.getUserName);


  return userProfileRouter;

};



module.exports = routes;
