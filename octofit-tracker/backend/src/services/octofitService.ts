import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError('Invalid payload', 400);
  }
  return value as Record<string, unknown>;
}

function normalizeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((member) => String(member).trim())
    .filter(Boolean);

  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError('One or more member IDs are invalid', 400);
    }
  }

  return [...new Set(ids)];
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const payload = asRecord(input);
  const userId = payload.userId;
  const teamId = payload.teamId;
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutes = Number(payload.minutes);

  if (!mongoose.Types.ObjectId.isValid(String(userId)) || !mongoose.Types.ObjectId.isValid(String(teamId))) {
    throw new HttpError('User and team IDs are required', 400);
  }

  if (!type) {
    throw new HttpError('Activity type is required', 400);
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new HttpError('Minutes must be greater than zero', 400);
  }

  const userExists = await User.exists({ _id: userId });
  const teamExists = await Team.exists({ _id: teamId });
  if (!userExists || !teamExists) {
    throw new HttpError('User or team not found', 400);
  }

  const points = Math.max(1, Math.round(minutes));
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = asRecord(input);
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';

  if (!name) {
    throw new HttpError('Team name is required', 400);
  }

  if (!mascot) {
    throw new HttpError('Team mascot is required', 400);
  }

  const members = normalizeIdList(payload.members);
  const team = await Team.create({
    name,
    mascot,
    members: members.map((id) => new mongoose.Types.ObjectId(id)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    {
      $project: {
        _id: 0,
        teamId: '$_id',
        totalPoints: 1,
        teamName: { $ifNull: [{ $arrayElemAt: ['$team.name', 0] }, 'Unknown'] },
      },
    },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

function focusForUser(user: { fitnessGoal?: string | null }, recentType?: string) {
  const goal = user.fitnessGoal?.trim().toLowerCase();
  if (goal) {
    return goal;
  }

  const direct = recentType?.trim().toLowerCase();
  if (!direct) {
    return 'general';
  }

  if (['run', 'walk', 'cycle', 'swim'].includes(direct)) {
    return 'endurance';
  }

  if (['lift', 'strength', 'push', 'pull'].includes(direct)) {
    return 'strength';
  }

  return direct;
}

export async function suggestWorkouts(userEmail: string) {
  const email = String(userEmail ?? '').trim();
  if (!email) {
    throw new HttpError('User email is required', 400);
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new HttpError('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const preferredFocus = focusForUser(user, recentActivities[0]?.type);

  const workouts = await Workout.find({ focus: preferredFocus }).sort({ minutes: -1, title: 1 }).lean();
  const fallback = workouts.length > 0 ? workouts : await Workout.find().sort({ minutes: -1, title: 1 }).lean();

  return fallback.map((workout, index) => ({
    ...workout,
    reason: index === 0
      ? `Based on your recent ${recentActivities[0]?.type ?? 'activity'} and ${user.fitnessGoal ?? 'fitness'} goal, this ${workout.focus} plan matches your current pattern.`
      : `Continue building your ${preferredFocus} momentum with this ${workout.focus} suggestion.`,
  }));
}

export { User };
