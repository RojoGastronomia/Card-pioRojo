#!/usr/bin/env python3
"""
Script para processar arquivos CSV de cardápios e gerar comandos SQL
"""

import csv
import os
import re
from pathlib import Path

def clean_price(price_str):
    """Limpa e converte string de preço para float"""
    if not price_str or price_str.strip() == '':
        return 0.0
    
    # Remove R$, espaços e vírgulas
    cleaned = re.sub(r'[R$\s,]', '', price_str.strip())
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def clean_text(text):
    """Limpa e normaliza texto para evitar problemas de encoding"""
    if not text:
        return ""
    
    # Mapeia caracteres problemáticos
    char_mapping = {
        'ç': 'c',
        'Ç': 'C',
        'ã': 'a',
        'Ã': 'A',
        'õ': 'o',
        'Õ': 'O',
        'á': 'a',
        'Á': 'A',
        'à': 'a',
        'À': 'A',
        'â': 'a',
        'Â': 'A',
        'é': 'e',
        'É': 'E',
        'ê': 'e',
        'Ê': 'E',
        'í': 'i',
        'Í': 'I',
        'ó': 'o',
        'Ó': 'O',
        'ô': 'o',
        'Ô': 'O',
        'ú': 'u',
        'Ú': 'U',
        'ü': 'u',
        'Ü': 'U',
        'ñ': 'n',
        'Ñ': 'N'
    }
    
    cleaned = text
    for old_char, new_char in char_mapping.items():
        cleaned = cleaned.replace(old_char, new_char)
    
    return cleaned.strip()

def extract_menu_name(filename):
    """Extrai o nome do menu do nome do arquivo"""
    # Remove extensão e caminho
    name = Path(filename).stem
    
    # Mapeia nomes de arquivo para nomes de menu
    menu_mapping = {
        'ALMOÇO BUFFET -  PREMIUM': 'ALMOÇO BUFFET -  PREMIUM',
        'ALMOÇO EM BUFFET - VIP': 'ALMOÇO EM BUFFET - VIP',
        'ALMOÇO EM BUFFET – STANDARD': 'ALMOÇO EM BUFFET – STANDARD',
        'ALMOÇO EMPRATADO – 3 TEMPOS': 'ALMOÇO EMPRATADO – 3 TEMPOS',
        'BRUNCH': 'BRUNCH',
        'CAFÉ DA MANHÃ PREMIUM': 'CAFÉ DA MANHÃ PREMIUM',
        'CAFÉ DA MANHÃ STANDARD': 'CAFÉ DA MANHÃ STANDARD',
        'COFFEE BREAK BÁSICO': 'COFFEE BREAK BÁSICO',
        'COFFEE BREAK BÁSICO II': 'COFFEE BREAK BÁSICO II',
        'COFFEE BREAK PREMIUM': 'COFFEE BREAK PREMIUM',
        'COFFEE BREAK STANDARD': 'COFFEE BREAK STANDARD',
        'COFFEE BREAK VIP': 'COFFEE BREAK VIP',
        'COQUETEL VOLANTE BÁSICO': 'COQUETEL VOLANTE BÁSICO',
        'COQUETEL VOLANTE STANDARD': 'COQUETEL VOLANTE STANDARD',
        'COQUETEL VOLANTE VIP': 'COQUETEL VOLANTE VIP',
        'ILHA GASTRONÔMICA STANDARD': 'ILHA GASTRONÔMICA STANDARD',
        'ILHA GASTRONÔMICA VIP': 'ILHA GASTRONÔMICA VIP',
        'BUFFET LOUNGE HUB': 'BUFFET LOUNGE HUB',
        'LUNCH BOX HUB': 'LUNCH BOX HUB'
    }
    
    return menu_mapping.get(name, name)

