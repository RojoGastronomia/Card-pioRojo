// Adicionar alguns pratos aos menus
console.log("Adicionando pratos aos menus...");

// Pratos para o primeiro menu (executivo)
const executiveDishes = [
  {
    name: "Salada Caesar",
    description: "Alface americana, croutons, parmesão e molho Caesar",
    price: 25.00,
    category: "appetizer",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?salad"
  },
  {
    name: "Carpaccio",
    description: "Fatias finas de carne crua, parmesão, alcaparras e rúcula",
    price: 30.00,
    category: "appetizer",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?carpaccio"
  },
  {
    name: "Salmão Grelhado",
    description: "Salmão grelhado com legumes e molho de ervas",
    price: 65.00,
    category: "main",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?salmon"
  },
  {
    name: "Filé Mignon",
    description: "Filé mignon ao molho de vinho tinto com purê de batatas",
    price: 75.00,
    category: "main",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?steak"
  },
  {
    name: "Risoto de Cogumelos",
    description: "Arroz arbóreo com cogumelos e parmesão",
    price: 55.00,
    category: "main",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?risotto"
  },
  {
    name: "Pudim de Leite",
    description: "Clássico pudim de leite condensado com calda de caramelo",
    price: 20.00,
    category: "dessert",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?pudding"
  },
  {
    name: "Mousse de Chocolate",
    description: "Mousse de chocolate belga com calda de frutas vermelhas",
    price: 22.00,
    category: "dessert",
    menuId: 1,
    imageUrl: "https://source.unsplash.com/random/300x200/?mousse"
  }
];

// Pratos para o segundo menu (premium)
const premiumDishes = [
  {
    name: "Camarão empanado",
    description: "Camarões empanados com molho de manga picante",
    price: 45.00,
    category: "appetizer",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?shrimp"
  },
  {
    name: "Bruschetta",
    description: "Pães tostados com tomate, manjericão e azeite",
    price: 28.00,
    category: "appetizer",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?bruschetta"
  },
  {
    name: "Ravioli de Queijo",
    description: "Massa fresca recheada com queijos nobres e molho de tomate",
    price: 60.00,
    category: "main",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?ravioli"
  },
  {
    name: "Picanha",
    description: "Picanha grelhada com batatas rústicas e vinagrete",
    price: 85.00,
    category: "main",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?beef"
  },
  {
    name: "Medalhão de Filé",
    description: "Medalhões de filé mignon com risoto de queijos",
    price: 90.00,
    category: "main",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?filet"
  },
  {
    name: "Cheesecake",
    description: "Cheesecake com calda de frutas vermelhas",
    price: 25.00,
    category: "dessert",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?cheesecake"
  },
  {
    name: "Petit Gateau",
    description: "Bolo quente de chocolate com sorvete de baunilha",
    price: 28.00,
    category: "dessert",
    menuId: 2,
    imageUrl: "https://source.unsplash.com/random/300x200/?cake"
  }
];

// Adicionar os pratos ao banco de dados
for (const dish of executiveDishes) {
  try {
    await db.insert(dishes).values(dish);
  } catch (error) {
    console.error("Erro ao adicionar prato:", dish.name, error);
  }
}

for (const dish of premiumDishes) {
  try {
    await db.insert(dishes).values(dish);
  } catch (error) {
    console.error("Erro ao adicionar prato:", dish.name, error);
  }
}

console.log("Dados de inicialização concluídos!"); 