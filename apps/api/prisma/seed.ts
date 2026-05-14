import { fa, faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateSlug(title: string): string {
    return title.toLocaleLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

async function main() {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    const usersData = Array.from({ length: 20 }).map(() => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        bio: faker.lorem.sentence(),
        avatar: faker.image.avatar(),

    }));

    await prisma.user.createMany({
        data: usersData,
    });

    const allUsers = await prisma.user.findMany();

    const postsPromises = Array.from({ length: 40 }).map(async () => {
        const randomAuthor = allUsers[Math.floor(Math.random() * allUsers.length)];

        return prisma.post.create({
            data: {
                title: faker.lorem.sentence(),
                slug: generateSlug(faker.lorem.sentence() + "-" + faker.string.uuid()), // UUID pour éviter les doublons de slug
                content: faker.lorem.paragraphs(4),
                thumbnail: faker.image.urlLoremFlickr(),
                authorId: randomAuthor.id,
                published: true,
                comments: {
                    createMany: {
                        data: Array.from({ length: 5 }).map(() => ({
                            content: faker.lorem.sentence(),
                            authorId: allUsers[Math.floor(Math.random() * allUsers.length)].id,
                        })),
                    },
                },
            },
        });
    });

    await Promise.all(postsPromises);
    console.log("Seeding completed !");

}


main().then(() => {
    prisma.$disconnect();
    process.exit(0);
}).catch(async (e) => {
    console.error(e);
    prisma.$disconnect();
    console.log("Seeding failed !", e);
    process.exit(1);
});