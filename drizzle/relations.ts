import { relations } from "drizzle-orm/relations";
import { jobs, applications, candidates, resumeProfiles, videoIntroductions, assessmentAttempts, assessmentAnswers, assessmentQuestions, skillAssessments, associates, recruiters, emailCampaigns, campaignRecipients, candidateTagAssignments, candidateTags, users, candidateSkillRatings, jobSkillRequirements, interviews, codingChallenges, codingSubmissions, customers, customerContacts, emailTemplates, followUpSequences, fraudDetectionEvents, interviewQuestions, interviewResponses, interviewFeedback, notificationPreferences, onboardingProcesses, onboardingTasks, questionBank, rescheduleRequests, interviewPanelists, savedJobs, savedSearches, sequenceEnrollments, sequenceSteps, taskAssignments, taskReminders, taskTemplates } from "./schema";

export const applicationsRelations = relations(applications, ({one, many}) => ({
	job: one(jobs, {
		fields: [applications.jobId],
		references: [jobs.id]
	}),
	candidate: one(candidates, {
		fields: [applications.candidateId],
		references: [candidates.id]
	}),
	resumeProfile: one(resumeProfiles, {
		fields: [applications.resumeProfileId],
		references: [resumeProfiles.id]
	}),
	videoIntroduction: one(videoIntroductions, {
		fields: [applications.videoIntroductionId],
		references: [videoIntroductions.id]
	}),
	assessmentAttempts: many(assessmentAttempts),
	candidateSkillRatings: many(candidateSkillRatings),
	interviews: many(interviews),
}));

export const jobsRelations = relations(jobs, ({one, many}) => ({
	applications: many(applications),
	interviews: many(interviews),
	jobSkillRequirements: many(jobSkillRequirements),
	customer: one(customers, {
		fields: [jobs.customerId],
		references: [customers.id]
	}),
	customerContact: one(customerContacts, {
		fields: [jobs.contactId],
		references: [customerContacts.id]
	}),
	user: one(users, {
		fields: [jobs.postedBy],
		references: [users.id]
	}),
	savedJobs: many(savedJobs),
	skillAssessments: many(skillAssessments),
}));

export const candidatesRelations = relations(candidates, ({one, many}) => ({
	applications: many(applications),
	assessmentAttempts: many(assessmentAttempts),
	associates: many(associates),
	campaignRecipients: many(campaignRecipients),
	candidateTagAssignments: many(candidateTagAssignments),
	user: one(users, {
		fields: [candidates.userId],
		references: [users.id]
	}),
	codingSubmissions: many(codingSubmissions),
	fraudDetectionEvents: many(fraudDetectionEvents),
	interviewResponses: many(interviewResponses),
	interviewFeedbacks: many(interviewFeedback),
	interviews: many(interviews),
	resumeProfiles: many(resumeProfiles),
	savedJobs: many(savedJobs),
	sequenceEnrollments: many(sequenceEnrollments),
	videoIntroductions: many(videoIntroductions),
}));

export const resumeProfilesRelations = relations(resumeProfiles, ({one, many}) => ({
	applications: many(applications),
	candidate: one(candidates, {
		fields: [resumeProfiles.candidateId],
		references: [candidates.id]
	}),
}));

export const videoIntroductionsRelations = relations(videoIntroductions, ({one, many}) => ({
	applications: many(applications),
	candidate: one(candidates, {
		fields: [videoIntroductions.candidateId],
		references: [candidates.id]
	}),
}));

export const assessmentAnswersRelations = relations(assessmentAnswers, ({one}) => ({
	assessmentAttempt: one(assessmentAttempts, {
		fields: [assessmentAnswers.attemptId],
		references: [assessmentAttempts.id]
	}),
	assessmentQuestion: one(assessmentQuestions, {
		fields: [assessmentAnswers.questionId],
		references: [assessmentQuestions.id]
	}),
}));

export const assessmentAttemptsRelations = relations(assessmentAttempts, ({one, many}) => ({
	assessmentAnswers: many(assessmentAnswers),
	skillAssessment: one(skillAssessments, {
		fields: [assessmentAttempts.assessmentId],
		references: [skillAssessments.id]
	}),
	candidate: one(candidates, {
		fields: [assessmentAttempts.candidateId],
		references: [candidates.id]
	}),
	application: one(applications, {
		fields: [assessmentAttempts.applicationId],
		references: [applications.id]
	}),
}));