def process_csv_file(filepath):
    """Processa um arquivo CSV e retorna os dados estruturados"""
    menu_name = extract_menu_name(filepath.name)
    dishes = []
    
    with open(filepath, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file, delimiter=';')
        
        for row in reader:
            evento = row.get('EVENTO', '').strip()
            item = row.get('ITENS', '').strip()
            categoria = row.get('CATEGORIA', '').strip()
            valor = row.get('VALOR', '').strip()
            
            # Pula linhas vazias ou cabeçalhos
            if not item or item == 'ITENS':
                continue
                
            # Pula linhas que são apenas títulos de seção
            if not categoria and '(' in item and ')' in item:
                continue
                
            # Define categoria padrão se não houver
            if not categoria:
                categoria = 'GERAL'
            
            # Limpa textos para evitar problemas de encoding
            item = clean_text(item)
            categoria = clean_text(categoria)
            
            # Calcula preço baseado no valor do menu
            price = clean_price(valor)
            if price == 0:
                # Se não há preço específico, usa preço base
                price = 5.0  # Preço base para itens sem preço específico
            
            dishes.append({
                'name': item,
                'description': f'{item} - {menu_name}',
                'category': categoria,
                'price': price
            })
    
    return {
        'menu_name': menu_name,
        'dishes': dishes
    }

def generate_sql_commands(menu_data):
    """Gera comandos SQL para inserir os dados"""
    sql_commands = []
    
    for menu in menu_data:
        menu_name = menu['menu_name']
        dishes = menu['dishes']
        
        # Comando para inserir pratos
        if dishes:
            sql_commands.append(f"\n-- {menu_name}")
            sql_commands.append(f"WITH menu AS (SELECT id FROM menus WHERE name = '{menu_name}')")
            sql_commands.append("INSERT INTO dishes (name, description, category, menu_id, price) VALUES")
            
            dish_values = []
            for dish in dishes:
                # Escapa aspas simples no nome e descrição
                name = dish['name'].replace("'", "''")
                description = dish['description'].replace("'", "''")
                category = dish['category'].replace("'", "''")
                price = dish['price']
                
                dish_values.append(f"('{name}', '{description}', '{category}', (SELECT id FROM menu), {price:.2f})")
            
            sql_commands.append(",\n".join(dish_values) + ";")
    
    return sql_commands

def main():
    """Função principal"""
    csv_dir = Path("../Novo Cardapio Microsoft (csv)")
    
    if not csv_dir.exists():
        print(f"Diretório não encontrado: {csv_dir}")
        return
    
    all_menu_data = []
    
    # Processa todos os arquivos CSV
    for csv_file in csv_dir.glob("*.csv"):
        print(f"Processando: {csv_file.name}")
        try:
            menu_data = process_csv_file(csv_file)
            all_menu_data.append(menu_data)
        except Exception as e:
            print(f"Erro ao processar {csv_file.name}: {e}")
    
    # Gera comandos SQL
    sql_commands = generate_sql_commands(all_menu_data)
    
    # Salva em arquivo
    output_file = Path("../migrations/015_complete_csv_dishes.sql")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Comandos SQL gerados automaticamente dos arquivos CSV\n")
        f.write("-- Este arquivo contém todos os pratos dos cardápios CSV\n\n")
        
        for command in sql_commands:
            f.write(command + "\n")
        
        # Adiciona comando para criar relacionamentos
        f.write("\n-- Criar relacionamentos entre menus e pratos\n")
        f.write("INSERT INTO menu_dishes (menu_id, dish_id)\n")
        f.write("SELECT m.id, d.id\n")
        f.write("FROM menus m\n")
        f.write("JOIN dishes d ON d.menu_id = m.id\n")
        f.write("ON CONFLICT DO NOTHING;\n")
    
    print(f"Arquivo SQL gerado: {output_file}")
    print(f"Total de menus processados: {len(all_menu_data)}")
    
    # Conta total de pratos
    total_dishes = sum(len(menu['dishes']) for menu in all_menu_data)
    print(f"Total de pratos: {total_dishes}")

if __name__ == "__main__":
    main() 