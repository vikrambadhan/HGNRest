const mongoose = require('mongoose');
const userProfile = require('../models/userProfile');
const { hasPermission } = require('../utilities/permissions');
const cache = require('../utilities/nodeCache')();
const Logger = require('../startup/logger');

const teamcontroller = function (Team) {
  const getAllTeams = function (req, res) {
    Team.find({})
      .sort({ teamName: 1 })
      .then((results) => res.status(200).send(results))
      .catch((error) => {
        Logger.logException(error);
        res.status(404).send(error);
      });
  };

  const getTeamById = function (req, res) {
    const { teamId } = req.params;

    Team.findById(teamId)
      .then((results) => res.status(200).send(results))
      .catch((error) => {
        Logger.logException(error, null, `teamId: ${teamId}`);
        res.status(404).send(error);
      });
  };

  const postTeam = async function (req, res) {
    if (!(await hasPermission(req.body.requestor, 'postTeam'))) {
      res.status(403).send({ error: 'You are not authorized to create teams.' });
      return;
    }

    if (await Team.exists({ teamName: req.body.teamName })) {
      res.status(403).send({ error: `Team Name "${req.body.teamName}" already exists` });
      return;
    }

    const team = new Team();
    team.teamName = req.body.teamName;
    team.isActive = req.body.isActive;
    team.createdDatetime = Date.now();
    team.modifiedDatetime = Date.now();

    // Check if a team with the same name already exists
    Team.findOne({ teamName: team.teamName })
      .then((existingTeam) => {
        if (existingTeam) {
          // If a team with the same name exists, return an error
          res.status(400).send({ error: 'A team with this name already exists' });
        } else {
          // If no team with the same name exists, save the new team
          team
            .save()
            .then((results) => res.send(results).status(200))
            .catch((error) => {
              Logger.logException(error, null, `teamName: ${req.body.teamName}`);
              res.send(error).status(404);
            });
        }
      })
      .catch((error) => {
        Logger.logException(error, null, `teamName: ${req.body.teamName}`);
        res.send(error).status(404);
      });
  };

  const deleteTeam = async function (req, res) {
    if (!(await hasPermission(req.body.requestor, 'deleteTeam'))) {
      res.status(403).send({ error: 'You are not authorized to delete teams.' });
      return;
    }
    const { teamId } = req.params;
    Team.findById(teamId, (error, record) => {
      if (error || record === null) {
        res.status(400).send({ error: 'No valid records found' });
        return;
      }
      const removeteamfromprofile = userProfile
        .updateMany({}, { $pull: { teams: record._id } })
        .exec();
      const deleteteam = record.remove();

      Promise.all([removeteamfromprofile, deleteteam])
        .then(
          res.status(200).send({ message: 'Team successfully deleted and user profiles updated' }),
        )
        .catch((errors) => {
          Logger.logException(error, null, `teamId: ${teamId}`);
          res.status(400).send(errors);
        });
    }).catch((error) => {
      Logger.logException(error, null, `teamId: ${teamId}`);
      res.status(400).send(error);
    });
  };

  const putTeam = async function (req, res) {
    if (!(await hasPermission(req.body.requestor, 'putTeam'))) {
      res.status(403).send('You are not authorized to make changes in the teams.');
      return;
    }

    const { teamId } = req.params;

    Team.findById(teamId, (error, record) => {
      if (error || record === null) {
        res.status(400).send('No valid records found');
        return;
      }

      const canEditTeamCode =
        req.body.requestor.role === 'Owner' ||
        req.body.requestor.permissions?.frontPermissions.includes('editTeamCode');

      if (!canEditTeamCode) {
        res.status(403).send('You are not authorized to edit team code.');
        return;
      }

      record.teamName = req.body.teamName;
      record.isActive = req.body.isActive;
      record.teamCode = req.body.teamCode;
      record.createdDatetime = Date.now();
      record.modifiedDatetime = Date.now();

      record
        .save()
        .then((results) => res.status(200).send(results._id))
        .catch((errors) => {
          Logger.logException(errors, null, `TeamId: ${teamId} Request:${req.body}`);
          res.status(400).send(errors);
        });
    });
  };

  const assignTeamToUsers = async function (req, res) {
    // verify requestor is administrator, teamId is passed in request params and is valid mongoose objectid, and request body contains  an array of users

    if (!(await hasPermission(req.body.requestor, 'assignTeamToUsers'))) {
      res.status(403).send({ error: 'You are not authorized to perform this operation' });
      return;
    }

    const { teamId } = req.params;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      res.status(400).send({ error: 'Invalid teamId' });
      return;
    }

    // verify team exists
    const targetTeam = await Team.findById(teamId);

    if (!targetTeam || targetTeam.length === 0) {
      res.status(400).send({ error: 'Invalid team' });
      return;
    }

    try {
      const { userId, operation } = req.body;

      // if user's profile is stored in cache, clear it so when you visit their profile page it will be up to date
      if (cache.hasCache(`user-${userId}`)) cache.removeCache(`user-${userId}`);

      if (operation === 'Assign') {
        await Team.findOneAndUpdate(
          { _id: teamId },
          { $addToSet: { members: { userId } }, $set: { modifiedDatetime: Date.now() } },
          { new: true },
        );
        const newMember = await userProfile.findOneAndUpdate(
          { _id: userId },
          { $addToSet: { teams: teamId } },
          { new: true },
        );
        res.status(200).send({ newMember });
      } else {
        await Team.findOneAndUpdate(
          { _id: teamId },
          { $pull: { members: { userId } }, $set: { modifiedDatetime: Date.now() } },
        );
        await userProfile.findOneAndUpdate(
          { _id: userId },
          { $pull: { teams: teamId } },
          { new: true },
        );
        res.status(200).send({ result: 'Delete Success' });
      }
    } catch (error) {
      Logger.logException(error, null, `TeamId: ${teamId} Request:${req.body}`);
      res.status(500).send({ error });
    }
  };

  const getTeamMembership = function (req, res) {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      res.status(400).send({ error: 'Invalid request' });
      return;
    }
    Team.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(teamId) },
      },
      { $unwind: '$members' },
      {
        $lookup: {
          from: 'userProfiles',
          localField: 'members.userId',
          foreignField: '_id',
          as: 'userProfile',
        },
      },
      { $unwind: '$userProfile' },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ addDateTime: '$members.addDateTime' }, '$userProfile'],
          },
        },
      },
    ])
      .then((result) => res.status(200).send(result))
      .catch((error) => {
        Logger.logException(error, null, `TeamId: ${teamId} Request:${req.body}`);
        res.status(500).send(error);
      });
  };
  const updateTeamVisibility = async (req, res) => {
    console.log("==============>   9 ");

    const { visibility, teamId, userId } = req.body;
  
    try {
      Team.findById(teamId, (error, team) => {
        if (error || team === null) {
          res.status(400).send('No valid records found');
          return;
        }
  
        const memberIndex = team.members.findIndex(member => member.userId.toString() === userId);
        if (memberIndex === -1) {
          res.status(400).send('Member not found in the team.');
          return;
        }
  
        team.members[memberIndex].visible = visibility;
        team.modifiedDatetime = Date.now();
  
        team.save()
          .then(updatedTeam => {  
            // Additional operations after team.save() 
            const assignlist = [];
            const unassignlist = [];
            team.members.forEach(member => {
              if (member.userId.toString() === userId) {
                // Current user, no need to process further
                return;
              }
            
              if (visibility) {
                assignlist.push(member.userId);
              } else {
                console.log("Visiblity set to false so removing it");
                unassignlist.push(member.userId);
              }
            });
  
            const addTeamToUserProfile = userProfile
              .updateMany({ _id: { $in: assignlist } }, { $addToSet: { teams: teamId } })
              .exec();
            const removeTeamFromUserProfile = userProfile
              .updateMany({ _id: { $in: unassignlist } }, { $pull: { teams: teamId } })
              .exec();
  
            Promise.all([addTeamToUserProfile, removeTeamFromUserProfile])
              .then(() => {
                res.status(200).send({ result: 'Done' });
              })
              .catch((error) => {
                res.status(500).send({ error });
              });
          })
          .catch(errors => {
            console.error('Error saving team:', errors);
            res.status(400).send(errors);
          });
  
      });
    } catch (error) {
      res.status(500).send('Error updating team visibility: ' + error.message);
    }
  };

  return {
    getAllTeams,
    getTeamById,
    postTeam,
    deleteTeam,
    putTeam,
    assignTeamToUsers,
    getTeamMembership,
    updateTeamVisibility,
  };
};

module.exports = teamcontroller;
