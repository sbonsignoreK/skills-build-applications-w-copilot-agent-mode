import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type InputRecord = Record<string, unknown>;

function isInputRecord(input: unknown): input is InputRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function requestError(message: string, status: number): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isInputRecord(input)) throw requestError('Activity details are required', 400);
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw requestError('A valid userId is required', 400);
  }
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw requestError('A valid teamId is required', 400);
  }
  if (typeof type !== 'string' || !type.trim()) throw requestError('An activity type is required', 400);
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw requestError('Minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw requestError('User not found', 404);
  if (!team) throw requestError('Team not found', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isInputRecord(input)) throw requestError('Team details are required', 400);
  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;
  if (typeof name !== 'string' || !name.trim()) throw requestError('A team name is required', 400);
  if (typeof mascot !== 'string' || !mascot.trim()) throw requestError('A team mascot is required', 400);
  if (!Array.isArray(members)) throw requestError('Members must be valid user IDs', 400);

  const memberIds: string[] = [];
  for (const member of members) {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      throw requestError('Members must be valid user IDs', 400);
    }
    memberIds.push(member);
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  if (uniqueMemberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
    if (existingMembers !== uniqueMemberIds.length) throw requestError('One or more team members were not found', 404);
  }

  return Team.create({ name, mascot, members: uniqueMemberIds });
}

export async function getLeaderboard() {
  const [teams, activities] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.find().select('team points').lean(),
  ]);
  const pointsByTeam = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    pointsByTeam.set(teamId, (pointsByTeam.get(teamId) ?? 0) + activity.points);
  }

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw requestError('User not found', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).select('type occurredAt').sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal?.trim().toLowerCase();
  const activityTypes = activities.map((activity) => activity.type.trim().toLowerCase());

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const activityIndex = activityTypes.indexOf(focus);
      if (goal && focus === goal) {
        return { ...workout, reason: `Recommended because it matches your ${user.fitnessGoal} fitness goal.`, priority: 100 };
      }
      if (activityIndex !== -1) {
        return {
          ...workout,
          reason: `Recommended based on your recent ${activities[activityIndex].type} activity.`,
          priority: 10 - activityIndex,
        };
      }
      return null;
    })
    .filter((workout): workout is NonNullable<typeof workout> => workout !== null)
    .sort((left, right) => right.priority - left.priority)
    .map(({ priority: _priority, ...workout }) => workout);
}

export { User };
