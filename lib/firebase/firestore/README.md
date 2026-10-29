# lib/firebase/firestore/

One file per Firestore collection. All use the Firebase v9 modular SDK.

| File | Collection | Key exports |
|------|-----------|-------------|
| `users.ts` | `users/{uid}` | `createUserProfile`, `getUser`, `listUsers`, `updateUser` |
| `scholarships.ts` | `scholarships/{id}` | `createScholarship`, `getScholarship`, `listScholarships`, `updateScholarship`, `publishScholarship`, `openVoting`, `closeVoting`, `declareWinnerOnScholarship`, `subscribeToScholarships` |
| `nominees.ts` | `nominees/{id}` | `addNominee`, `listNominees`, `removeNominee`, `subscribeToNominees` |
| `votes.ts` | `votes/{scholarshipId}_{swbMemberId}` | `submitVote`, `getVote`, `hasVoted`, `listAllVotes`, `subscribeToVotes` |
| `results.ts` | `results/{scholarshipId}` | `declareWinner`, `getResult` |

## Notes

- **Vote document ID**: `{scholarshipId}_{swbMemberId}` — one atomic write per ballot.
- **Results** are computed client-side in `lib/utils/computeResults.ts` and written to `results/{id}` only when admin clicks "Declare Winner".
- All `subscribe*` functions return an `Unsubscribe` callback — always call it in `useEffect` cleanup.
