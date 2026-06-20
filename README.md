# Dawah Activities Tracking System

> A full-stack web application for collecting and tracking field dawah (outreach) activities, featuring a multi-step data-entry workflow, a role-based dashboard, and one-click Excel export.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.2+-777BB4?logo=php&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green">
</p>

📄 [النسخة العربية / Arabic version](./README.ar.md)

---

## Overview

This system streamlines how field teams collect and report dawah activity data. Coordinators fill out a guided, multi-step form, and managers review every submission from a central dashboard with filtering and Excel export. Authentication is token-based via Laravel Sanctum, and the interface uses a clean Arabic (RTL) design.

## Features

- 🔐 **Secure authentication** with Laravel Sanctum (token-based)
- 📝 **Multi-step form** (9 steps) with auto-save between steps
- 📊 **Management dashboard** to view, filter, and manage all submissions
- 📁 **Excel export** — both a detailed report and a summary sheet
- 🔎 **Filtering** by preacher name and region
- 🎨 **Polished Arabic (RTL) UI** with a custom Islamic color palette

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- React Router
- React Hook Form
- Axios

**Backend**
- Laravel 11
- Laravel Sanctum (authentication)
- Laravel Excel / Maatwebsite (Excel export)
- MySQL / PostgreSQL

## Getting Started

### Prerequisites

- PHP >= 8.2 and Composer
- Node.js >= 18 and npm
- MySQL or PostgreSQL

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Set your database credentials in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=root
DB_PASSWORD=
```

Run the migrations and start the server:

```bash
php artisan migrate
php artisan serve
```

The API will run at `http://localhost:8000`.

> **Optional — create a test user** via `php artisan tinker`:
> ```php
> $user = new App\Models\User();
> $user->name = 'Admin';
> $user->email = 'admin@example.com';
> $user->password = Hash::make('password');
> $user->save();
> ```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:5173`.

## API Endpoints

### Authentication
| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| POST   | `/api/login`    | Log in                   |
| POST   | `/api/logout`   | Log out                  |
| GET    | `/api/user`     | Get the current user     |

### Forms
| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| GET    | `/api/forms`       | List all forms         |
| POST   | `/api/forms`       | Create a new form      |
| GET    | `/api/forms/{id}`  | Get a single form      |
| PUT    | `/api/forms/{id}`  | Update a form          |
| DELETE | `/api/forms/{id}`  | Delete a form          |

### Activities
| Method | Endpoint                        | Description           |
| ------ | ------------------------------- | --------------------- |
| GET    | `/api/activities?form_id={id}`  | List activities       |
| POST   | `/api/activities`               | Create an activity    |
| PUT    | `/api/activities/{id}`          | Update an activity    |
| DELETE | `/api/activities/{id}`          | Delete an activity    |

### Dashboard & Export
| Method | Endpoint                        | Description                  |
| ------ | ------------------------------- | ---------------------------- |
| GET    | `/api/dashboard/summary`        | Summary of all submissions   |
| GET    | `/api/export/excel/{form_id}`   | Export a form to Excel       |

## Project Structure

```
.
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Models/
│   │   ├── Http/Controllers/
│   │   └── Exports/
│   ├── database/migrations/
│   └── routes/
├── frontend/             # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── README.md
```

## Deployment

Deployment guides are included in the repository:

- `QUICK_DEPLOY.md` — quick deployment guide
- `DEPLOY_CHECKLIST.md` — full step-by-step checklist
- `deploy-production.sh` / `deploy-production.ps1` — deployment scripts

**Requirements:** PHP >= 8.2, Composer, Node.js >= 18, MySQL/MariaDB, Apache or Nginx, and an SSL certificate (recommended).

## Roadmap

- [ ] Custom form builder
- [ ] Advanced statistical reports
- [ ] User notifications
- [ ] Multi-language support
- [ ] Mobile app

## License

Released under the [MIT License](./LICENSE).
