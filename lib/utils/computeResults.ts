import { Vote, Nominee } from '@/types';

export interface RankedNominee {
  nomineeId: string;
  studentName: string;
  department: string;
  semester: string;
  cgpa: number;
  rollNumber: string;
  totalScore: number;
  voteCount: number;
  rank: number;
}

export interface ComputedResults {
  rankings: RankedNominee[];
  winnerId: string | null;
  isTied: boolean;
  tiedNomineeIds: string[];
  totalVoters: number;
}

/**
 * Pure function: compute rankings from submitted votes.
 * Winner = highest sum of all SWB member ratings (no averaging).
 * Tie-breaking: higher CGPA wins. Still tied → isTied = true, admin must decide.
 */
export function computeResults(
  votes: Vote[],
  nominees: Nominee[]
): ComputedResults {
  const submittedVotes = votes.filter((v) => v.isSubmitted);
  const totalVoters = submittedVotes.length;

  // Sum ratings per nominee across all submitted votes
  const totalRatings: Record<string, number> = {};
  const voteCounts: Record<string, number> = {};

  for (const vote of submittedVotes) {
    for (const [nomineeId, rating] of Object.entries(vote.ratings)) {
      totalRatings[nomineeId] = (totalRatings[nomineeId] ?? 0) + rating;
      voteCounts[nomineeId] = (voteCounts[nomineeId] ?? 0) + 1;
    }
  }

  // Build ranked list
  const rankings: RankedNominee[] = nominees.map((nominee) => ({
    nomineeId: nominee.studentId,
    studentName: nominee.studentName,
    department: nominee.department,
    semester: nominee.semester,
    cgpa: nominee.cgpa,
    rollNumber: nominee.rollNumber,
    totalScore: totalRatings[nominee.studentId] ?? 0,
    voteCount: voteCounts[nominee.studentId] ?? 0,
    rank: 0,
  }));

  // Sort: primary = totalScore desc, secondary = cgpa desc
  rankings.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.cgpa - a.cgpa;
  });

  // Assign ranks
  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  if (rankings.length === 0) {
    return { rankings, winnerId: null, isTied: false, tiedNomineeIds: [], totalVoters };
  }

  const topScore = rankings[0].totalScore;
  const topCgpa = rankings[0].cgpa;

  // Find all nominees with the same top score and same top CGPA (true tie)
  const trueTied = rankings.filter(
    (r) => r.totalScore === topScore && r.cgpa === topCgpa
  );

  const isTied = trueTied.length > 1;
  const tiedNomineeIds = isTied ? trueTied.map((r) => r.nomineeId) : [];
  const winnerId = isTied ? null : rankings[0].nomineeId;

  return { rankings, winnerId, isTied, tiedNomineeIds, totalVoters };
}
