// Arquivo de teste simples para verificar servidor Express + SQLite
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

// Inicializar o banco de dados SQLite
const dbPath = path.join(__dirname, 'test.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas e inserir dados de exemplo
db.serialize(() => {
  // Criar tabela de eventos
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      title_en TEXT,
      description_en TEXT,
      image_url TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    )
  `);

  // Criar tabela de menus
  db.run(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      name_en TEXT,
      description_en TEXT,
      price REAL NOT NULL,
      event_id INTEGER,
      FOREIGN KEY (event_id) REFERENCES events (id)
    )
  `);

  // Criar tabela de pratos
  db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      name_en TEXT,
      description_en TEXT,
      category TEXT NOT NULL,
      category_en TEXT,
      menu_id INTEGER,
      FOREIGN KEY (menu_id) REFERENCES menus (id)
    )
  `);

  // Verificar se já existem dados
  db.get("SELECT COUNT(*) as count FROM events", (err, row) => {
    if (err) {
      console.error("Erro ao verificar eventos:", err);
      return;
    }

    if (row.count === 0) {
      // Inserir eventos de exemplo
      db.run(`
        INSERT INTO events (title, description, title_en, description_en, image_url, type, status)
        VALUES 
          ('Evento Corporativo', 'Um evento para empresas', 'Corporate Event', 'An event for companies', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87', 'corporate', 'active'),
          ('Casamento Especial', 'Celebração de casamento', 'Special Wedding', 'Wedding celebration', 'https://images.unsplash.com/photo-1519741497674-611481863552', 'wedding', 'active')
      `);

      // Inserir menus de exemplo
      db.run(`
        INSERT INTO menus (name, description, name_en, description_en, price, event_id)
        VALUES 
          ('Menu Executivo', 'Opções para almoços corporativos', 'Executive Menu', 'Options for corporate lunches', 150.00, 1),
          ('Menu Festa', 'Opções para festas', 'Party Menu', 'Options for parties', 200.00, 1),
          ('Menu Casamento Básico', 'Opções para casamentos pequenos', 'Basic Wedding Menu', 'Options for small weddings', 180.00, 2),
          ('Menu Casamento Premium', 'Opções para casamentos grandes', 'Premium Wedding Menu', 'Options for large weddings', 250.00, 2)
      `);

      // Inserir pratos de exemplo
      db.run(`
        INSERT INTO dishes (name, description, name_en, description_en, category, category_en, menu_id)
        VALUES 
          ('Entrada de Salada', 'Salada fresca', 'Salad Starter', 'Fresh salad', 'ENTRADA', 'STARTER', 1),
          ('Filé Mignon', 'Filé com molho madeira', 'Filet Mignon', 'Steak with madeira sauce', 'PRATO PRINCIPAL', 'MAIN COURSE', 1),
          ('Tiramisu', 'Sobremesa italiana', 'Tiramisu', 'Italian dessert', 'SOBREMESA', 'DESSERT', 1),
          ('Canapés', 'Variedade de canapés', 'Canapés', 'Variety of canapés', 'ENTRADA', 'STARTER', 2),
          ('Salmão Grelhado', 'Salmão com ervas', 'Grilled Salmon', 'Salmon with herbs', 'PRATO PRINCIPAL', 'MAIN COURSE', 2),
          ('Mousse de Chocolate', 'Mousse cremosa', 'Chocolate Mousse', 'Creamy mousse', 'SOBREMESA', 'DESSERT', 2),
          ('Bruschetta', 'Tomate e manjericão', 'Bruschetta', 'Tomato and basil', 'ENTRADA', 'STARTER', 3),
          ('Frango ao Molho Branco', 'Peito de frango suculento', 'Chicken with White Sauce', 'Juicy chicken breast', 'PRATO PRINCIPAL', 'MAIN COURSE', 3),
          ('Cheesecake', 'Cheesecake de frutas vermelhas', 'Cheesecake', 'Red berry cheesecake', 'SOBREMESA', 'DESSERT', 3),
          ('Camarão Empanado', 'Camarão crocante', 'Breaded Shrimp', 'Crispy shrimp', 'ENTRADA', 'STARTER', 4),
          ('Medalhão de Filé', 'Medalhão com risoto', 'Steak Medallion', 'Medallion with risotto', 'PRATO PRINCIPAL', 'MAIN COURSE', 4),
          ('Pavlova', 'Merengue com frutas', 'Pavlova', 'Meringue with fruits', 'SOBREMESA', 'DESSERT', 4)
      `);

      console.log("Dados de exemplo inseridos com sucesso!");
    } else {
      console.log("Banco de dados já contém dados.");
    }
  });
});

// Criar o aplicativo Express
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Middleware para extrair o idioma
app.use((req, res, next) => {
  // Tenta obter o idioma dos parâmetros de consulta
  req.language = req.query.lang || 'pt';
  next();
});

// Rota para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota raiz para informações do servidor
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor de teste SiteCard API está funcionando',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/events',
      '/api/events/:id',
      '/api/events/:id/menus',
      '/api/menus/:id/dishes',
      '/api/user'
    ]
  });
});

// Função para processar eventos com base no idioma
function processEventsByLanguage(events, language) {
  if (!Array.isArray(events)) {
    events = [events]; // Garantir que events seja um array
  }
  
  return events.map(event => {
    const processedEvent = { ...event };
    
    if (language === 'en' && event.title_en) {
      processedEvent.title = event.title_en;
      delete processedEvent.title_en;
    }
    
    if (language === 'en' && event.description_en) {
      processedEvent.description = event.description_en;
      delete processedEvent.description_en;
    }
    
    if (language === 'pt') {
      delete processedEvent.title_en;
      delete processedEvent.description_en;
    }
    
    return processedEvent;
  });
}

// Função para processar menus com base no idioma
function processMenusByLanguage(menus, language) {
  if (!Array.isArray(menus)) {
    menus = [menus]; // Garantir que menus seja um array
  }
  
  return menus.map(menu => {
    const processedMenu = { ...menu };
    
    if (language === 'en' && menu.name_en) {
      processedMenu.name = menu.name_en;
      delete processedMenu.name_en;
    }
    
    if (language === 'en' && menu.description_en) {
      processedMenu.description = menu.description_en;
      delete processedMenu.description_en;
    }
    
    if (language === 'pt') {
      delete processedMenu.name_en;
      delete processedMenu.description_en;
    }
    
    return processedMenu;
  });
}

// Função para processar pratos com base no idioma
function processDishesByLanguage(dishes, language) {
  if (!Array.isArray(dishes)) {
    dishes = [dishes]; // Garantir que dishes seja um array
  }
  
  return dishes.map(dish => {
    const processedDish = { ...dish };
    
    if (language === 'en' && dish.name_en) {
      processedDish.name = dish.name_en;
      delete processedDish.name_en;
    }
    
    if (language === 'en' && dish.description_en) {
      processedDish.description = dish.description_en;
      delete processedDish.description_en;
    }
    
    if (language === 'en' && dish.category_en) {
      processedDish.category = dish.category_en;
      delete processedDish.category_en;
    }
    
    if (language === 'pt') {
      delete processedDish.name_en;
      delete processedDish.description_en;
      delete processedDish.category_en;
    }
    
    return processedDish;
  });
}

// Rota para obter todos os eventos
app.get('/api/events', (req, res) => {
  db.all("SELECT * FROM events", (err, rows) => {
    if (err) {
      console.error("Erro ao buscar eventos:", err);
      return res.status(500).json({ error: "Erro ao buscar eventos" });
    }
    
    // Processar eventos com base no idioma
    const processedEvents = processEventsByLanguage(rows, req.language);
    
    res.json(processedEvents);
  });
});

// Rota para obter um evento específico
app.get('/api/events/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM events WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar evento:", err);
      return res.status(500).json({ error: "Erro ao buscar evento" });
    }
    if (!row) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }
    
    // Processar evento com base no idioma
    const [processedEvent] = processEventsByLanguage([row], req.language);
    
    res.json(processedEvent);
  });
});

// Rota para obter menus de um evento
app.get('/api/events/:id/menus', (req, res) => {
  const eventId = req.params.id;
  db.all("SELECT * FROM menus WHERE event_id = ?", [eventId], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar menus:", err);
      return res.status(500).json({ error: "Erro ao buscar menus" });
    }
    
    // Processar menus com base no idioma
    const processedMenus = processMenusByLanguage(rows, req.language);
    
    res.json(processedMenus);
  });
});

// Rota para obter pratos de um menu
app.get('/api/menus/:id/dishes', (req, res) => {
  const menuId = req.params.id;
  db.all("SELECT * FROM dishes WHERE menu_id = ?", [menuId], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar pratos:", err);
      return res.status(500).json({ error: "Erro ao buscar pratos" });
    }
    
    // Processar pratos com base no idioma
    const processedDishes = processDishesByLanguage(rows, req.language);
    
    res.json(processedDishes);
  });
});

// Rota para o usuário atual (mock para testes)
app.get('/api/user', (req, res) => {
  res.json({
    id: 1,
    name: "Usuário de Teste",
    email: "usuario@teste.com",
    role: "client"
  });
});

// Iniciar o servidor
const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
}); 