export const assessmentQuestionsRelations = relations(assessmentQuestions, ({one, many}) => ({
	assessmentAnswers: many(assessmentAnswers),
	skillAssessment: one(skillAssessments, {
		fields: [assessmentQuestions.assessmentId],
		references: [skillAssessments.id]
	}),
}));

export const skillAssessmentsRelations = relations(skillAssessments, ({one, many}) => ({
	assessmentAttempts: many(assessmentAttempts),
	assessmentQuestions: many(assessmentQuestions),
	job: one(jobs, {
		fields: [skillAssessments.jobId],
		references: [jobs.id]
	}),
	user: one(users, {
		fields: [skillAssessments.createdBy],
		references: [users.id]
	}),
}));

export const associatesRelations = relations(associates, ({one, many}) => ({
	candidate: one(candidates, {
		fields: [associates.candidateId],
		references: [candidates.id]
	}),
	recruiter_managerId: one(recruiters, {
		fields: [associates.managerId],
		references: [recruiters.id],
		relationName: "associates_managerId_recruiters_id"
	}),
	recruiter_onboardedBy: one(recruiters, {
		fields: [associates.onboardedBy],
		references: [recruiters.id],
		relationName: "associates_onboardedBy_recruiters_id"
	}),
	onboardingProcesses: many(onboardingProcesses),
}));

