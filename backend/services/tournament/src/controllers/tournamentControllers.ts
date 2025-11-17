// Lightweight stubbed controllers for the tournament service.
// The full implementation has been moved to `tournamentControllers.full.ts`.
import { FastifyRequest, FastifyReply } from 'fastify';

// Empty handler functions — clean structure only. No logic inside handlers.
export async function createTournament(request: FastifyRequest, reply: FastifyReply) {}

export async function deleteTournament(request: FastifyRequest, reply: FastifyReply) {}

export async function updateTournamentStatus(request: FastifyRequest, reply: FastifyReply) {}

export async function getTournament(request: FastifyRequest, reply: FastifyReply) {}

export async function getTournaments(request: FastifyRequest, reply: FastifyReply) {}

export async function joinTournament(request: FastifyRequest, reply: FastifyReply) {}

export async function leaveTournament(request: FastifyRequest, reply: FastifyReply) {}

export async function TournamentStart(request: FastifyRequest, reply: FastifyReply) {}

export async function reportMatchResult(request: FastifyRequest, reply: FastifyReply) {}
