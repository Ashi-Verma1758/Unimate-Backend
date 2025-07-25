// models/project.model.js (Example additions)
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        domain: { type: String, required: true },
        projectType: { type: String },
        requiredSkills: [{ type: String }], // Array of strings
        niceToHaveSkills: [{ type: String }],
        timeCommitment: { type: String, required: true },
        projectDuration: { type: String, required: true },
        teamSize: { type: Number, required: true }, // Assuming this is the 'target' size
        location: { type: String },
        startDate: { type: Date, required: true },
        applicationDeadline: { type: Date, required: true },
        remote: { type: Boolean, default: false }, // Renamed from 'remoteWorkOkay' in frontend to 'remote' here
        githubRepo: { type: String },
        figmaLink: { type: String },
        demoLink: { type: String },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinRequests: [ // Subdocument array for join requests
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                message: { type: String },
                status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
                sentAt: { type: Date, default: Date.now }
            }
        ],
        invitedMembers: [ // Subdocument array for invitations
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
                sentAt: { type: Date, default: Date.now }
            }
        ],
        // --- NEW FIELDS FOR STATS ---
        views: {
            type: Number,
            default: 0 // Initialize views to 0
        },
        // We'll calculate currentTeamCount dynamically based on joinRequests/invitedMembers statuses
        // or add a virtual if preferred, but not as a stored field to avoid sync issues.
        // --- END NEW FIELDS ---
    },
    { timestamps: true } // This adds `createdAt` and `updatedAt` fields automatically
);

// Virtual to get current number of accepted team members directly from the project document
projectSchema.virtual('currentTeamCount').get(function() {
    const acceptedRequests = this.joinRequests.filter(req => req.status === 'accepted').length;
    const acceptedInvites = this.invitedMembers.filter(inv => inv.status === 'accepted').length;
    // Need to account for the creator being part of the team too if not included in requests/invites
    // Assuming creator is always 1 member, and others join.
    // If the creator is *not* represented in joinRequests/invitedMembers, add 1.
    // If they are, you'll need more complex logic. For now, assume 1 (creator) + accepted join/invites.
    const uniqueAcceptedMembers = new Set();
    this.joinRequests.forEach(req => {
        if (req.status === 'accepted' && req.user) uniqueAcceptedMembers.add(req.user.toString());
    });
    this.invitedMembers.forEach(inv => {
        if (inv.status === 'accepted' && inv.user) uniqueAcceptedMembers.add(inv.user.toString());
    });
    // Add creator to unique count if not already added. Requires createdBy to be populated.
    if (this.createdBy) {
        uniqueAcceptedMembers.add(this.createdBy.toString());
    }

    return uniqueAcceptedMembers.size; // Return the count of unique accepted members
});

// Ensure virtuals are included when converting to JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;