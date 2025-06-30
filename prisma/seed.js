"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const adminPassword = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@ieltsplatform.com' },
        update: {},
        create: {
            email: 'admin@ieltsplatform.com',
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            password: adminPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
        },
    });
    await prisma.userProfile.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            country: 'Global',
            language: 'en',
            timezone: 'UTC',
            bio: 'Platform Administrator',
            currentLevel: 'ADVANCED',
        },
    });
    const instructorPassword = await bcryptjs_1.default.hash('instructor123', 12);
    const instructor = await prisma.user.upsert({
        where: { email: 'instructor@ieltsplatform.com' },
        update: {},
        create: {
            email: 'instructor@ieltsplatform.com',
            username: 'instructor',
            firstName: 'John',
            lastName: 'Instructor',
            password: instructorPassword,
            role: 'INSTRUCTOR',
            isActive: true,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
        },
    });
    await prisma.userProfile.upsert({
        where: { userId: instructor.id },
        update: {},
        create: {
            userId: instructor.id,
            country: 'United Kingdom',
            language: 'en',
            timezone: 'Europe/London',
            bio: 'Experienced IELTS Instructor',
            currentLevel: 'ADVANCED',
        },
    });
    const studentPassword = await bcryptjs_1.default.hash('student123', 12);
    const student = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {},
        create: {
            email: 'student@example.com',
            username: 'student_demo',
            firstName: 'Jane',
            lastName: 'Student',
            password: studentPassword,
            role: 'STUDENT',
            isActive: true,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
        },
    });
    await prisma.userProfile.upsert({
        where: { userId: student.id },
        update: {},
        create: {
            userId: student.id,
            dateOfBirth: new Date('1995-05-15'),
            country: 'India',
            language: 'en',
            timezone: 'Asia/Kolkata',
            bio: 'Preparing for IELTS Academic',
            targetScore: 7.5,
            currentLevel: 'INTERMEDIATE',
            studyGoals: ['Academic Writing', 'Speaking Fluency', 'Listening Skills'],
        },
    });
    const readingTest = await prisma.iELTSTest.create({
        data: {
            title: 'Academic Reading Practice Test 1',
            description: 'A comprehensive reading test covering various academic topics',
            module: 'READING',
            difficulty: 'INTERMEDIATE',
            timeLimit: 3600,
            totalQuestions: 40,
            passingScore: 6.0,
            instructions: 'Read the passages carefully and answer all questions. You have 60 minutes to complete this test.',
            createdBy: instructor.id,
        },
    });
    const sampleQuestions = [
        {
            questionNumber: 1,
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is the main topic of the first passage?',
            options: ['Climate Change', 'Technology Innovation', 'Education Reform', 'Healthcare'],
            correctAnswer: 'Climate Change',
            points: 1.0,
            explanation: 'The first passage primarily discusses climate change impacts.',
        },
        {
            questionNumber: 2,
            questionType: 'TRUE_FALSE',
            questionText: 'The author supports the use of renewable energy.',
            options: ['True', 'False', 'Not Given'],
            correctAnswer: 'True',
            points: 1.0,
            explanation: 'The author clearly advocates for renewable energy solutions.',
        },
        {
            questionNumber: 3,
            questionType: 'FILL_BLANK',
            questionText: 'Solar energy accounts for _____ percent of global energy production.',
            correctAnswer: '15',
            points: 1.0,
            explanation: 'According to the passage, solar energy represents 15% of global production.',
        },
    ];
    for (const question of sampleQuestions) {
        await prisma.testQuestion.create({
            data: {
                testId: readingTest.id,
                ...question,
            },
        });
    }
    const listeningTest = await prisma.iELTSTest.create({
        data: {
            title: 'Academic Listening Practice Test 1',
            description: 'A listening test with various audio scenarios',
            module: 'LISTENING',
            difficulty: 'INTERMEDIATE',
            timeLimit: 1800,
            totalQuestions: 40,
            passingScore: 6.0,
            instructions: 'Listen carefully to the audio recordings and answer the questions.',
            createdBy: instructor.id,
        },
    });
    const testAttempt = await prisma.testAttempt.create({
        data: {
            userId: student.id,
            testId: readingTest.id,
            status: 'COMPLETED',
            startedAt: new Date(Date.now() - 3600000),
            completedAt: new Date(Date.now() - 600000),
            submittedAt: new Date(Date.now() - 600000),
            timeSpent: 3000,
            score: 32,
            totalScore: 40,
            percentage: 80,
            aiSummary: 'Good performance in reading comprehension. Areas for improvement: vocabulary and time management.',
        },
    });
    await prisma.testResult.create({
        data: {
            userId: student.id,
            testId: readingTest.id,
            attemptId: testAttempt.id,
            module: 'READING',
            difficulty: 'INTERMEDIATE',
            score: 32,
            totalScore: 40,
            percentage: 80,
            timeSpent: 3000,
            correctAnswers: 32,
            wrongAnswers: 6,
            skippedAnswers: 2,
            strengths: ['Reading Comprehension', 'Detail Recognition'],
            weaknesses: ['Vocabulary', 'Time Management'],
            aiSummary: 'Strong reading skills with room for vocabulary improvement.',
        },
    });
    await prisma.leaderboardEntry.create({
        data: {
            userId: student.id,
            username: student.username,
            fullName: `${student.firstName} ${student.lastName}`,
            totalScore: 320,
            testsCompleted: 4,
            averageScore: 80,
            streak: 3,
            rank: 1,
            period: 'MONTHLY',
            periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
    });
    console.log('✅ Database seeding completed successfully!');
    console.log('📋 Created users:');
    console.log(`   - Admin: ${admin.email} (password: admin123)`);
    console.log(`   - Instructor: ${instructor.email} (password: instructor123)`);
    console.log(`   - Student: ${student.email} (password: student123)`);
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map