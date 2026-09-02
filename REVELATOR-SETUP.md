# Revelator Bot — Droplet Setup Runbook

এই ফিচার ৩টা নতুন জিনিস দরকার যা এই সার্ভারে আগে ছিল না: **Redis** (BullMQ queue-এর জন্য), একটা **encryption key** (Revelator পাসওয়ার্ড DB-তে এনক্রিপ্টেড রাখার জন্য), আর ২টা নতুন **PM2 process** (upload worker + analytics worker)। নিচে প্রতিটা ধাপ কমান্ড-বাই-কমান্ড।

**চালানোর আগে:** `git pull` করে নতুন কোড ড্রপলেটে আনো, `npm install` চালাও (নতুন প্যাকেজ: `puppeteer-extra`, `puppeteer-extra-plugin-stealth`, `bullmq`, `ioredis`), তারপর `npm run build`।

## ১. Redis install করা

```bash
sudo apt update
sudo apt install -y redis-server
```

Enable + start:

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Confirm এটা চলছে:

```bash
redis-cli ping
```

`PONG` দেখলে ঠিক আছে।

## ২. Encryption key + env ভ্যারিয়েবল

একটা 32-byte hex key জেনারেট করো — এটা দিয়েই Revelator পাসওয়ার্ড DB-তে encrypt হবে:

```bash
openssl rand -hex 32
```

আউটপুটটা কপি করে সার্ভারের `.env` ফাইলে (server/.env) এই লাইনগুলো যোগ করো:

```
SETTINGS_ENCRYPTION_KEY=<উপরের openssl কমান্ডের আউটপুট>
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# তোমাদের নিজস্ব Revelator white-label লগইন ডোমেইন — এটা ptunestudio.com না,
# dashboard-for-sale-এর নিজের backstage subdomain বসাতে হবে।
REVELATOR_BASE_URL=https://<your-label>.backstage-domain.com

# ঐচ্ছিক — না দিলে ডিফল্ট /.tmp/revelator ব্যবহার হবে।
REVELATOR_UPLOAD_TEMP_DIR=/var/www/ans-server/tmp/revelator-upload
REVELATOR_ANALYTICS_TEMP_DIR=/var/www/ans-server/tmp/revelator-analytics

# nightly analytics sync সময় (cron format, ডিফল্ট রাত ৩টা)
REVELATOR_ANALYTICS_CRON=0 3 * * *
```

⚠️ **`SETTINGS_ENCRYPTION_KEY` একবার সেট করে আর বদলিও না** — বদলালে আগে সেভ করা Revelator পাসওয়ার্ড decrypt করা যাবে না (আবার নতুন করে অ্যাডমিন সেটিংস পেইজ থেকে সেভ করতে হবে)।

## ৩. Headless Chromium-এর সিস্টেম dependency চেক

Puppeteer নিজের সাথে Chromium bundle করে আনে, কিন্তু bare Ubuntu droplet-এ কিছু লাইব্রেরি লাগে:

```bash
sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
  libpangocairo-1.0-0 fonts-liberation
```

Puppeteer-এর Chrome বাইনারি ঠিক আছে কিনা কনফার্ম করো (npm install-এর সময় এমনিতেই ইন্সটল হয়ে যাওয়ার কথা):

```bash
node -e "require('puppeteer').executablePath()"
```

## ৪. PM2 workers চালু করা

এই রিপোতে এখন `server/ecosystem.config.cjs` আছে — এতে ৩টা app আছে: `api` (তোমাদের বর্তমান সার্ভার), `revelator-upload-worker`, `revelator-analytics-worker`।

**তোমার বর্তমান `api` process যেভাবে চলছে সেটা না ঘেঁটে শুধু নতুন ২টা worker যোগ করতে** এই কমান্ড ব্যবহার করো:

```bash
cd /path/to/dashboard-for-sale/server
pm2 start ecosystem.config.cjs --only revelator-upload-worker,revelator-analytics-worker
```

কনফার্ম করো দুটোই `online`:

```bash
pm2 status
```

লগ চেক করো কোনো crash loop হচ্ছে কিনা:

```bash
pm2 logs revelator-upload-worker --lines 50
pm2 logs revelator-analytics-worker --lines 50
```

সব ঠিকঠাক থাকলে save করো যাতে reboot-এর পরও থাকে:

```bash
pm2 save
```

## ৫. প্রথম টেস্ট

1. Admin panel-এ লগইন করে **Settings → Revelator Settings** পেইজে যাও, Revelator email/password সেভ করো।
2. যেকোনো একটা টেস্ট audio release-এর admin **ViewRelease** পেইজে গিয়ে **"Send To Revelator"** চাপো — একটা মোডাল খুলবে, লাইভ প্রোগ্রেস দেখাবে।
3. প্রথম রান-এ selector calibration লাগতে পারে (দেখো `pm2 logs revelator-upload-worker`-এ কী এরর আসে) — এটা প্রত্যাশিত, রিয়েল সাইটে প্রথমবার চালানোর পর ছোটখাটো fix লাগতে পারে।

## মেমোরি সতর্কতা

Puppeteer + Chromium মেমোরি-হাংরি (VEVO transfer-এর সময় আগে একবার OOM হয়েছিল, একই ঝুঁকি এখানেও আছে)। যদি `revelator-upload-worker` বা `revelator-analytics-worker` বারবার crash/restart করে (`pm2 status`-এ `restarts` কলাম বাড়তে থাকলে):

```bash
free -h          # available RAM চেক করো
pm2 logs revelator-upload-worker --err --lines 100
```

দরকার হলে droplet-এর RAM বাড়াতে হতে পারে, অথবা `ecosystem.config.cjs`-এ `node_args: '--max-old-space-size=1024'` কমিয়ে নিরাপদ মার্জিনে আনতে হতে পারে।
