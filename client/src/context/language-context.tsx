import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';

// Definindo os idiomas disponíveis
export type Language = 'pt' | 'en';

// Interface para as traduções
export interface Translations {
  [key: string]: {
    [key: string]: {
      [key in Language]: string;
    };
  };
}

// Objeto de traduções
export const translations: Translations = {
  navbar: {
    home: {
      pt: 'Início',
      en: 'Home',
    },
    events: {
      pt: 'Eventos',
      en: 'Events',
    },
    myOrders: {
      pt: 'Meus Pedidos',
      en: 'My Orders',
    },
    login: {
      pt: 'Entrar',
      en: 'Login',
    },
    logout: {
      pt: 'Sair',
      en: 'Logout',
    },
    myAccount: {
      pt: 'Minha Conta',
      en: 'My Account',
    },
    adminPanel: {
      pt: 'Painel Administrativo',
      en: 'Admin Panel',
    },
    homePage: {
      pt: 'Página Inicial',
      en: 'Home Page',
    },
  },
  admin: {
    dashboard: {
      pt: 'Dashboard',
      en: 'Dashboard'
    },
    welcome: {
      pt: 'Bem-vindo ao Painel Administrativo',
      en: 'Welcome to the Admin Panel'
    },
    overview: {
      pt: 'Visão Geral',
      en: 'Overview'
    },
    totalUsers: {
      pt: 'Total de Usuários',
      en: 'Total Users'
    },
    totalEvents: {
      pt: 'Total de Eventos',
      en: 'Total Events'
    },
    totalOrders: {
      pt: 'Total de Pedidos',
      en: 'Total Orders'
    },
    totalRevenue: {
      pt: 'Receita Total',
      en: 'Total Revenue'
    },
    recentOrders: {
      pt: 'Pedidos Recentes',
      en: 'Recent Orders'
    },
    orderId: {
      pt: 'ID do Pedido',
      en: 'Order ID'
    },
    customer: {
      pt: 'Cliente',
      en: 'Customer'
    },
    event: {
      pt: 'Evento',
      en: 'Event'
    },
    date: {
      pt: 'Data',
      en: 'Date'
    },
    status: {
      pt: 'Status',
      en: 'Status'
    },
    amount: {
      pt: 'Valor',
      en: 'Amount'
    },
    viewAll: {
      pt: 'Ver Todos',
      en: 'View All'
    },
    noRecentOrders: {
      pt: 'Nenhum pedido recente',
      en: 'No recent orders'
    },
    loading: {
      pt: 'Atualizando dados em tempo real...',
      en: 'Updating real-time data...'
    },
    error: {
      pt: 'Erro ao atualizar dados',
      en: 'Error updating data'
    },
    errorDescription: {
      pt: 'Ocorreu um erro ao atualizar os dados',
      en: 'An error occurred while updating the data'
    },
    success: {
      pt: 'Dados atualizados com sucesso',
      en: 'Data updated successfully'
    },
    exportReport: {
      pt: 'Exportar Relatório',
      en: 'Export Report'
    },
    dataUpdated: {
      pt: 'Dados atualizados!',
      en: 'Data updated!'
    },
    realTimeUpdatesActive: {
      pt: 'Atualizações em tempo real ativas',
      en: 'Real-time updates active'
    },
    noRealTimeConnection: {
      pt: 'Sem conexão em tempo real',
      en: 'No real-time connection'
    },
    realTime: {
      pt: 'Tempo real',
      en: 'Real-time'
    },
    offline: {
      pt: 'Offline',
      en: 'Offline'
    },
    lastUpdate: {
      pt: 'Última atualização',
      en: 'Last update'
    },
    updateNow: {
      pt: 'Atualizar Agora',
      en: 'Update Now'
    },
    disable: {
      pt: 'Desativar',
      en: 'Disable'
    },
    enableAuto: {
      pt: 'Ativar Auto',
      en: 'Enable Auto'
    },
    connectionError: {
      pt: 'Erro de conexão',
      en: 'Connection error'
    },
    pendingEvents: {
      pt: 'Eventos Pendentes',
      en: 'Pending Events'
    },
    waitingDelivery: {
      pt: 'Aguardando entrega',
      en: 'Waiting for delivery'
    },
    registeredClients: {
      pt: 'Clientes Cadastrados',
      en: 'Registered Clients'
    },
    onlyClientUsers: {
      pt: 'Apenas usuários com função "cliente"',
      en: 'Only users with "client" role'
    },
    currentMonthEvents: {
      pt: 'Eventos do Mês Atual',
      en: 'Current Month Events'
    },
    totalOrdersThisMonth: {
      pt: 'Total de pedidos registrados no mês corrente',
      en: 'Total orders registered in current month'
    },
    revenue: {
      pt: 'Faturamento',
      en: 'Revenue'
    },
    revenueDescription: {
      pt: 'Realizado (concluído) + Potencial (pendente e confirmado)',
      en: 'Realized (completed) + Potential (pending and confirmed)'
    },
    couldNotLoadStats: {
      pt: 'Não foi possível carregar os dados estatísticos',
      en: 'Could not load statistics data'
    },
    tryAgain: {
      pt: 'Tentar novamente',
      en: 'Try again'
    },
    ordersByMonth: {
      pt: 'Pedidos por Mês',
      en: 'Orders by Month'
    },
    month: {
      pt: 'Mês',
      en: 'Month'
    },
    quarter: {
      pt: 'Trimestre',
      en: 'Quarter'
    },
    year: {
      pt: 'Ano',
      en: 'Year'
    },
    quantity: {
      pt: 'Quantidade',
      en: 'Quantity'
    },
    noOrdersByMonth: {
      pt: 'Não há dados de pedidos por mês para exibir',
      en: 'No orders by month data to display'
    },
    updateData: {
      pt: 'Atualizar Dados',
      en: 'Update Data'
    },
    orderStatus: {
      pt: 'Status dos Pedidos',
      en: 'Order Status'
    },
    noOrderStatusData: {
      pt: 'Não há dados de status de pedidos para exibir',
      en: 'No order status data to display'
    },
    allOrders: {
      pt: 'Todos os Pedidos',
      en: 'All Orders'
    },
    pending: {
      pt: 'Pendentes',
      en: 'Pending'
    },
    confirmed: {
      pt: 'Confirmado',
      en: 'Confirmed'
    },
    aguardando_pagamento: {
      pt: 'Aguardando Pagamento',
      en: 'Awaiting Payment'
    },
    completed: {
      pt: 'Concluído',
      en: 'Completed'
    },
    total: {
      pt: 'Total',
      en: 'Total'
    },
    updateTable: {
      pt: 'Atualizar Tabela',
      en: 'Update Table'
    },
    noOrdersToDisplay: {
      pt: 'Atenção: Não há pedidos para exibir',
      en: 'Warning: No orders to display'
    },
    backendEmptyOrders: {
      pt: 'O backend está retornando array vazio ou nulo para pedidos',
      en: 'Backend is returning empty or null array for orders'
    },
    guests: {
      pt: 'Convidados',
      en: 'Guests'
    },
    menu: {
      pt: 'Menu',
      en: 'Menu'
    },
    unknown: {
      pt: 'Desconhecido',
      en: 'Unknown'
    },
    applyFilter: {
      pt: 'Aplicar Filtro',
      en: 'Apply Filter'
    },
    clearFilters: {
      pt: 'Limpar Filtros',
      en: 'Clear Filters'
    },
    filterActive: {
      pt: 'Filtro ativo',
      en: 'Active filter'
    },
    updatingFilteredData: {
      pt: 'Atualizando dados filtrados',
      en: 'Updating filtered data'
    },
    updatingAllData: {
      pt: 'Atualizando todos os dados',
      en: 'Updating all data'
    },
    filteredDataUpdated: {
      pt: 'Dados filtrados atualizados com sucesso!',
      en: 'Filtered data updated successfully!'
    },
    allDataUpdated: {
      pt: 'Todos os dados atualizados com sucesso!',
      en: 'All data updated successfully!'
    },
    clearingFilters: {
      pt: 'Limpando filtros e carregando dados completos...',
      en: 'Clearing filters and loading complete data...'
    },
    filtersCleared: {
      pt: 'Filtros limpos! Dados completos carregados.',
      en: 'Filters cleared! Complete data loaded.'
    },
    errorClearingFilters: {
      pt: 'Erro ao limpar filtros',
      en: 'Error clearing filters'
    },
    monthChanged: {
      pt: 'Mês mudou! Filtro atualizado automaticamente para',
      en: 'Month changed! Filter automatically updated to'
    },
    currentMonth: {
      pt: 'Mês Atual',
      en: 'Current Month'
    },
    allData: {
      pt: 'Todos os Dados',
      en: 'All Data'
    },
    orders: {
      pt: 'Pedidos',
      en: 'Orders'
    },
    title: {
      pt: 'Gerenciar Pedidos',
      en: 'Manage Orders'
    },
    events: {
      pt: 'Eventos',
      en: 'Events'
    },
    menus: {
      pt: 'Cardápios',
      en: 'Menus'
    },
    dishes: {
      pt: 'Pratos',
      en: 'Dishes'
    },
    master: {
      pt: 'Master',
      en: 'Master'
    },
    users: {
      pt: 'Usuários',
      en: 'Users'
    },
  },
  users: {
    title: {
      pt: 'Usuários',
      en: 'Users'
    },
    loadError: {
      pt: 'Erro ao carregar usuários',
      en: 'Error loading users'
    },
    newUser: {
      pt: 'Novo Usuário',
      en: 'New User'
    },
    newUserDescription: {
      pt: 'Preencha os campos abaixo para adicionar um novo usuário.',
      en: 'Fill in the fields below to add a new user.'
    },
    username: {
      pt: 'Nome de Usuário',
      en: 'Username'
    },
    usernamePlaceholder: {
      pt: 'username',
      en: 'username'
    },
    email: {
      pt: 'Email',
      en: 'Email'
    },
    emailPlaceholder: {
      pt: 'email@exemplo.com',
      en: 'email@example.com'
    },
    phone: {
      pt: 'Telefone',
      en: 'Phone'
    },
    phonePlaceholder: {
      pt: '(99) 99999-9999',
      en: '(99) 99999-9999'
    },
    password: {
      pt: 'Senha',
      en: 'Password'
    },
    passwordPlaceholder: {
      pt: '******',
      en: '******'
    },
    userType: {
      pt: 'Tipo de Usuário',
      en: 'User Type'
    },
    selectUserType: {
      pt: 'Selecione o tipo de usuário',
      en: 'Select user type'
    },
    userTypeAdmin: {
      pt: 'Administrador',
      en: 'Administrator'
    },
    userTypeUser: {
      pt: 'Cliente',
      en: 'Client'
    },
    cancel: {
      pt: 'Cancelar',
      en: 'Cancel'
    },
    createUser: {
      pt: 'Salvar',
      en: 'Save'
    },
    searchPlaceholder: {
      pt: 'Buscar usuários...',
      en: 'Search users...'
    },
    name: {
      pt: 'Nome',
      en: 'Name'
    },
    contacts: {
      pt: 'Contatos',
      en: 'Contacts'
    },
    actions: {
      pt: 'Ações',
      en: 'Actions'
    },
    userAdded: {
      pt: 'Usuário adicionado',
      en: 'User added'
    },
    userAddedSuccess: {
      pt: 'Usuário foi adicionado com sucesso.',
      en: 'User has been added successfully.'
    },
    addError: {
      pt: 'Erro ao adicionar usuário',
      en: 'Error adding user'
    },
    userDeleted: {
      pt: 'Usuário excluído',
      en: 'User deleted'
    },
    userDeletedSuccess: {
      pt: 'Usuário foi excluído com sucesso.',
      en: 'User has been deleted successfully.'
    },
    deleteError: {
      pt: 'Erro ao excluir usuário',
      en: 'Error deleting user'
    },
    userUpdated: {
      pt: 'Usuário atualizado',
      en: 'User updated'
    },
    userUpdatedSuccess: {
      pt: 'As informações do usuário foram atualizadas com sucesso.',
      en: 'User information has been updated successfully.'
    },
    updateError: {
      pt: 'Erro ao atualizar usuário',
      en: 'Error updating user'
    },
    updateErrorDescription: {
      pt: 'Ocorreu um erro ao atualizar as informações do usuário.',
      en: 'An error occurred while updating user information.'
    },
    participationHistory: {
      pt: 'Histórico de Participação',
      en: 'Participation History'
    },
    participationHistoryDescription: {
      pt: 'Histórico de participação em eventos para',
      en: 'Event participation history for'
    },
    eventNotFound: {
      pt: 'Evento não encontrado',
      en: 'Event not found'
    },
    statusCompleted: {
      pt: 'Concluído',
      en: 'Completed'
    },
    statusPending: {
      pt: 'Pendente',
      en: 'Pending'
    },
    statusAwaitingPayment: {
      pt: 'Aguardando Pagamento',
      en: 'Awaiting Payment'
    },
    statusConfirmed: {
      pt: 'Confirmado',
      en: 'Confirmed'
    },
    statusCancelled: {
      pt: 'Cancelado',
      en: 'Cancelled'
    },
    noHistoryFound: {
      pt: 'Nenhum histórico encontrado.',
      en: 'No history found.'
    },
    close: {
      pt: 'Fechar',
      en: 'Close'
    },
    editUser: {
      pt: 'Editar Usuário',
      en: 'Edit User'
    },
    editUserDescription: {
      pt: 'Edite as informações do usuário',
      en: 'Edit user information'
    },
    fullName: {
      pt: 'Nome Completo',
      en: 'Full Name'
    },
    fullNamePlaceholder: {
      pt: 'Nome completo',
      en: 'Full name'
    },
    newPassword: {
      pt: 'Nova Senha (deixe em branco para manter a atual)',
      en: 'New Password (leave blank to keep current)'
    },
    confirmDelete: {
      pt: 'Tem certeza que deseja deletar',
      en: 'Are you sure you want to delete'
    },
    questionMark: {
      pt: '?',
      en: '?'
    }
  },
  auth: {
    digitalMenu: {
      pt: "Menu Digital",
      en: "Digital Menu"
    },
    heroSubtitle: {
      pt: "A forma mais fácil de gerenciar eventos corporativos.",
      en: "The easiest way to manage corporate events."
    },
    personalizedEvents: {
      pt: "Eventos Personalizados",
      en: "Personalized Events"
    },
    chooseMenuOptions: {
      pt: "Escolha opções de cardápio para cada ocasião",
      en: "Choose menu options for every occasion"
    },
    onlineOrders: {
      pt: "Pedidos Online",
      en: "Online Orders"
    },
    orderOnline: {
      pt: "Faça pedidos de coffee break e refeições online",
      en: "Order coffee breaks and meals online"
    },
    realtimeTracking: {
      pt: "Acompanhamento em tempo real",
      en: "Real-time Tracking"
    },
    trackOrders: {
      pt: "Acompanhe o status dos seus pedidos em tempo real",
      en: "Track your order status in real time"
    },
    loginTitle: {
      pt: "Entrar",
      en: "Login"
    },
    loginSubtitle: {
      pt: "Acesse sua conta para continuar",
      en: "Access your account to continue"
    },
    loginTab: {
      pt: "Entrar",
      en: "Login"
    },
    registerTab: {
      pt: "Registrar",
      en: "Register"
    },
    email: {
      pt: "E-mail",
      en: "Email"
    },
    emailPlaceholder: {
      pt: "email@exemplo.com",
      en: "email@example.com"
    },
    password: {
      pt: "Senha",
      en: "Password"
    },
    passwordPlaceholder: {
      pt: "******",
      en: "******"
    },
    rememberMe: {
      pt: "Lembrar-me",
      en: "Remember me"
    },
    forgotPassword: {
      pt: "Esqueci a senha",
      en: "Forgot password"
    },
    back: {
      pt: "voltar",
      en: "back"
    },
    authRequiredTitle: {
      pt: "Autenticação Necessária",
      en: "Authentication Required"
    },
    authRequiredMessage: {
      pt: "Você precisa estar logado para acessar o carrinho",
      en: "You need to be logged in to access the cart"
    },
    authRequiredDescription: {
      pt: "Faça login para ver seus itens salvos e continuar suas compras",
      en: "Log in to see your saved items and continue shopping"
    },
    loginButton: {
      pt: "Fazer Login",
      en: "Login"
    },
    continueBrowsing: {
      pt: "Continuar Navegando",
      en: "Continue Browsing"
    },
    registerTitle: {
      pt: "Registrar-se",
      en: "Register"
    },
    registerSubtitle: {
      pt: "Crie sua conta para continuar",
      en: "Create your account to continue"
    },
    fullName: {
      pt: "Nome completo",
      en: "Full name"
    },
    fullNamePlaceholder: {
      pt: "Digite seu nome completo",
      en: "Enter your full name"
    },
    username: {
      pt: "Usuário",
      en: "Username"
    },
    usernamePlaceholder: {
      pt: "Digite seu nome de usuário",
      en: "Enter your username"
    },
    confirmPassword: {
      pt: "Confirmar senha",
      en: "Confirm password"
    },
    confirmPasswordPlaceholder: {
      pt: "Confirme sua senha",
      en: "Confirm your password"
    },
    phone: {
      pt: "Telefone",
      en: "Phone"
    },
    phonePlaceholder: {
      pt: "Digite seu telefone",
      en: "Enter your phone number"
    },
    register: {
      pt: "Registrar",
      en: "Register"
    },
  },
  cart: {
    title: {
      pt: "Seu Carrinho",
      en: "Your Cart"
    },
    empty: {
      pt: "Seu carrinho está vazio",
      en: "Your cart is empty"
    },
    emptyDescription: {
      pt: "Adicione eventos ao seu carrinho para continuar.",
      en: "Add events to your cart to continue."
    },
    continueShopping: {
      pt: "Continuar Comprando",
      en: "Continue Shopping"
    },
    subtotal: {
      pt: "Subtotal:",
      en: "Subtotal:"
    },
    serviceFee: {
      pt: "Taxa de serviço (10%):",
      en: "Service fee (10%):"
    },
    waiterFee: {
      pt: "Adicional de garçons:",
      en: "Waiter fee:"
    },
    total: {
      pt: "Total:",
      en: "Total:"
    },
    processing: {
      pt: "Processando...",
      en: "Processing..."
    },
    checkout: {
      pt: "Finalizar Pedido",
      en: "Checkout"
    }
  },
  common: {
    available: {
      pt: "Disponível",
      en: "Available"
    },
    unavailable: {
      pt: "Indisponível",
      en: "Unavailable"
    },
    menuOption: {
      pt: "opção de cardápio",
      en: "menu option"
    },
    menuOptions: {
      pt: "opções de cardápio",
      en: "menu options"
    },
    title: {
      pt: "Título",
      en: "Title"
    },
    subtitle: {
      pt: "Subtítulo",
      en: "Subtitle"
    },
    locationLabel: {
      pt: "Local do evento",
      en: "Event location"
    },
    selectLocation: {
      pt: "Selecione o local",
      en: "Select location"
    },
    addToCart: {
      pt: "Adicionar ao carrinho",
      en: "Add to cart"
    },
    viewMenuOptions: {
      pt: "Ver opções de cardápio",
      en: "View menu options"
    },
    availableMenuOptions: {
      pt: "Opções de cardápio disponíveis",
      en: "Available menu options"
    },
    selectMenuItems: {
      pt: "Selecionar itens do cardápio",
      en: "Select menu items"
    },
    selectItems: {
      pt: "Selecione os itens",
      en: "Select items"
    },
    selectItemsFromCategory: {
      pt: "Selecione os itens da categoria",
      en: "Select items from category"
    },
    confirmSelection: {
      pt: "Confirmar seleção",
      en: "Confirm selection"
    },
    orderSummary: {
      pt: "Resumo do Pedido",
      en: "Order Summary"
    },
    selectedMenu: {
      pt: "Cardápio Selecionado",
      en: "Selected Menu"
    },
    pricePerPerson: {
      pt: "Preço por pessoa",
      en: "Price per person"
    },
    eventDateLabel: {
      pt: "Data do evento",
      en: "Event date"
    },
    eventDate: {
      pt: "Data do evento",
      en: "Event date"
    },
    eventTime: {
      pt: "Horário",
      en: "Time"
    },
    eventTimeLabel: {
      pt: "Horário",
      en: "Time"
    },
    guestCount: {
      pt: "Convidados",
      en: "Guests"
    },
    guestCountLabel: {
      pt: "Convidados",
      en: "Guests"
    },
    waitersCount: {
      pt: "({{count}} garçons)",
      en: "({{count}} waiters)"
    },
    total: {
      pt: "Total",
      en: "Total"
    },
    waiterFee: {
      pt: "Taxa de garçom",
      en: "Waiter fee"
    },
    waiterNote: {
      pt: "Para cada 10 convidados, é necessário 1 garçom. O valor do garçom é de R$ 260,00 por profissional. O número de garçons é calculado automaticamente conforme a quantidade de convidados.",
      en: "For every 10 guests, 1 waiter is required. The waiter fee is R$ 260.00 per professional. The number of waiters is calculated automatically based on the number of guests."
    },
    eventLocation: {
      pt: "Local do evento",
      en: "Event location"
    },
    cancel: {
      pt: "Cancelar",
      en: "Cancel"
    },
    loginRequired: {
      pt: "Login obrigatório",
      en: "Login required"
    },
    loginRequiredMessage: {
      pt: "Você precisa estar logado para continuar.",
      en: "You need to be logged in to continue."
    },
    loginRequiredSubMessage: {
      pt: "Faça login para acessar esta funcionalidade.",
      en: "Please log in to access this feature."
    },
    goToLogin: {
      pt: "Fazer login",
      en: "Go to Login"
    },
  },
  events: {
    title: {
      pt: "Eventos",
      en: "Events"
    },
    subtitle: {
      pt: "Confira nossos eventos disponíveis e escolha o melhor para sua empresa.",
      en: "Check out our available events and choose the best for your company."
    },
    bannerTitle: {
      pt: "Eventos Corporativos",
      en: "Corporate Events"
    },
    bannerSubtitle: {
      pt: "Soluções completas para coffee breaks, almoços e muito mais.",
      en: "Complete solutions for coffee breaks, lunches and more."
    },
    viewAvailableEvents: {
      pt: "Ver Eventos Disponíveis",
      en: "View Available Events"
    },
    availableEvents: {
      pt: "Eventos Disponíveis",
      en: "Available Events"
    },
    filterByStatus: {
      pt: "Filtrar por status",
      en: "Filter by status"
    },
    searchPlaceholder: {
      pt: "Buscar eventos...",
      en: "Search events..."
    },
    noEventsAvailable: {
      pt: "Nenhum evento disponível no momento.",
      en: "No events available at the moment."
    },
    createEvent: {
      pt: "Criar Evento",
      en: "Create Event"
    },
    editEvent: {
      pt: "Editar Evento",
      en: "Edit Event"
    },
    eventNamePortuguese: {
      pt: "Nome do Evento (Português)",
      en: "Event Name (Portuguese)"
    },
    eventNameEnglish: {
      pt: "Nome do Evento (Inglês)",
      en: "Event Name (English)"
    },
    descriptionPortuguese: {
      pt: "Descrição (Português)",
      en: "Description (Portuguese)"
    },
    descriptionEnglish: {
      pt: "Descrição (Inglês)",
      en: "Description (English)"
    },
    imageUrl: {
      pt: "URL da Imagem",
      en: "Image URL"
    },
    location: {
      pt: "Localização",
      en: "Location"
    },
    eventType: {
      pt: "Tipo de Evento",
      en: "Event Type"
    },
    selectEventType: {
      pt: "Selecione o tipo de evento",
      en: "Select event type"
    },
    eventTypeCorporate: {
      pt: "Corporativo",
      en: "Corporate"
    },
    eventTypeWedding: {
      pt: "Casamento",
      en: "Wedding"
    },
    eventTypeBirthday: {
      pt: "Aniversário",
      en: "Birthday"
    },
    eventTypeCoffee: {
      pt: "Coffee Break",
      en: "Coffee Break"
    },
    eventTypeLunch: {
      pt: "Almoço",
      en: "Lunch"
    },
    eventTypeBrunch: {
      pt: "Brunch",
      en: "Brunch"
    },
    eventTypeFestival: {
      pt: "Festival",
      en: "Festival"
    },
    menuOptions: {
      pt: "Opções de Cardápio",
      en: "Menu Options"
    },
    statusLabel: {
      pt: "Status",
      en: "Status"
    },
    selectStatus: {
      pt: "Selecione o status",
      en: "Select status"
    },
    statusActive: {
      pt: "Ativo",
      en: "Active"
    },
    statusInactive: {
      pt: "Inativo",
      en: "Inactive"
    },
    updateEvent: {
      pt: "Atualizar Evento",
      en: "Update Event"
    },
    available: {
      pt: "Disponível",
      en: "Available"
    },
    unavailable: {
      pt: "Indisponível",
      en: "Unavailable"
    },
  },
  home: {
    noEventsAvailable: {
      pt: "Nenhum evento disponível no momento.",
      en: "No events available at the moment."
    }
  },
} 
 


// Interface para o contexto
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: string, key: string) => string;
}

// Valor padrão para o contexto
const defaultContextValue: LanguageContextType = {
  language: 'pt',
  setLanguage: () => {},
  t: () => '',
};

// Criação do contexto
const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

// Hook personalizado para usar o contexto
export const useLanguage = () => useContext(LanguageContext);

// Provider do contexto
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Verifica se há um idioma salvo no localStorage
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'pt';
  });

  // Função para mudar o idioma
  const changeLanguage = (lang: Language) => {
    console.log('Mudando idioma para:', lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Invalidar todas as consultas para que sejam recarregadas no novo idioma
    queryClient.invalidateQueries();
  };

  // Função para traduzir textos
  const t = (section: string, key: string): string => {
    if (translations[section] && translations[section][key]) {
      return translations[section][key][language] || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 