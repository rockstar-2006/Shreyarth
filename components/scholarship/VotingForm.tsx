'use client';

import { useState } from 'react';
import { Nominee, RatingMap } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { RatingSlider } from '@/components/ui/RatingSlider';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface VotingFormProps {
  nominees: Nominee[];
  onSubmit: (ratings: RatingMap) => Promise<void>;
  isSubmitting?: boolean;
  alreadyVoted?: boolean;
  existingRatings?: RatingMap;
}

export function VotingForm({
  nominees,
  onSubmit,
  isSubmitting,
  alreadyVoted,
  existingRatings = {},
}: VotingFormProps) {
  const [ratings, setRatings] = useState<RatingMap>(
    nominees.reduce((acc, n) => ({ ...acc, [n.studentId]: existingRatings[n.studentId] ?? 5 }), {})
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const allRated = nominees.every((n) => ratings[n.studentId] >= 1 && ratings[n.studentId] <= 10);

  const handleRatingChange = (nomineeId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [nomineeId]: value }));
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    await onSubmit(ratings);
  };

  if (alreadyVoted) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 font-medium">
          ✅ You have already submitted your ratings. Ratings are locked.
        </div>
        {nominees.map((nominee) => (
          <Card key={nominee.id}>
            <CardHeader>
              <h3 className="font-semibold text-smvitm-text">{nominee.studentName}</h3>
              <p className="text-sm text-smvitm-textSecondary">
                {nominee.department} — Sem {nominee.semester} — CGPA {nominee.cgpa.toFixed(2)}
              </p>
            </CardHeader>
            <CardBody>
              <RatingSlider
                nomineeId={nominee.studentId}
                value={existingRatings[nominee.studentId] ?? 5}
                onChange={() => {}}
                disabled
                label="Your Rating"
              />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {nominees.map((nominee) => (
          <Card key={nominee.id}>
            <CardHeader>
              <h3 className="font-semibold text-smvitm-text">{nominee.studentName}</h3>
              <p className="text-sm text-smvitm-textSecondary">
                {nominee.department} — Sem {nominee.semester} — CGPA: {nominee.cgpa.toFixed(2)} — Roll: {nominee.rollNumber}
              </p>
            </CardHeader>
            <CardBody>
              <RatingSlider
                nomineeId={nominee.studentId}
                value={ratings[nominee.studentId] ?? 5}
                onChange={handleRatingChange}
                label="Rate this nominee (1–10)"
              />
            </CardBody>
          </Card>
        ))}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-smvitm-border">
          {!allRated && (
            <p className="text-sm text-smvitm-textSecondary" aria-live="polite">
              Please rate all nominees before submitting.
            </p>
          )}
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!allRated || isSubmitting}
            isLoading={isSubmitting}
            size="lg"
            aria-label="Submit your votes"
          >
            Submit Votes
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Submission"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting} aria-label="Confirm vote submission">
              Confirm &amp; Submit
            </Button>
          </>
        }
      >
        <p className="text-smvitm-textSecondary">
          You are about to submit your ratings. <strong>This action is final and cannot be changed.</strong>
        </p>
        <div className="mt-4 space-y-2">
          {nominees.map((nominee) => (
            <div key={nominee.id} className="flex justify-between text-sm bg-smvitm-bg px-3 py-2 rounded">
              <span className="font-medium">{nominee.studentName}</span>
              <span className="text-smvitm-maroon font-bold">Rating: {ratings[nominee.studentId] ?? '—'}/10</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
