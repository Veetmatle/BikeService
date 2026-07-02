# BikeService: Aplikacja dla małych serwisów rowerowych wykonana jako MVP
Do zarządzania zleceniami w warsztacie. Userzy obsługują zlecenia przez panel, a klienci bez logowania mogą śledzić status zlecenia przez link z guidem (z maila).

## Funkcjonalności

### Adimn może:
- Zalogować się, zarządzać kontem
- Dodawać, edytować i usuwać zlecenia klientów
- Zmieniać status zlecenia
- Dodawać i usuwać zdjęcia na zleceniu
- Tagować mechaników (tworzy powiadomienie)
- Przeglądać powiadomienia i oznaczać je jako przeczytane
- Zarządzać kontami pracowników
- Widzieć dashboard

### Mechanik może:
- Zalogować się i zarządzać kontem
- Tworzyć i edytować zlecenia 
- Zmieniać status zleceń (bez możliwości usuwania)
- Dodawać i usuwać zdjęcia na zl
- Tagować innych pracowników 
- Przeglądać i obsługiwać swoje powiadomienia
- Widzieć dashboard i listę zleceń

### Klient (bez logowania):
- Wchodzi na publiczny URL, który dostał na maila i sprawdza informacja o swoim zlecneiu
- Dostaje mail z linkiem po przyjęciu zlecenia przez serwis
- Dostaje mail gdy rower jest gotowy do odbioru

## Stack technologiczny

1. Backend - ASP.NET Core (.NET 10)
2. Baza danych - PgSQL 16, Entity Framework Core 9 jako ORM
3. Autoryzacja - JWT + Refresh Token (leci w cookie) 
4. Hasła - BCrypt
5. Mail - MailKit, SMTP
6. Front - React 18 + TS + Vite 
7. Konteneryzacja - Docker + Nginx 
8. Testy - xUnit + Moq 


## Checkpointy z wymagań projektowych

### Na 3.0:

1. Działający Spring Boot => **ASP.NET Core**, działa lokalnie i w Dockerze 
2. Połączenie z bazą danych => **PgSQL** przez **EFC** + migracje automatycznie przy starcie 
3. CRUD dla 1 encji => CRUD dla zlecen + CRUD dla użytkowników i powiadomień 

### Na 4.0:

1. Struktura: **Controller > Service > Repository > DbContext**, każda warstwa ma interfejs, zależności wstrzykiwane przez DI jako scoped 
2. DTO + Walidacja danych: Osobne klasy DTO dla Create/Update/Response, walidacja przez atrybuty
3. Obsługa błędów: **GlobalExceptionHandler** (jako middleware) łapie wszystkie nieobsłużone wyjątki i mapuje je na kody HTTP + własne typy wyjątków
4. Security: **JWT**: token z claims (ID, rola, email), czas życia 2h, **Refresh Token** (64 losowe bajty, 30 dni, jednorazowy, rotacja przy każdym użyciu) w HttpOnly+Secure cookie; 
5. role admin, mechanic

### Na 5.0:

1. Unit Testy: **xUnit + Moq**; unit testy serwisów i testy integracyjne kontrolerów 
2. Events: **OrderCreatedEvent** i **OrderReadyForPickupEven** przy tworzeniu zlecenia i zmianie statusu na "do odbioru"; obsługiwane przez **OrderEventDispatcher** => **EmailService** (wysyłka maila przez SMTP); błędy wysyłki nie przerywają robienia zlecenia 
3. Czysty kod: powinno być okej, starałem się porozdzielać na foldery, zależności oczywiście wstrzykiwane przez DI, pipeline z middleware w program.cs rejestrowany
4. Front: **React 18 + TS** (SPA) konsumujący REST API: panel zarządzania zleceniami, routing, silent refresh tokenu JWT (Axios), publiczna strona śledzenia zlecenia bez logowania 

## Jak uruchomić

### Docker 

Docker Desktop

```bash
# Klon repo
# Stworzenie i uzupełnienie env + appsetingsów
# Postawienie kontenerów po buildzie
docker-compose up --build -d
```

Aplikacja dostępna pod:
- **Frontend:** http://localhost:3000
- **Backend API / Swagger:** http://localhost:5100/swagger

**Konto admina (robione na starcie)** `admin@bikeservice.pl` / `Admin1234!`

Lub osobno backend i frontend z uzupełnieniem danych.

## Testy

Framework xUnit, mockowanie przez Moq

```bash
dotnet test BikeService.Tests
```

Testy:
- `Services/AuthServiceTests.cs`: logowanie, refresh token, zmiana hasła
- `Services/UserServiceTests.cs`: zarządzanie użytkownikami
- `Services/ServiceOrderServiceTests.cs`: CRUD zleceń, upload zdjęć, statusy, eventy
- `Integration/AuthIntegrationTests.cs`: testy kontrolera autoryzacji
- `Integration/UserIntegrationTests.cs`: testy zarządzania użytkownikami
- `Integration/ServiceOrderIntegrationTests.cs`: testy zleceń


## Front

Aplikacja React. 

1. Logowanie: Formularz logowania, JWT w localStorage 
2. Dashboard:  Liczniki zleceń po statusie, lista ostatnich zgłoszeń 
3. Lista zleceń:  Filtrowanie, wyszukiwanie, paginacja 
4. Szczegóły zlecenia:  Widok + edycja, zmiana statusu, upload zdjęć, tagowanie userów 
5. Nowe zlecenie:  Formularz 
6. Śledzenie (przez klienta):  Strona bez logowania, klient wkleja linka z maila i widzi status zlecenia 
7. Powiadomienia:  Lista tagów + oznaczanie jako przeczytane 
8. Użytkownicy:  Zarządzanie kontami 
9. Profil:  Edycja danych usera + hasło (zmiana)

---

## Schemat bazy danych

5 tabel: **Users**, **Roles**, **ServiceOrders**, **OrderPhotos**, **Notifications**, **RefreshTokens**
