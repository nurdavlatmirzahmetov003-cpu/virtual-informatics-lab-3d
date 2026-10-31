# DEPLOY_GCP — Google Cloud-та бір виртуалды машинаға орнату (V4 §12.2)

Бұл нұсқаулық жобаны **Google Cloud Compute Engine**-дегі бір **e2-small** виртуалды машинасына (VM) қоюға дайындайды. Сайт, API және SQLite дерекқоры бір контейнерде, HTTPS-ті Caddy өзі алады. **Бұл жерде ештеңе орнатылмаған — барлық қадамды иесі өзі орындайды.** Жалпы сипаттама, қауіпсіздік және VPS туралы толығырақ — [DEPLOY.md](DEPLOY.md).

> Бағалар — шамамен (2026 жылдың күзі). Төлемнің алдында [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator) арқылы тексеріңіз.

## 0. Алдымен заң туралы

Google Cloud-та **Қазақстан аймағы жоқ**. ҚР «Дербес деректер туралы» заңы бойынша оқушылардың дербес деректері ҚР аумағында сақталуы тиіс (DEPLOY.md §1). Сондықтан Google Cloud — **қорғау (защита), демо және сынақ** үшін: демо режим (`?demo=1`) мен сынақ аккаунттары. Нақты мектептің оқушылары үшін — қазақстандық VPS-ке көшу (§9).

## 1. Не болады

```
браузер ──HTTPS──▶ Caddy :443 ──▶ lab :8787 (Node 24: сайт + API + WebSocket)
                     │                 │
                     ▼                 ▼
          /mnt/disks/lab-data/caddy   /mnt/disks/lab-data/lab
          (сертификаттар)             lab.db · backups/ · voice-cache/
```

