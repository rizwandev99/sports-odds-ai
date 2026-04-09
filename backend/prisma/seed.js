const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const existingMatches = await prisma.match.count();
    if (existingMatches > 0) {
        console.log('✅ Matches already exist. Skipping seed.');
        return;
    }

    await prisma.match.createMany({
        data: [
            {
                sport: 'Basketball',
                league: 'NBA',
                teamA: 'LA Lakers',
                teamB: 'Boston Celtics',
                ratingA: 85,
                ratingB: 78,
                startTime: new Date('2026-04-10T19:30:00Z'),
            },
            {
                sport: 'Football',
                league: 'Premier League',
                teamA: 'Arsenal',
                teamB: 'Manchester City',
                ratingA: 82,
                ratingB: 90,
                startTime: new Date('2026-04-10T21:00:00Z'),
            },
            {
                sport: 'Football',
                league: 'La Liga',
                teamA: 'Real Madrid',
                teamB: 'FC Barcelona',
                ratingA: 92,
                ratingB: 91,
                startTime: new Date('2026-04-11T20:00:00Z'),
            },
            {
                sport: 'Basketball',
                league: 'NBA',
                teamA: 'Golden State Warriors',
                teamB: 'Miami Heat',
                ratingA: 80,
                ratingB: 76,
                startTime: new Date('2026-04-11T22:00:00Z'),
            },
        ],
    })
    console.log('✅ Database seeded with sample matches!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
