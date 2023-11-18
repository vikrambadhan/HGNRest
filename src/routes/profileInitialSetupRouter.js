const express = require('express');

const routes = function (ProfileInitialSetupToken, userProfile, Project , mapLocations) {
    const ProfileInitialSetup = express.Router();
    const controller = require('../controllers/profileInitialSetupController')(ProfileInitialSetupToken, userProfile, Project , mapLocations);
    ProfileInitialSetup.route('/getInitialSetuptoken')
        .post(controller.getSetupToken);
    ProfileInitialSetup.route('/ProfileInitialSetup').post(controller.setUpNewUser)
    ProfileInitialSetup.route('/validateToken').post(controller.validateSetupToken)
    ProfileInitialSetup.route('/getTimeZoneAPIKeyByToken').post(controller.getTimeZoneAPIKeyByToken)
    

    return ProfileInitialSetup;
};

module.exports = routes;
