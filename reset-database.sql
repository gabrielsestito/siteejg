-- ============================================
-- Script SQL para Resetar o Banco de Dados
-- ============================================
-- Execute: mysql -u ejg_user -p ejg_site < reset-database.sql
-- CUIDADO: Isso apaga TODOS os dados existentes!
-- ============================================

-- Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Excluir todas as tabelas
DROP TABLE IF EXISTS `cashflow`;
DROP TABLE IF EXISTS `boletoinstallment`;
DROP TABLE IF EXISTS `file`;
DROP TABLE IF EXISTS `orderitem`;
DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS `cartitem`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `product`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `deliveryzone`;
DROP TABLE IF EXISTS `user`;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Agora execute o database.sql para recriar tudo:
-- mysql -u ejg_user -p ejg_site < database.sql

