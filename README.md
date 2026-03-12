# 🦷 Dental Clinic ERP

Un sistema integral de gestión para clínicas dentales, diseñado para administrar pacientes, citas, procedimientos, sesiones y pagos de forma clara e intuitiva.

## ✨ Características

### Gestión de Pacientes
- 📋 Registro completo de pacientes con información personal
- 📞 Búsqueda rápida por nombre o teléfono
- 💰 Vista del estado financiero (pagado vs pendiente)
- 📊 Historial completo de citas y procedimientos
- 🏥 Información médica (alergias, condiciones previas)

### Gestión de Doctores
- 👨‍⚕️ Registro de profesionales con especialidades
- 📅 Vista de citas asignadas
- 📈 Estadísticas de trabajo clínico
- 📧 Contacto y datos de identificación

### Citas y Procedimientos
- 📅 Programación de citas (paciente + doctor + fecha/hora)
- 🔧 Creación de procedimientos asociados a tratamientos
- 📝 Estados: planificado, en progreso, completado, cancelado
- 🩺 Registro de diagnóstico y pieza dental afectada

### Sesiones (Avance de Tratamiento)
- 🔢 Numeración automática de sesiones
- 📋 Descripción detallada del trabajo realizado
- 🔗 Asociación a citas específicas
- ✅ Control del progreso del tratamiento

### Gestión Financiera
- 💰 Registro de pagos por procedimiento
- 📊 Múltiples métodos de pago (efectivo, tarjeta, transferencia, cheque)
- 📈 Cálculo automático de pagado vs pendiente
- 💳 Seguimiento de referencias de transacción

### Catálogo de Tratamientos
- 📚 Definición de tipos de servicios
- 💵 Precios base configurables
- 📝 Descripciones detalladas

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- PostgreSQL 12+ (instalado localmente o en servidor)
- npm o pnpm

### Instalación Local

```bash
# 1. Descargar y extraer el proyecto
unzip dental-clinic-erp.zip
cd dental-clinic-erp

# 2. Instalar dependencias
npm install
# o si usas pnpm:
pnpm install

# 3. Crear base de datos PostgreSQL
# Abre pgAdmin o psql y ejecuta:
psql -U postgres
CREATE DATABASE dental_clinic_erp;
# Salir con \q

# 4. Ejecutar el script SQL para crear tablas
psql -U postgres -d dental_clinic_erp -f query.sql
# Si el archivo está en otra ubicación, especifica la ruta completa

# 5. Verificar credenciales en .env.local
# Debe tener:
# DATABASE_URL="postgresql://postgres:Admin123@localhost:5432/dental_clinic_erp"

# 6. Ejecutar en desarrollo
npm run dev
# o pnpm dev

# 7. Abrir en navegador
# http://localhost:3000
```

**Credenciales por defecto:**
- Usuario: `postgres`
- Contraseña: `Admin123`
- Puerto: `5432`
- Database: `dental_clinic_erp`

### Primeros Pasos
1. **Crear Tratamientos**: Catálogo Tratamientos → Nuevo Tratamiento
2. **Registrar Doctores**: Doctores → Nuevo Doctor  
3. **Crear Pacientes**: Pacientes → Nuevo Paciente
4. **Programar Citas**: Citas → Nueva Cita
5. **Crear Procedimientos**: Ver Paciente → Nuevo Procedimiento
6. **Registrar Sesiones**: Detalle Procedimiento → Nueva Sesión
7. **Registrar Pagos**: Detalle Procedimiento → Pago

## 📁 Estructura del Proyecto

```
├── app/                 # Next.js App Router
│   ├── page.tsx        # Dashboard
│   ├── patients/       # Gestión de pacientes
│   ├── doctors/        # Gestión de doctores
│   ├── appointments/   # Gestión de citas
│   ├── procedures/     # Gestión de procedimientos
│   ├── treatments/     # Catálogo de tratamientos
│   └── payments/       # Gestión de pagos
├── components/
│   ├── layout/         # Navegación (sidebar)
│   ├── forms/          # Formularios de cada entidad
│   └── ui/            # Componentes shadcn/ui
├── lib/
│   ├── types.ts       # TypeScript interfaces
│   ├── supabase.ts    # Cliente Supabase
│   └── db.ts          # Funciones CRUD
└── docs/
    ├── SETUP.md               # Setup completo
    ├── QUICK_START.md         # Guía rápida
    ├── SUPABASE_SETUP.md      # Config Supabase
    └── TECHNICAL.md           # Documentación técnica
```

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes + Node.js
- **Database**: PostgreSQL 12+ (conexión pura con `pg`)
- **Validation**: React Hook Form + Zod
- **UI**: shadcn/ui + Tailwind CSS 4
- **Icons**: Lucide React

