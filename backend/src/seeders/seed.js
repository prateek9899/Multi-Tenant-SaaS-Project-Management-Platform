require('dotenv').config();
const mongoose = require('mongoose');
const {
  User,
  Organization,
  OrganizationMembership,
  Project,
  Board,
  Column,
  Issue,
  Comment,
  Sprint,
  Workflow,
  Plan,
} = require('../models');
const { ROLES, PLANS, ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } = require('../config/constants');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/projectflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      OrganizationMembership.deleteMany({}),
      Project.deleteMany({}),
      Board.deleteMany({}),
      Column.deleteMany({}),
      Issue.deleteMany({}),
      Comment.deleteMany({}),
      Sprint.deleteMany({}),
      Workflow.deleteMany({}),
      Plan.deleteMany({}),
    ]);
    console.log('Cleared existing database records.');

    // 1. Create Default Plans
    const plans = await Plan.insertMany([
      {
        name: 'Free Tier',
        code: PLANS.FREE,
        priceMonthly: 0,
        priceYearly: 0,
        maxMembers: 5,
        maxProjects: 3,
        maxStorageMb: 500,
        features: ['5 Members', '3 Projects', 'Kanban Board', '500MB Storage'],
      },
      {
        name: 'Starter Tier',
        code: PLANS.STARTER,
        priceMonthly: 12,
        priceYearly: 120,
        maxMembers: 15,
        maxProjects: 10,
        maxStorageMb: 5000,
        features: ['15 Members', '10 Projects', 'Sprints', 'Custom Workflows', '5GB Storage'],
      },
      {
        name: 'Professional Tier',
        code: PLANS.PROFESSIONAL,
        priceMonthly: 29,
        priceYearly: 290,
        maxMembers: 50,
        maxProjects: 50,
        maxStorageMb: 50000,
        features: ['50 Members', '50 Projects', 'Audit Logs', 'Webhooks', '50GB Storage'],
      },
    ]);
    console.log(`Created ${plans.length} subscription plans.`);

    // 2. Create Users
    const users = await User.create([
      {
        firstName: 'Prateek',
        lastName: 'Jukaria',
        email: 'prateek@projectflow.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      },
      {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex@projectflow.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      },
      {
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah@projectflow.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      },
      {
        firstName: 'David',
        lastName: 'Miller',
        email: 'david@projectflow.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      },
    ]);
    console.log(`Created ${users.length} users with password: password123`);

    const owner = users[0];

    // 3. Create Organizations (Tenants)
    const org1 = await Organization.create({
      name: 'Acme Technologies',
      slug: 'acme-tech',
      description: 'Enterprise AI & Cloud Infrastructure Solutions',
      owner: owner._id,
      plan: PLANS.PROFESSIONAL,
      maxMembers: 50,
      maxProjects: 50,
    });

    const org2 = await Organization.create({
      name: 'Starlight Startups',
      slug: 'starlight',
      description: 'Fast-moving consumer internet applications',
      owner: owner._id,
      plan: PLANS.STARTER,
      maxMembers: 15,
      maxProjects: 10,
    });
    console.log('Created 2 tenant organizations.');

    // 4. Create Memberships
    await OrganizationMembership.create([
      { organization: org1._id, user: users[0]._id, role: ROLES.OWNER },
      { organization: org1._id, user: users[1]._id, role: ROLES.ADMIN },
      { organization: org1._id, user: users[2]._id, role: ROLES.MEMBER },
      { organization: org1._id, user: users[3]._id, role: ROLES.VIEWER },
      { organization: org2._id, user: users[0]._id, role: ROLES.OWNER },
      { organization: org2._id, user: users[2]._id, role: ROLES.MEMBER },
    ]);

    // 5. Create Projects
    const project1 = await Project.create({
      organization: org1._id,
      name: 'Cloud Core Platform',
      key: 'CCP',
      description: 'Distributed microservices architecture and Kubernetes orchestration',
      lead: owner._id,
      projectType: 'kanban',
      createdBy: owner._id,
    });

    const project2 = await Project.create({
      organization: org1._id,
      name: 'Mobile Client v2',
      key: 'MOB',
      description: 'Next-gen iOS and Android React Native mobile experience',
      lead: users[1]._id,
      projectType: 'scrum',
      createdBy: owner._id,
    });

    // 6. Create Kanban Boards and Columns for Project 1
    const board1 = await Board.create({
      project: project1._id,
      name: 'Main Kanban Board',
      isDefault: true,
    });

    const columnsData = [
      { name: 'To Do', position: 0, color: '#94a3b8', columnType: 'todo' },
      { name: 'In Progress', position: 1, color: '#3b82f6', columnType: 'in_progress', wipLimit: 5 },
      { name: 'In Review', position: 2, color: '#f59e0b', columnType: 'in_review', wipLimit: 3 },
      { name: 'Done', position: 3, color: '#10b981', columnType: 'done' },
    ];

    const columns = [];
    for (const c of columnsData) {
      const col = await Column.create({ board: board1._id, ...c });
      columns.push(col);
    }

    // 7. Create Sprints
    const sprint1 = await Sprint.create({
      project: project1._id,
      organization: org1._id,
      name: 'Sprint 1 - Foundation & Auth',
      goal: 'Ship multi-tenant JWT authentication and workspace isolation',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdBy: owner._id,
    });

    // 8. Create Realistic Issues
    const sampleIssues = [
      {
        title: 'Design multi-tenant database indexing strategy',
        description: 'Ensure row-level tenant_id indexes are applied across all queries to prevent cross-tenant data leaks.',
        issueType: ISSUE_TYPES.STORY,
        priority: ISSUE_PRIORITIES.CRITICAL,
        column: columns[3]._id, // Done
        status: ISSUE_STATUSES.DONE,
        assignee: users[0]._id,
        storyPoints: 5,
        labels: ['backend', 'database', 'security'],
      },
      {
        title: 'Implement JWT refresh token rotation',
        description: 'Add secure token rotation to prevent session hijacking and provide seamless user re-authentication.',
        issueType: ISSUE_TYPES.TASK,
        priority: ISSUE_PRIORITIES.HIGH,
        column: columns[2]._id, // In Review
        status: ISSUE_STATUSES.IN_REVIEW,
        assignee: users[1]._id,
        storyPoints: 3,
        labels: ['auth', 'security'],
      },
      {
        title: 'Build Drag-and-Drop Kanban Board with optimistic updates',
        description: 'Interactive HTML5 drag-and-drop board allowing ticket reordering across swimlanes with instant UI sync.',
        issueType: ISSUE_TYPES.STORY,
        priority: ISSUE_PRIORITIES.HIGH,
        column: columns[1]._id, // In Progress
        status: ISSUE_STATUSES.IN_PROGRESS,
        assignee: users[2]._id,
        storyPoints: 8,
        labels: ['frontend', 'react', 'kanban'],
      },
      {
        title: 'Fix issue attachment upload mime-type validation bug',
        description: 'Non-standard audio files were passing through validation filters without error handling.',
        issueType: ISSUE_TYPES.BUG,
        priority: ISSUE_PRIORITIES.MEDIUM,
        column: columns[1]._id, // In Progress
        status: ISSUE_STATUSES.IN_PROGRESS,
        assignee: users[1]._id,
        storyPoints: 2,
        labels: ['bug', 'uploads'],
      },
      {
        title: 'Integrate Stripe Webhooks for subscription billing upgrades',
        description: 'Listen to checkout.session.completed and invoice.payment_succeeded to auto-upgrade organization quotas.',
        issueType: ISSUE_TYPES.STORY,
        priority: ISSUE_PRIORITIES.HIGH,
        column: columns[0]._id, // To Do
        status: ISSUE_STATUSES.TODO,
        assignee: users[0]._id,
        storyPoints: 5,
        labels: ['billing', 'stripe'],
      },
      {
        title: 'Add audit logging middleware for compliance tracking',
        description: 'Track all ticket mutations, deletions, and user role updates in a centralized immutable log.',
        issueType: ISSUE_TYPES.TASK,
        priority: ISSUE_PRIORITIES.MEDIUM,
        column: columns[0]._id, // To Do
        status: ISSUE_STATUSES.TODO,
        assignee: users[3]._id,
        storyPoints: 3,
        labels: ['audit', 'compliance'],
      },
    ];

    for (let i = 0; i < sampleIssues.length; i++) {
      const issueData = sampleIssues[i];
      const issue = await Issue.create({
        project: project1._id,
        organization: org1._id,
        board: board1._id,
        sprint: sprint1._id,
        reporter: owner._id,
        position: i,
        ...issueData,
      });

      // Add comments to some issues
      if (i === 2) {
        await Comment.create({
          issue: issue._id,
          author: users[0]._id,
          content: 'Looking great! Tested smooth drag handling on mobile and desktop viewports.',
        });
        await Comment.create({
          issue: issue._id,
          author: users[2]._id,
          content: 'Added WIP limit indicator badge at the top of columns when capacity is exceeded.',
        });
      }
    }

    console.log(`Created ${sampleIssues.length} sample issues with comments.`);
    console.log('\n===============================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Login credentials:');
    console.log('👤 Owner: prateek@projectflow.io | Password: password123');
    console.log('👤 Admin: alex@projectflow.io    | Password: password123');
    console.log('🏢 Tenant Org Slug: acme-tech');
    console.log('===============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();