- **VM:** `e2-small` (2 vCPU үлесі, 2 GB RAM), Ubuntu 24.04 LTS, 20 GB жүйелік диск.
- **Деректер:** бөлек **persistent disk** `lab-data` (10 GB, pd-balanced). VM жойылса да, диск қалады.
- **HTTPS:** Caddy (Let's Encrypt сертификатын өзі алады, өзі жаңартады).
- **Құпиялар:** тек VM-дегі `.env` файлында (`chmod 600`), Git-те ешқашан жоқ.
- **Қайта қосылу:** контейнерлер `restart: unless-stopped`, Docker жүйемен бірге қосылады — VM қайта жүктелсе, сайт өзі көтеріледі.
- **Бэкап:** күн сайын 03:30 (Алматы уақыты) `data/lab.db` көшірмесі, соңғы 14-і сақталады; оған қоса дискінің күнделікті snapshot-ы (14 күн).
- **Шығын шегі:** $20 бюджетке ескерту (50 %, 90 %, 100 %).

### Шамамен құны (айына)

| Не | Еуропа аймағы (europe-central2, Варшава) |
|---|---|
| e2-small VM | ≈ $13–15 |
| Жүйелік диск 20 GB + деректер диск 10 GB (pd-balanced) | ≈ $3 |
| Тұрақты сыртқы IPv4 | ≈ $3.6 |
| Snapshot-тар (14 күн, тек өзгерістер) | < $1 |
| **Барлығы** | **≈ $19–22** |

Сынақ кезеңіндегі $300 кредит (90 күн) бұл шығынды толық жабады. 90 күн біткен соң аккаунтты ақылы етпесеңіз, VM тоқтайды; деректер дискіде қалады. Аймақ таңдауы: Алматыдан Варшава мен Франкфуртқа (europe-west3) пинг ≈ 70–90 мс; us-central1 арзанырақ, бірақ ≈ 200 мс.

## 2. Google Cloud жобасы, бюджет және ресурстар

Компьютеріңізге [gcloud CLI](https://cloud.google.com/sdk/docs/install) орнатып, `gcloud auth login` орындаңыз. Төмендегі мәндерді өзіңізге ауыстырыңыз:

```bash
PROJECT=bitlab-lab-2026
REGION=europe-central2
ZONE=europe-central2-a
BILLING=000000-000000-000000   # gcloud billing accounts list
```

```bash
gcloud projects create $PROJECT
gcloud config set project $PROJECT
gcloud billing projects link $PROJECT --billing-account=$BILLING
gcloud services enable compute.googleapis.com billingbudgets.googleapis.com
```

**$20 бюджетке ескерту** (хат иесінің поштасына келеді; ескерту шығынды өздігінен тоқтатпайды):

```bash
gcloud billing budgets create --billing-account=$BILLING --display-name="BitLab 20 USD" \
  --budget-amount=20USD --filter-projects=projects/$PROJECT \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
```

**Деректер дискі, тұрақты IP, VM:**

```bash
gcloud compute disks create lab-data --size=10GB --type=pd-balanced --zone=$ZONE
gcloud compute addresses create lab-ip --region=$REGION
gcloud compute instances create lab-vm --zone=$ZONE --machine-type=e2-small \
  --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB --boot-disk-type=pd-balanced \
  --disk=name=lab-data,device-name=lab-data,mode=rw,auto-delete=no \
  --address=lab-ip --tags=web
```

`device-name=lab-data` маңызды: VM ішінде диск `/dev/disk/by-id/google-lab-data` атымен көрінеді, `setup-vm.sh` оны осы атпен табады. `auto-delete=no` — VM жойылса да, деректер дискі қалады.

**Firewall:** тек веб (80, 443) барлығына ашық; SSH тек Google IAP арқылы:

```bash
gcloud compute firewall-rules create lab-web --allow=tcp:80,tcp:443,udp:443 --target-tags=web
gcloud compute firewall-rules create lab-ssh-iap --allow=tcp:22 --source-ranges=35.235.240.0/20 --target-tags=web
gcloud compute firewall-rules delete default-allow-ssh   # бар болса: SSH барлық интернетке ашық болмасын
```

**Дискінің күнделікті snapshot-ы** (04:00 Алматы = 23:00 UTC, 14 күн сақталады):

```bash
gcloud compute resource-policies create snapshot-schedule lab-daily --region=$REGION \
  --max-retention-days=14 --daily-schedule --start-time=23:00
gcloud compute disks add-resource-policies lab-data --resource-policies=lab-daily --zone=$ZONE
```

## 3. Домен

- **Өз доменіңіз болса:** тіркеушіде `A` жазбасы: `lab.example.kz → IP` (IP: `gcloud compute addresses describe lab-ip --region=$REGION --format='value(address)'`).
- **Қорғауға домен сатып алмай:** [sslip.io](https://sslip.io) атауы IP-ден өзі шығады: IP `34.118.10.20` болса, домен — `34-118-10-20.sslip.io`. Caddy оған да нағыз HTTPS сертификат алады.

## 4. VM-ді дайындау (бір рет)

```bash
gcloud compute ssh lab-vm --zone=$ZONE --tunnel-through-iap
```

VM ішінде:

```bash
git clone https://github.com/<иесі>/<репо>.git lab && cd lab
bash deploy/gcp/setup-vm.sh
exit   # docker тобы күшіне енуі үшін шығып, қайта кіріңіз
```

Репо жабық болса — GitHub-та тек оқуға арналған **deploy key** жасаңыз (Settings → Deploy keys) немесе `gh auth login`.

`setup-vm.sh` не істейді: деректер дискін **тек бос болса** форматтайды (бар деректі ешқашан өшірмейді), `/mnt/disks/lab-data`-ға тұрақты қосады, Docker орнатады, уақыт белдеуін Алматыға қояды, 2 GB swap қосады (сайтты құрастыруға e2-small-дың 2 GB жадынан көп керек) және күнделікті бэкап таймерін (`lab-backup.timer`) іске қосады.

## 5. `.env` және іске қосу

```bash
cd ~/lab
cp .env.example .env && chmod 600 .env && nano .env
```

`.env` ішінде міндетті:

| Айнымалы | Мәні |
|---|---|
| `DOMAIN` | `lab.example.kz` немесе `34-118-10-20.sslip.io` |
| `ALLOWED_ORIGINS` | `https://` + сол домен |
| `COOKIE_SECURE` | `true` |
| `GEMINI_API_KEY` | Биттің кілті (міндетті емес — онсыз дайын жауаптар жұмыс істейді) |
| `BIT_PROVIDER` | бос немесе `gemini`; `openai` — тек `OPENAI_API_KEY` қосылса |

Кілттерді ешқашан чатқа, скриншотқа немесе Git-ке салмаңыз.

```bash
docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml up -d --build
docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml exec lab npm run server:create-admin
```

Бірінші құрастыру e2-small-да ≈ 10–15 минут алады. Құпия сөзді өзіңіз тересіз, ол еш жерге жазылмайды.

**Биттің дайын дауыстарын көшіру** (Gemini квотасын үнемдейді): өз компьютеріңізде

```bash
gcloud compute scp --recurse data/voice-cache lab-vm:~/voice-cache --zone=$ZONE --tunnel-through-iap
```

VM-де:

```bash
sudo mkdir -p /mnt/disks/lab-data/lab/voice-cache && sudo cp -r ~/voice-cache/. /mnt/disks/lab-data/lab/voice-cache/ && sudo chown -R 1000:1000 /mnt/disks/lab-data/lab
```

## 6. Тексеру

```bash
docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml ps
curl -s https://$DOMAIN/api/health
systemctl list-timers lab-backup.timer
```

Браузерде: басты бет, `/lab`, `/studio`, `/login` → **Демо режим**, Биттің дауысы, сертификат. Әр бетте HTTPS құлпы бар.

## 7. Күнделікті жұмыс

- **Жаңарту:** `cd ~/lab && git pull && docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml up -d --build`
- **Логтар:** `docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml logs -f --tail=100 lab`
- **Бэкапты қазір жасау:** `sudo systemctl start lab-backup.service`, нәтижесі: `journalctl -u lab-backup -n 20`
- **Бэкаптар тізімі:** `ls -lh /mnt/disks/lab-data/lab/backups` (немесе админ панель → Бэкаптар; қалпына келтіру де сонда)
- **Бэкапты өз компьютеріңізге алу:** `gcloud compute scp lab-vm:/mnt/disks/lab-data/lab/backups/<файл> . --zone=$ZONE --tunnel-through-iap`
- **VM-ді уақытша тоқтату** (қорғаудан кейін): `gcloud compute instances stop lab-vm --zone=$ZONE` — VM ақысы тоқтайды, диск пен IP ақысы қалады.

## 8. Барлығын өшіру (шығын нөлге түсуі үшін)

Алдымен соңғы бэкапты өз компьютеріңізге көшіріңіз (§7), содан кейін:

```bash
gcloud compute instances delete lab-vm --zone=$ZONE
gcloud compute disks delete lab-data --zone=$ZONE
gcloud compute addresses delete lab-ip --region=$REGION
gcloud compute resource-policies delete lab-daily --region=$REGION
gcloud compute snapshots list   # қалған snapshot-тарды да: gcloud compute snapshots delete <атауы>
```

## 9. Кейін Қазақстандағы VPS-ке көшу (мысалы, Hoster.kz, PS.kz)

Сол Docker-файлдар, сол `.env`, сол деректер — тек басқа сервер.

1. **Бір күн бұрын** DNS-те `A` жазбасының TTL-ін 300 секундқа түсіріңіз.
2. Жаңа VPS-ті [DEPLOY.md](DEPLOY.md) §3 бойынша дайындаңыз (Ubuntu 24.04, Docker, ufw), репоны клондаңыз, `.env`-ті **scp арқылы** көшіріңіз (Git арқылы емес); `DOMAIN` сол күйі қалады.
3. Google Cloud-тағы VM-де сайтты тоқтатып, соңғы көшірмені жасаңыз:
   ```bash
   docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml stop lab
   sudo tar czf ~/lab-data.tgz -C /mnt/disks/lab-data lab
   ```
4. Архивті жаңа серверге көшіріңіз (`gcloud compute scp lab-vm:~/lab-data.tgz . --zone=$ZONE --tunnel-through-iap`, содан кейін `scp lab-data.tgz user@жаңа-сервер:`), жаңа серверде:
   ```bash
   docker compose up -d --no-start lab
   sudo tar xzf ~/lab-data.tgz -C /tmp && sudo cp -a /tmp/lab/. "$(docker volume inspect lab_lab-data -f '{{.Mountpoint}}')"/
   docker compose up -d --build
   ```
   (Томның аты — қалтаның атымен: `docker volume ls` арқылы тексеріңіз.)
5. DNS-тегі `A` жазбасын жаңа IP-ге ауыстырыңыз. Caddy жаңа серверде сертификатты өзі алады.
6. Бәрі жұмыс істейтінін тексеріп (§6), күнделікті бэкапты жаңа серверде cron арқылы қосыңыз:
   ```bash
   (crontab -l 2>/dev/null; echo '30 3 * * * cd ~/lab && docker compose exec -T lab npm run --silent server:backup -- --keep 14') | crontab -
   ```
7. Бір апта бақылаған соң, Google Cloud ресурстарын жойыңыз (§8).

Тексеру тізімі: кіру, демо режим, сертификат QR-ы жаңа доменде тексеріледі, мұғалім панелі тірі нәтижелерді көрсетеді, `/api/health` → `ok`.
