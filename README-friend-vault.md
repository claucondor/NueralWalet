# Friend Vault - Funcionalidad compartida para GuardWallet

## Descripción General
Friend Vault es una característica que permite a los usuarios crear y gestionar billeteras compartidas (vaults) con amigos y familiares. Cada vault requiere la aprobación de todos los miembros para realizar retiros, proporcionando una capa adicional de seguridad para fondos compartidos.

## Componentes Implementados

### Pantallas Principales
1. **FriendVaultScreen.tsx**: Componente principal que muestra la lista de vaults y maneja la navegación entre pantallas.
2. **CreateVaultScreen.tsx**: Permite crear un nuevo vault especificando nombre, descripción y miembros.
3. **VaultDetailsScreen.tsx**: Muestra los detalles de un vault específico, incluyendo balance, miembros y solicitudes de retiro.
4. **DepositVaultScreen.tsx**: Interfaz para depositar fondos en un vault.
5. **WithdrawVaultScreen.tsx**: Interfaz para solicitar retiros de un vault, que requerirán aprobación.

### Integración
- Se ha agregado una nueva pestaña "Vaults" en la pantalla principal de la wallet.
- Se ha creado una ruta dedicada `/friend-vault` para acceder a la funcionalidad.
- Se ha implementado el contexto `FriendVaultContext` para manejar el estado global.

## Funcionalidades

### Gestión de Vaults
- Crear nuevos vaults con múltiples miembros
- Ver lista de vaults existentes
- Ver detalles de cada vault (balance, miembros, historia)

### Operaciones Financieras
- Depositar fondos en vaults
- Solicitar retiros que requieren aprobación
- Votar para aprobar o rechazar solicitudes de retiro
- Ejecutar retiros aprobados

### Sistema de Aprobación
- Cualquier miembro puede solicitar un retiro
- Todos los miembros deben aprobar cada solicitud
- Los fondos solo se liberan cuando todos aprueban
- Cualquier rechazo cancela la solicitud

## Seguridad
- Todos los retiros requieren aprobación múltiple
- Se mantiene un historial completo de transacciones
- Las operaciones están protegidas por la red Stellar
- Se requiere una reserva mínima de 1 XLM en cada vault

## Tecnologías Utilizadas
- React para la interfaz de usuario
- Stellar SDK para operaciones blockchain
- Supabase para almacenamiento persistente
- Context API para gestión de estado

## Próximos Pasos
- Implementar notificaciones para alertar a los miembros sobre nuevas solicitudes
- Añadir soporte para más tokens además de XLM
- Mejorar la gestión de miembros (añadir/eliminar)
- Implementar límites de gasto personalizables 