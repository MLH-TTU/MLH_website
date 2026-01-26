import { PrismaClient, TechnologyCategory } from '@prisma/client';

const prisma = new PrismaClient();

const technologies = [
  // Languages
  { name: 'JavaScript', category: TechnologyCategory.LANGUAGE, color: '#F7DF1E' },
  { name: 'TypeScript', category: TechnologyCategory.LANGUAGE, color: '#3178C6' },
  { name: 'Python', category: TechnologyCategory.LANGUAGE, color: '#3776AB' },
  { name: 'Java', category: TechnologyCategory.LANGUAGE, color: '#ED8B00' },
  { name: 'C++', category: TechnologyCategory.LANGUAGE, color: '#00599C' },
  { name: 'C#', category: TechnologyCategory.LANGUAGE, color: '#239120' },
  { name: 'Go', category: TechnologyCategory.LANGUAGE, color: '#00ADD8' },
  { name: 'Rust', category: TechnologyCategory.LANGUAGE, color: '#000000' },
  { name: 'PHP', category: TechnologyCategory.LANGUAGE, color: '#777BB4' },
  { name: 'Ruby', category: TechnologyCategory.LANGUAGE, color: '#CC342D' },
  
  // Frameworks
  { name: 'React', category: TechnologyCategory.FRAMEWORK, color: '#61DAFB' },
  { name: 'Vue.js', category: TechnologyCategory.FRAMEWORK, color: '#4FC08D' },
  { name: 'Angular', category: TechnologyCategory.FRAMEWORK, color: '#DD0031' },
  { name: 'Node.js', category: TechnologyCategory.FRAMEWORK, color: '#339933' },
  { name: 'Express', category: TechnologyCategory.FRAMEWORK, color: '#000000' },
  { name: 'Next.js', category: TechnologyCategory.FRAMEWORK, color: '#000000' },
  { name: 'Django', category: TechnologyCategory.FRAMEWORK, color: '#092E20' },
  { name: 'Flask', category: TechnologyCategory.FRAMEWORK, color: '#000000' },
  { name: 'Spring Boot', category: TechnologyCategory.FRAMEWORK, color: '#6DB33F' },
  { name: 'Laravel', category: TechnologyCategory.FRAMEWORK, color: '#FF2D20' },
  
  // Databases
  { name: 'PostgreSQL', category: TechnologyCategory.DATABASE, color: '#336791' },
  { name: 'MongoDB', category: TechnologyCategory.DATABASE, color: '#47A248' },
  { name: 'MySQL', category: TechnologyCategory.DATABASE, color: '#4479A1' },
  { name: 'Redis', category: TechnologyCategory.DATABASE, color: '#DC382D' },
  { name: 'SQLite', category: TechnologyCategory.DATABASE, color: '#003B57' },
  { name: 'Firebase', category: TechnologyCategory.DATABASE, color: '#FFCA28' },
  
  // Tools
  { name: 'Git', category: TechnologyCategory.TOOL, color: '#F05032' },
  { name: 'Docker', category: TechnologyCategory.TOOL, color: '#2496ED' },
  { name: 'Kubernetes', category: TechnologyCategory.TOOL, color: '#326CE5' },
  { name: 'Webpack', category: TechnologyCategory.TOOL, color: '#8DD6F9' },
  { name: 'Vite', category: TechnologyCategory.TOOL, color: '#646CFF' },
  { name: 'Jest', category: TechnologyCategory.TOOL, color: '#C21325' },
  { name: 'Cypress', category: TechnologyCategory.TOOL, color: '#17202C' },
  
  // Cloud
  { name: 'AWS', category: TechnologyCategory.CLOUD, color: '#FF9900' },
  { name: 'Google Cloud', category: TechnologyCategory.CLOUD, color: '#4285F4' },
  { name: 'Azure', category: TechnologyCategory.CLOUD, color: '#0078D4' },
  { name: 'Vercel', category: TechnologyCategory.CLOUD, color: '#000000' },
  { name: 'Netlify', category: TechnologyCategory.CLOUD, color: '#00C7B7' },
  { name: 'Heroku', category: TechnologyCategory.CLOUD, color: '#430098' },
  
  // Other
  { name: 'GraphQL', category: TechnologyCategory.OTHER, color: '#E10098' },
  { name: 'REST API', category: TechnologyCategory.OTHER, color: '#009639' },
  { name: 'Tailwind CSS', category: TechnologyCategory.OTHER, color: '#06B6D4' },
  { name: 'SASS/SCSS', category: TechnologyCategory.OTHER, color: '#CC6699' },
  { name: 'Material-UI', category: TechnologyCategory.OTHER, color: '#0081CB' },
  { name: 'Bootstrap', category: TechnologyCategory.OTHER, color: '#7952B3' },
];

async function main() {
  console.log('Start seeding...');
  
  // Clear existing technologies
  await prisma.userTechnology.deleteMany();
  await prisma.technology.deleteMany();
  
  // Create technologies
  for (const tech of technologies) {
    await prisma.technology.create({
      data: tech,
    });
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });