interface SeedSkillData {
  title: string;
  description: string;
  images: string[];
  ownerEmail: string;
  categoryName: string;
}

export const seedSkills: SeedSkillData[] = [
  {
    title: 'Основы Frontend-разработки',
    description:
      'Помогу разобраться с HTML, CSS и основами JavaScript. Создадим простую веб-страницу.',
    images: [],
    ownerEmail: 'anna@example.com',
    categoryName: 'Frontend',
  },
  {
    title: 'Основы графического дизайна',
    description:
      'Объясню основы композиции, типографики и работы с цветом на практических примерах.',
    images: [],
    ownerEmail: 'anna@example.com',
    categoryName: 'Графический дизайн',
  },
  {
    title: 'Основы Backend-разработки',
    description:
      'Помогу разобраться с устройством серверного приложения и разработкой REST API.',
    images: [],
    ownerEmail: 'ivan@example.com',
    categoryName: 'Backend',
  },
  {
    title: 'Английский для начинающих',
    description:
      'Разберём базовую грамматику и потренируем простые диалоги для повседневного общения.',
    images: [],
    ownerEmail: 'ivan@example.com',
    categoryName: 'Английский язык',
  },
];
