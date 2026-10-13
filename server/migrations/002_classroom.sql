-- V2-9 classroom: assignment points, one submission and one grade per
-- student and assignment, indexes for the class feeds. Portable SQL.

ALTER TABLE assignments ADD COLUMN points INTEGER NOT NULL DEFAULT 10;

CREATE UNIQUE INDEX idx_submissions_student ON submissions (assignment_id, student_id);
CREATE UNIQUE INDEX idx_grades_submission ON grades (submission_id);
CREATE INDEX idx_announcements_class ON announcements (class_id, created_at);
CREATE INDEX idx_messages_class ON messages (class_id, created_at);
CREATE INDEX idx_members_class ON class_members (class_id);
