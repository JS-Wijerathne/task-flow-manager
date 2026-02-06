import { PrismaClient, UserRole, TaskStatus, ProjectRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config();

// --- Helpers ---
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomSubset = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
const getRandomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
    console.log('🌱 Starting comprehensive seed...');

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not found in environment');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Clear Database
        console.log('Step 1: Clearing Database...');
        await prisma.auditLog.deleteMany();
        await prisma.task.deleteMany();
        await prisma.projectMember.deleteMany();
        await prisma.project.deleteMany();
        await prisma.user.deleteMany();
        console.log('✅ Step 1 Complete (Clean Slate)');

        // 2. Create Users
        console.log('Step 2: Creating Users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Admin
        const admin = await prisma.user.create({
            data: { email: 'admin@tempops.com', name: 'Super Admin', password: hashedPassword, role: UserRole.ADMIN },
        });

        // Members (Task Doers) - 50 Realistic Names
        const realMemberNames = [
            "James Smith", "Maria Garcia", "David Johnson", "Sarah Miller", "Robert Brown",
            "Jennifer Davis", "Michael Wilson", "Elizabeth Moore", "William Taylor", "Linda Anderson",
            "Richard Thomas", "Barbara Jackson", "Joseph White", "Susan Harris", "Thomas Martin",
            "Jessica Thompson", "Charles Garcia", "Karen Martinez", "Christopher Robinson", "Nancy Clark",
            "Daniel Rodriguez", "Lisa Lewis", "Matthew Lee", "Betty Walker", "Anthony Hall",
            "Margaret Allen", "Mark Young", "Sandra Hernandez", "Donald King", "Ashley Wright",
            "Steven Lopez", "Kimberly Hill", "Paul Scott", "Emily Green", "Andrew Adams",
            "Donna Baker", "Joshua Gonzalez", "Michelle Nelson", "Kenneth Carter", "Carol Mitchell",
            "Kevin Perez", "Amanda Roberts", "Brian Turner", "Melissa Phillips", "George Campbell",
            "Deborah Parker", "Edward Evans", "Stephanie Edwards", "Ronald Collins", "Rebecca Stewart"
        ];

        const members: any[] = [];
        for (const name of realMemberNames) {
            const email = `${name.toLowerCase().replace(' ', '.')}@tempops.com`;
            const user = await prisma.user.create({
                data: { email, name, password: hashedPassword, role: UserRole.MEMBER },
            });
            members.push(user);
        }

        // Viewers (Observers) - 20 Realistic Names
        const realViewerNames = [
            "Frank Sanchez", "Sharon Morris", "Gary Rogers", "Cynthia Reed", "Timothy Cook",
            "Kathleen Morgan", "Jeffrey Bell", "Amy Murphy", "Larry Bailey", "Angela Rivera",
            "Scott Cooper", "Shirley Richardson", "Eric Cox", "Brenda Howard", "Stephen Ward",
            "Pamela Torres", "Raymond Peterson", "Nicole Gray", "Gregory Ramirez", "Christine James"
        ];

        const viewers: any[] = [];
        for (const name of realViewerNames) {
            const email = `${name.toLowerCase().replace(' ', '.')}@tempops.com`;
            const user = await prisma.user.create({
                data: { email, name, password: hashedPassword, role: UserRole.VIEWER },
            });
            viewers.push(user);
        }

        console.log(`✅ Created Users: 1 Admin, ${members.length} Members, ${viewers.length} Viewers`);

        // 3. Create Projects - 50 Realistic Tech Ops Projects
        const projectNames = [
            'Global HR Portal Revamp', 'Legacy Mainframe Migration', 'Cloud Infrastructure Optimization', 'Internal Developer Platform', 'Customer Support AI Bot',
            'APAC Sales Dashboard', 'EMEA Marketing Analytics', 'North America Logistics Tracker', 'Corporate Website Redesign', 'Mobile App V2 Launch',
            'Data Warehouse Modernization', 'Security Compliance Audit 2026', 'Single Sign-On Integration', 'Payment Gateway Consolidation', 'Inventory Management System',
            'Employee Onboarding Automation', 'Financial Reporting Tool', 'Supply Chain Visibility', 'Network Security Upgrade', 'Disaster Recovery Plan Drill',
            'Kubernetes Cluster Upgrade', 'Microservices Refactoring', 'API Graceful Degradation', 'Real-time Notification Service', 'User Activity Tracking',
            'GDPR Compliance Updates', 'Search Engine Optimization', 'Vendor Management Portal', 'Procurement Workflow Engine', 'Asset Management System',
            'Remote Work Collaboration Tools', 'Video Conferencing Integration', 'Chatbot Knowledge Base', 'Email Marketing Automations', 'CRM Data Cleanup',
            'Lead Scoring Algorithm', 'Churn Prediction Model', 'Fraud Detection System', 'Biometric Authentication PoC', 'Blockchain Ledger Pilot',
            'IoT Device Management', 'Smart Office Sensors', 'Green Energy Monitoring', 'Carbon Footprint Calculator', 'Diversity & Inclusion Metrics',
            'Talent Acquisition Pipeline', 'Payroll System Integration', 'Expense Management App', 'Travel Booking Portal', 'Legal Contract Lifecycle'
        ];

        const priorityStrings = ['Low', 'Medium', 'High'];

        // Realistic Task Templates
        const taskVerbs = ['Implement', 'Design', 'Refactor', 'Test', 'Deploy', 'Debug', 'Document', 'Analyze', 'Review', 'Upgrade'];
        const taskNouns = ['Authentication', 'Database Schema', 'API Endpoints', 'Frontend Layout', 'CI/CD Pipeline', 'Unit Tests', 'Integration Tests', 'User Dashboard', 'Admin Panel', 'Reporting Module', 'Search Functionality', 'Payment Processing', 'Notification System', 'Email Service', 'Caching Layer', 'Load Balancer', 'Security Headers', 'Access Control', 'Logging Framework'];

        const taskDescriptions = [
            "Ensure high availability and fault tolerance.",
            "Optimize for performance and low latency.",
            "Align with the new design system guidelines.",
            "Address security vulnerabilities identified in the audit.",
            "Migrate from legacy system to new architecture.",
            "Implement requirements gathered from stakeholders.",
            "Fix reported production bugs and improve stability.",
            "Update documentation to reflect latest changes.",
            "Set up monitoring and alerting for this component.",
            "Conduct code review and address technical debt."
        ];

        for (const projectName of projectNames) {
            console.log(`   Creating Project: ${projectName}`);
            // Create Project
            const project = await prisma.project.create({
                data: {
                    name: projectName,
                    description: `Strategic initiative: ${projectName}. Aiming to improve operational efficiency and user satisfaction.`,
                },
            });

            // 4. Assign Members
            // Admin is always a member
            await prisma.projectMember.create({ data: { projectId: project.id, userId: admin.id, projectRole: ProjectRole.MEMBER } });

            // Add 10-20 random Members
            const projectMembers = getRandomSubset(members, getRandomInt(10, 20));
            for (const member of projectMembers) {
                await prisma.projectMember.create({ data: { projectId: project.id, userId: member.id, projectRole: ProjectRole.MEMBER } });
            }

            // Add 5-10 random Viewers
            const projectViewers = getRandomSubset(viewers, getRandomInt(5, 10));
            for (const viewer of projectViewers) {
                await prisma.projectMember.create({ data: { projectId: project.id, userId: viewer.id, projectRole: ProjectRole.VIEWER } });
            }

            // 5. Create Tasks (50 per project)
            const taskCount = 50;
            const projectAssignableUsers = [admin, ...projectMembers];

            // Use transaction or Promise.all for speed? Sequential is safer for random logic but slower.
            // Let's use chunks to speed up inserts.

            const taskPromises = [];
            for (let i = 0; i < taskCount; i++) {
                taskPromises.push((async () => {
                    const rand = Math.random();
                    let status: TaskStatus;
                    if (rand < 0.2) status = TaskStatus.TODO;
                    else if (rand < 0.5) status = TaskStatus.IN_PROGRESS;
                    else status = TaskStatus.DONE;

                    const priority = getRandomElement(priorityStrings);
                    const reporter = getRandomElement(projectMembers);

                    let assigneeId: string | null = null;
                    if (status !== TaskStatus.TODO || Math.random() > 0.5) {
                        assigneeId = getRandomElement(projectAssignableUsers).id;
                    }

                    // Dates
                    const now = new Date();
                    const createdAt = getRandomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now);
                    let dueDate: Date;
                    let completedAt: Date | null = null;

                    if (status === TaskStatus.DONE) {
                        const daysToComplete = getRandomInt(1, 14);
                        completedAt = new Date(createdAt.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
                        if (completedAt > now) completedAt = now;

                        if (Math.random() > 0.2) {
                            dueDate = new Date(completedAt.getTime() + getRandomInt(1, 5) * 24 * 60 * 60 * 1000);
                        } else {
                            dueDate = new Date(completedAt.getTime() - getRandomInt(1, 5) * 24 * 60 * 60 * 1000);
                        }
                    } else {
                        if (Math.random() > 0.3) {
                            dueDate = getRandomDate(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
                        } else {
                            dueDate = getRandomDate(createdAt, now);
                        }
                    }

                    const verb = getRandomElement(taskVerbs);
                    const noun = getRandomElement(taskNouns);
                    const desc = getRandomElement(taskDescriptions);

                    const task = await prisma.task.create({
                        data: {
                            title: `${verb} ${noun} for ${projectName.split(' ').slice(0, 3).join(' ')}`,
                            description: `${verb} the ${noun.toLowerCase()}. ${desc}`,
                            status,
                            priority,
                            projectId: project.id,
                            assigneeId,
                            reporterId: reporter.id,
                            dueDate,
                            createdAt,
                            completedAt
                        }
                    });
                })());
            }
            await Promise.all(taskPromises);
        }

        console.log(`✅ Created 50 Realistic Projects with 50 tasks each.`);
        console.log('🌱 Seed Completed Successfully!');
    } catch (e: any) {
        console.error('❌ Seed Script Failed');
        console.error('Error Code:', e.code);
        console.error('Error Meta:', e.meta);
        console.error('Error Message:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