## 📚 Documentación

Ver sección **Quick Start** arriba para instalación paso a paso. El proyecto incluye:
- `query.sql` - Script para crear tablas y datos de ejemplo
- `.env.local` - Configuración de conexión a PostgreSQL
- `app/api/` - APIs REST para todas las operaciones

## 🎯 Flujo de Datos

```
Paciente
    ↓
Cita (paciente + doctor + fecha)
    ↓
Procedimiento (tratamiento + paciente)
    ↓
Sesión (avance del tratamiento)
    ↓
Pago (registro financiero)
```

## 🔐 Seguridad

**Nota sobre Producción:**
- El proyecto usa credenciales PostgreSQL locales en `.env.local`
- Para producción en servidor VPS, actualiza `DATABASE_URL` con credenciales reales
- Asegúrate de usar variables de entorno seguras en plataformas como Vercel
- Implementa autenticación y autorización según tus necesidades

## 📱 Características de UI/UX

- ✅ Interfaz intuitiva y limpia
- ✅ Navegación lateral consistente
- ✅ Formularios con validación en tiempo real
- ✅ Búsqueda y filtros
- ✅ Notificaciones toast para feedback
- ✅ Estados visuales claros
- ✅ Responsivo (mobile-friendly)

## 🚧 Validaciones Implementadas

- Campos requeridos en todos los formularios
- Emails válidos
- Montos numéricos con decimales
- Teléfonos mínimo 8 caracteres
- Ciudades desde catálogo
- Piezas dentales numeradas (sistema internacional)

## 💡 Funcionalidades Clave

### Numeración Automática de Sesiones
Las sesiones se numeran automáticamente (1, 2, 3...) sin necesidad de entrada manual del usuario.

### Cálculo Automático de Saldos
Los saldos pendientes se calculan automáticamente:
```
Pendiente = Costo Total - Total Pagado
```

### Búsqueda y Filtros
- Pacientes: por nombre o teléfono
- Doctores: por nombre o especialidad
- Citas: por estado o fecha

## 🐛 Troubleshooting

### Error: "DATABASE_URL environment variable is required"
→ Asegúrate de que `.env.local` existe y contiene `DATABASE_URL`

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
→ PostgreSQL no está corriendo. Inicia el servicio:
```bash
# En Linux/Mac:
brew services start postgresql
# En Windows: abre pgAdmin o Services

# O verifica conexión:
psql -U postgres -d dental_clinic_erp
```

### Error: "relation does not exist"
→ Ejecuta el script SQL para crear tablas:
```bash
psql -U postgres -d dental_clinic_erp -f query.sql
```

### Error: "Cannot load data"
→ Abre DevTools (F12) → Consola para ver errores detallados

## 🎓 Para Desarrolladores

**Estructura de Código:**
- `lib/pg.ts` - Conexión a PostgreSQL con pool de conexiones
- `lib/db-pg.ts` - Todas las funciones CRUD (sin ORM)
- `app/api/**/route.ts` - APIs REST para cada entidad
- Componentes en `app/` consultan las APIs, no acceden directamente a la BD

## 📈 Mejoras Futuras

- [ ] Autenticación y control de roles
- [ ] Reportes y análisis
- [ ] Exportación a PDF/Excel
- [ ] Notificaciones por email
- [ ] Recordatorios de citas
- [ ] Gráficos de ingresos
- [ ] Integración de pagos (Stripe, MercadoPago)
- [ ] Realtime updates

## 📞 Soporte

Para problemas con:
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **React Hook Form**: https://react-hook-form.com
- **Tailwind CSS**: https://tailwindcss.com/docs

## 📄 Licencia

MIT

## 👥 Contribuciones

Las contribuciones son bienvenidas. Para cambios mayores:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Contacto

Para preguntas o sugerencias sobre este ERP:
- Revisa la documentación en `/docs`
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

**¡Gracias por usar Dental Clinic ERP!** 🦷
