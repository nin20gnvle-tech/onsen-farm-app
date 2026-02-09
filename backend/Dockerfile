FROM php:8.4-cli

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y git unzip libzip-dev libpng-dev libonig-dev sqlite3 libsqlite3-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite zip gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN mkdir -p bootstrap/cache \
    storage/framework/views \
    storage/framework/cache \
    storage/framework/sessions \
    database \
    && chmod -R 775 bootstrap/cache storage database

RUN composer install --no-dev --optimize-autoloader

EXPOSE 10000
CMD ["sh", "-c", "touch database/database.sqlite && php artisan migrate --force --seed && php -S 0.0.0.0:${PORT} -t public"]