export const recruitersRelations = relations(recruiters, ({one, many}) => ({
	associates_managerId: many(associates, {
		relationName: "associates_managerId_recruiters_id"
	}),
	associates_onboardedBy: many(associates, {
		relationName: "associates_onboardedBy_recruiters_id"
	}),
	interviews: many(interviews),
	onboardingProcesses: many(onboardingProcesses),
	onboardingTasks: many(onboardingTasks),
	questionBanks: many(questionBank),
	user: one(users, {
		fields: [recruiters.userId],
		references: [users.id]
	}),
	taskAssignments_recruiterId: many(taskAssignments, {
		relationName: "taskAssignments_recruiterId_recruiters_id"
	}),
	taskAssignments_assignedBy: many(taskAssignments, {
		relationName: "taskAssignments_assignedBy_recruiters_id"
	}),
	taskReminders: many(taskReminders),
	taskTemplates: many(taskTemplates),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({one}) => ({
	emailCampaign: one(emailCampaigns, {
		fields: [campaignRecipients.campaignId],
		references: [emailCampaigns.id]
	}),
	candidate: one(candidates, {
		fields: [campaignRecipients.candidateId],
		references: [candidates.id]
	}),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({one, many}) => ({
	campaignRecipients: many(campaignRecipients),
	emailTemplate: one(emailTemplates, {
		fields: [emailCampaigns.templateId],
		references: [emailTemplates.id]
	}),
	user: one(users, {
		fields: [emailCampaigns.userId],
		references: [users.id]
	}),
}));

export const candidateTagAssignmentsRelations = relations(candidateTagAssignments, ({one}) => ({
	candidate: one(candidates, {
		fields: [candidateTagAssignments.candidateId],
		references: [candidates.id]
	}),
	candidateTag: one(candidateTags, {
		fields: [candidateTagAssignments.tagId],
		references: [candidateTags.id]
	}),
	user: one(users, {
		fields: [candidateTagAssignments.assignedBy],
		references: [users.id]
	}),
}));

export const candidateTagsRelations = relations(candidateTags, ({one, many}) => ({
	candidateTagAssignments: many(candidateTagAssignments),
	user: one(users, {
		fields: [candidateTags.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	candidateTagAssignments: many(candidateTagAssignments),
	candidateTags: many(candidateTags),
	candidates: many(candidates),
	customers: many(customers),
	emailCampaigns: many(emailCampaigns),
	emailTemplates: many(emailTemplates),
	followUpSequences: many(followUpSequences),
	jobs: many(jobs),
	notificationPreferences: many(notificationPreferences),
	recruiters: many(recruiters),
	savedSearches: many(savedSearches),
	skillAssessments: many(skillAssessments),
}));

export const candidateSkillRatingsRelations = relations(candidateSkillRatings, ({one}) => ({
	application: one(applications, {
		fields: [candidateSkillRatings.applicationId],
		references: [applications.id]
	}),
	jobSkillRequirement: one(jobSkillRequirements, {
		fields: [candidateSkillRatings.skillRequirementId],
		references: [jobSkillRequirements.id]
	}),
}));

export const jobSkillRequirementsRelations = relations(jobSkillRequirements, ({one, many}) => ({
	candidateSkillRatings: many(candidateSkillRatings),
	job: one(jobs, {
		fields: [jobSkillRequirements.jobId],
		references: [jobs.id]
	}),
}));

export const codingChallengesRelations = relations(codingChallenges, ({one, many}) => ({
	interview: one(interviews, {
		fields: [codingChallenges.interviewId],
		references: [interviews.id]
	}),
	codingSubmissions: many(codingSubmissions),
}));

export const interviewsRelations = relations(interviews, ({one, many}) => ({
	codingChallenges: many(codingChallenges),
	fraudDetectionEvents: many(fraudDetectionEvents),
	interviewQuestions: many(interviewQuestions),
	interviewResponses: many(interviewResponses),
	interviewFeedbacks: many(interviewFeedback),
	application: one(applications, {
		fields: [interviews.applicationId],
		references: [applications.id]
	}),
	recruiter: one(recruiters, {
		fields: [interviews.recruiterId],
		references: [recruiters.id]
	}),
	candidate: one(candidates, {
		fields: [interviews.candidateId],
		references: [candidates.id]
	}),
	job: one(jobs, {
		fields: [interviews.jobId],
		references: [jobs.id]
	}),
	rescheduleRequests: many(rescheduleRequests),
}));

export const codingSubmissionsRelations = relations(codingSubmissions, ({one}) => ({
	codingChallenge: one(codingChallenges, {
		fields: [codingSubmissions.challengeId],
		references: [codingChallenges.id]
	}),
	candidate: one(candidates, {
		fields: [codingSubmissions.candidateId],
		references: [candidates.id]
	}),
}));

export const customerContactsRelations = relations(customerContacts, ({one, many}) => ({
	customer: one(customers, {
		fields: [customerContacts.customerId],
		references: [customers.id]
	}),
	jobs: many(jobs),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	customerContacts: many(customerContacts),
	user: one(users, {
		fields: [customers.createdBy],
		references: [users.id]
	}),
	jobs: many(jobs),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({one, many}) => ({
	emailCampaigns: many(emailCampaigns),
	user: one(users, {
		fields: [emailTemplates.userId],
		references: [users.id]
	}),
	sequenceSteps: many(sequenceSteps),
}));

export const followUpSequencesRelations = relations(followUpSequences, ({one, many}) => ({
	user: one(users, {
		fields: [followUpSequences.userId],
		references: [users.id]
	}),
	sequenceEnrollments: many(sequenceEnrollments),
	sequenceSteps: many(sequenceSteps),
}));

export const fraudDetectionEventsRelations = relations(fraudDetectionEvents, ({one}) => ({
	interview: one(interviews, {
		fields: [fraudDetectionEvents.interviewId],
		references: [interviews.id]
	}),
	candidate: one(candidates, {
		fields: [fraudDetectionEvents.candidateId],
		references: [candidates.id]
	}),
	interviewQuestion: one(interviewQuestions, {
		fields: [fraudDetectionEvents.questionId],
		references: [interviewQuestions.id]
	}),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({one, many}) => ({
	fraudDetectionEvents: many(fraudDetectionEvents),
	interview: one(interviews, {
		fields: [interviewQuestions.interviewId],
		references: [interviews.id]
	}),
	interviewResponses: many(interviewResponses),
}));

export const interviewResponsesRelations = relations(interviewResponses, ({one}) => ({
	interview: one(interviews, {
		fields: [interviewResponses.interviewId],
		references: [interviews.id]
	}),
	interviewQuestion: one(interviewQuestions, {
		fields: [interviewResponses.questionId],
		references: [interviewQuestions.id]
	}),
	candidate: one(candidates, {
		fields: [interviewResponses.candidateId],
		references: [candidates.id]
	}),
}));

export const interviewFeedbackRelations = relations(interviewFeedback, ({one}) => ({
	interview: one(interviews, {
		fields: [interviewFeedback.interviewId],
		references: [interviews.id]
	}),
	candidate: one(candidates, {
		fields: [interviewFeedback.candidateId],
		references: [candidates.id]
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id]
	}),
}));

export const onboardingProcessesRelations = relations(onboardingProcesses, ({one, many}) => ({
	associate: one(associates, {
		fields: [onboardingProcesses.associateId],
		references: [associates.id]
	}),
	recruiter: one(recruiters, {
		fields: [onboardingProcesses.startedBy],
		references: [recruiters.id]
	}),
	onboardingTasks: many(onboardingTasks),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({one, many}) => ({
	onboardingProcess: one(onboardingProcesses, {
		fields: [onboardingTasks.processId],
		references: [onboardingProcesses.id]
	}),
	recruiter: one(recruiters, {
		fields: [onboardingTasks.completedBy],
		references: [recruiters.id]
	}),
	taskAssignments: many(taskAssignments),
	taskReminders: many(taskReminders),
}));

export const questionBankRelations = relations(questionBank, ({one}) => ({
	recruiter: one(recruiters, {
		fields: [questionBank.recruiterId],
		references: [recruiters.id]
	}),
}));

export const rescheduleRequestsRelations = relations(rescheduleRequests, ({one}) => ({
	interview: one(interviews, {
		fields: [rescheduleRequests.interviewId],
		references: [interviews.id]
	}),
	interviewPanelist: one(interviewPanelists, {
		fields: [rescheduleRequests.panelistId],
		references: [interviewPanelists.id]
	}),
}));

export const interviewPanelistsRelations = relations(interviewPanelists, ({many}) => ({
	rescheduleRequests: many(rescheduleRequests),
}));

export const savedJobsRelations = relations(savedJobs, ({one}) => ({
	candidate: one(candidates, {
		fields: [savedJobs.candidateId],
		references: [candidates.id]
	}),
	job: one(jobs, {
		fields: [savedJobs.jobId],
		references: [jobs.id]
	}),
}));

export const savedSearchesRelations = relations(savedSearches, ({one}) => ({
	user: one(users, {
		fields: [savedSearches.userId],
		references: [users.id]
	}),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({one}) => ({
	followUpSequence: one(followUpSequences, {
		fields: [sequenceEnrollments.sequenceId],
		references: [followUpSequences.id]
	}),
	candidate: one(candidates, {
		fields: [sequenceEnrollments.candidateId],
		references: [candidates.id]
	}),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({one}) => ({
	followUpSequence: one(followUpSequences, {
		fields: [sequenceSteps.sequenceId],
		references: [followUpSequences.id]
	}),
	emailTemplate: one(emailTemplates, {
		fields: [sequenceSteps.templateId],
		references: [emailTemplates.id]
	}),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({one}) => ({
	onboardingTask: one(onboardingTasks, {
		fields: [taskAssignments.taskId],
		references: [onboardingTasks.id]
	}),
	recruiter_recruiterId: one(recruiters, {
		fields: [taskAssignments.recruiterId],
		references: [recruiters.id],
		relationName: "taskAssignments_recruiterId_recruiters_id"
	}),
	recruiter_assignedBy: one(recruiters, {
		fields: [taskAssignments.assignedBy],
		references: [recruiters.id],
		relationName: "taskAssignments_assignedBy_recruiters_id"
	}),
}));

export const taskRemindersRelations = relations(taskReminders, ({one}) => ({
	onboardingTask: one(onboardingTasks, {
		fields: [taskReminders.taskId],
		references: [onboardingTasks.id]
	}),
	recruiter: one(recruiters, {
		fields: [taskReminders.recruiterId],
		references: [recruiters.id]
	}),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({one}) => ({
	recruiter: one(recruiters, {
		fields: [taskTemplates.createdBy],
		references: [recruiters.id]
	}),
}));