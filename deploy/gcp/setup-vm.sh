#!/usr/bin/env bash
# One-time setup of the Compute Engine VM (DEPLOY_GCP.md, V4 §12.2).
# Run on the VM as a user with sudo, from the project folder:
#
#   bash deploy/gcp/setup-vm.sh
#
# It: formats the data disk the first time only (never a disk that already has
# a file system), mounts it at /mnt/disks/lab-data for good (fstab), installs
# Docker, sets the clock to Almaty time, adds 2 GB of swap (building the site needs more than e2-small's
# 2 GB of memory), and installs the daily database backup (systemd timer).
# It reads no secrets and writes none.
set -euo pipefail

DISK=/dev/disk/by-id/google-lab-data
MOUNT=/mnt/disks/lab-data
HERE="$(cd "$(dirname "$0")/../.." && pwd)"

if [ ! -e "$DISK" ]; then
  echo "No disk named lab-data is attached (see DEPLOY_GCP.md, step 2)." >&2
  exit 1
fi

# 1. the data disk: a file system only if it has none (never wipes data)
if ! sudo blkid "$DISK" >/dev/null 2>&1; then
  echo "Formatting the new, empty data disk…"
  sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard "$DISK"
fi
sudo mkdir -p "$MOUNT"
if ! grep -q "$MOUNT" /etc/fstab; then
  echo "UUID=$(sudo blkid -s UUID -o value "$DISK") $MOUNT ext4 discard,defaults,nofail 0 2" | sudo tee -a /etc/fstab >/dev/null
fi
sudo mount -a
sudo mkdir -p "$MOUNT/lab" "$MOUNT/caddy/data" "$MOUNT/caddy/config"
# the lab container runs as the image's `node` user (uid 1000)
sudo chown -R 1000:1000 "$MOUNT/lab"

# 2. Docker and Compose
if ! command -v docker >/dev/null; then
  sudo apt-get update
  sudo apt-get -y install docker.io docker-compose-v2 git unattended-upgrades
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
fi

# 3. swap for the build
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# 4. the daily backup of data/lab.db (03:30 Almaty time, at night for the school; the newest 14 kept on the data disk)
sudo timedatectl set-timezone Asia/Almaty
sed "s#@DIR@#$HERE#g" "$HERE/deploy/gcp/lab-backup.service" | sudo tee /etc/systemd/system/lab-backup.service >/dev/null
sudo cp "$HERE/deploy/gcp/lab-backup.timer" /etc/systemd/system/lab-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now lab-backup.timer

echo
echo "Done. Next (DEPLOY_GCP.md, step 5): log out and in again (docker group), fill .env, then"
echo "  docker compose -f docker-compose.yml -f deploy/gcp/docker-compose.gcp.yml up -d --build"
